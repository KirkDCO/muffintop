import { getDb } from '../db/connection.js';
import { nutrientKeyToColumn } from './stats-service.js';
import { ValidationError } from '../middleware/error-handler.js';
import {
  pearson,
  spearman,
  correlationPValue,
  benjaminiHochberg,
  cohensD,
} from './statistics.js';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  INTAKE_TYPES,
  type NutrientKey,
  type IntakeType,
  type RatingDirection,
  type EventCorrelationRequest,
  type EventCorrelationResponse,
  type CorrelationCell,
  type MetricCorrelationGrid,
  type FoodRatingComparison,
  type AnalysisMetricKey,
} from '@muffintop/shared/types';

const MIN_N_THRESHOLD = 10;

const INTAKE_DISPLAY: Record<IntakeType, { displayName: string; unit: string }> = {
  water: { displayName: 'Water', unit: 'ml' },
  caffeine: { displayName: 'Caffeine', unit: 'mg' },
  alcohol: { displayName: 'Alcohol', unit: 'drinks' },
};

function isNutrientKey(key: string): key is NutrientKey {
  return ALL_NUTRIENT_KEYS.includes(key as NutrientKey);
}

function isIntakeType(key: string): key is IntakeType {
  return (INTAKE_TYPES as readonly string[]).includes(key);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

export const eventCorrelationService = {
  analyze(userId: number, request: EventCorrelationRequest): EventCorrelationResponse {
    const db = getDb();
    const { eventDescription, startDate, endDate, maxLag, maxWindow, metrics, normalizePerKcal } =
      request;

    // 1. Rated days for this series
    const ratingRows = db
      .prepare(
        `SELECT event_date, rating
         FROM user_event
         WHERE user_id = ? AND description = ? AND rating IS NOT NULL
           AND event_date >= ? AND event_date <= ?
         ORDER BY event_date ASC`
      )
      .all(userId, eventDescription, startDate, endDate) as Array<{
      event_date: string;
      rating: number;
    }>;

    if (ratingRows.length === 0) {
      throw new ValidationError('No rated days found for this series in the date range');
    }

    const ratingByDate = new Map<string, number>();
    for (const r of ratingRows) ratingByDate.set(r.event_date, r.rating);
    const ratingDates = ratingRows.map((r) => r.event_date);

    // Series direction (defaults to higher_better)
    const seriesRow = db
      .prepare(
        `SELECT direction FROM rated_event_series WHERE user_id = ? AND description = ?`
      )
      .get(userId, eventDescription) as { direction: string } | undefined;
    const direction = (seriesRow?.direction as RatingDirection) ?? 'higher_better';

    // 2. Query range covers the furthest lookback (lag + window)
    const minRatingDate = ratingDates[0];
    const maxRatingDate = ratingDates[ratingDates.length - 1];
    const queryStart = addDays(minRatingDate, -(maxLag + maxWindow - 1));
    const queryEnd = maxRatingDate;

    const nutrientMetrics = metrics.filter(isNutrientKey);
    const intakeMetrics = metrics.filter(isIntakeType);

    // 3. Daily nutrient totals (include calories when normalizing)
    const nutrientByDate = new Map<string, Record<string, number>>();
    const nutrientCols = new Set<NutrientKey>(nutrientMetrics);
    if (normalizePerKcal) nutrientCols.add('calories');
    if (nutrientCols.size > 0) {
      const columns = Array.from(nutrientCols)
        .map((k) => `SUM(${nutrientKeyToColumn(k)}) as "${k}"`)
        .join(', ');
      const rows = db
        .prepare(
          `SELECT log_date, ${columns} FROM food_log
           WHERE user_id = ? AND log_date >= ? AND log_date <= ?
           GROUP BY log_date`
        )
        .all(userId, queryStart, queryEnd) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const date = row.log_date as string;
        const values: Record<string, number> = {};
        for (const k of nutrientCols) values[k] = (row[k] as number) ?? 0;
        nutrientByDate.set(date, values);
      }
    }

    // 4. Daily intake totals
    const intakeByDate = new Map<string, Record<string, number>>();
    if (intakeMetrics.length > 0) {
      const placeholders = intakeMetrics.map(() => '?').join(', ');
      const rows = db
        .prepare(
          `SELECT log_date, intake_type, SUM(amount) as total FROM intake_log
           WHERE user_id = ? AND log_date >= ? AND log_date <= ?
             AND intake_type IN (${placeholders})
           GROUP BY log_date, intake_type`
        )
        .all(userId, queryStart, queryEnd, ...intakeMetrics) as Array<{
        log_date: string;
        intake_type: string;
        total: number;
      }>;
      for (const row of rows) {
        let entry = intakeByDate.get(row.log_date);
        if (!entry) {
          entry = {};
          intakeByDate.set(row.log_date, entry);
        }
        entry[row.intake_type] = row.total;
      }
    }

    // Metric value on a single day (null = no data / not computable)
    const metricValueOnDate = (key: AnalysisMetricKey, date: string): number | null => {
      if (isNutrientKey(key)) {
        const rec = nutrientByDate.get(date);
        if (!rec) return null;
        const raw = rec[key] ?? 0;
        if (normalizePerKcal && key !== 'calories') {
          const cal = rec.calories ?? 0;
          if (cal <= 0) return null;
          return (raw / cal) * 1000;
        }
        return raw;
      }
      const rec = intakeByDate.get(date);
      if (!rec || !(key in rec)) return null;
      return rec[key];
    };

    // Averaged metric value over the window for cell (lag, window) on rating day d
    const windowValue = (key: AnalysisMetricKey, d: string, lag: number, window: number): number | null => {
      let sum = 0;
      let count = 0;
      for (let offset = 0; offset < window; offset++) {
        const date = addDays(d, -(lag + offset));
        const v = metricValueOnDate(key, date);
        if (v !== null) {
          sum += v;
          count++;
        }
      }
      return count > 0 ? sum / count : null;
    };

    // 5. Build the grid per metric
    const metricGrids: MetricCorrelationGrid[] = metrics.map((key) => {
      const cells: CorrelationCell[] = [];
      // Paired samples per cell, aligned by index (kept separate from the output cells)
      const samples: Array<{ ratings: number[]; values: number[] }> = [];

      for (let lag = 0; lag <= maxLag; lag++) {
        for (let window = 1; window <= maxWindow; window++) {
          const ratings: number[] = [];
          const values: number[] = [];
          for (const d of ratingDates) {
            const v = windowValue(key, d, lag, window);
            if (v !== null) {
              ratings.push(ratingByDate.get(d)!);
              values.push(v);
            }
          }
          const n = ratings.length;
          const r = pearson(ratings, values);
          const rho = spearman(ratings, values);
          cells.push({
            lag,
            window,
            n,
            pearson: round(r, 4),
            pearsonP: correlationPValue(r, n),
            qValue: 1,
            spearman: round(rho, 4),
            spearmanP: correlationPValue(rho, n),
          });
          samples.push({ ratings, values });
        }
      }

      // FDR across this metric's grid
      const qValues = benjaminiHochberg(cells.map((c) => c.pearsonP));
      cells.forEach((c, i) => {
        c.qValue = round(qValues[i], 5);
        c.pearsonP = round(c.pearsonP, 5);
        c.spearmanP = round(c.spearmanP, 5);
      });

      // Best cell: strongest |pearson| among cells meeting the min-n bar
      const eligibleIdx = cells
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.n >= MIN_N_THRESHOLD);
      const pool = eligibleIdx.length > 0 ? eligibleIdx : cells.map((c, i) => ({ c, i }));
      const bestEntry = pool.reduce((a, b) =>
        Math.abs(b.c.pearson) > Math.abs(a.c.pearson) ? b : a
      );
      const best = bestEntry.c;
      const bestSamples = samples[bestEntry.i];

      const meanRating =
        bestSamples.ratings.length > 0
          ? bestSamples.ratings.reduce((s, v) => s + v, 0) / bestSamples.ratings.length
          : 0;
      const meanValue =
        bestSamples.values.length > 0
          ? bestSamples.values.reduce((s, v) => s + v, 0) / bestSamples.values.length
          : 0;

      let displayName: string;
      let unit: string;
      if (isNutrientKey(key)) {
        const def = NUTRIENT_REGISTRY[key];
        displayName = def.displayName;
        unit = normalizePerKcal && key !== 'calories' ? `${def.unit}/1000kcal` : def.unit;
      } else {
        displayName = INTAKE_DISPLAY[key].displayName;
        unit = INTAKE_DISPLAY[key].unit;
      }

      return {
        key,
        displayName,
        unit,
        meanRating: round(meanRating, 3),
        meanValue: round(meanValue, 3),
        best,
        cells,
      };
    });

    // Sort metrics by strength of their best correlation
    metricGrids.sort((a, b) => Math.abs(b.best.pearson) - Math.abs(a.best.pearson));

    // 6. Same-day food-presence comparison
    const foodRows = db
      .prepare(
        `SELECT fl.log_date,
          COALESCE(f.description, cf.name, r.name, fl.logged_food_name) as food_name
         FROM food_log fl
         LEFT JOIN food f ON fl.food_id = f.fdc_id
         LEFT JOIN custom_food cf ON fl.custom_food_id = cf.id
         LEFT JOIN recipe r ON fl.recipe_id = r.id
         WHERE fl.user_id = ? AND fl.log_date >= ? AND fl.log_date <= ?`
      )
      .all(userId, minRatingDate, maxRatingDate) as Array<{
      log_date: string;
      food_name: string | null;
    }>;

    const foodsByDate = new Map<string, Set<string>>();
    for (const row of foodRows) {
      if (!row.food_name) continue;
      let set = foodsByDate.get(row.log_date);
      if (!set) {
        set = new Set();
        foodsByDate.set(row.log_date, set);
      }
      set.add(row.food_name);
    }

    // Rating days that actually have food logged (same-day)
    const foodRatingDays = ratingDates.filter((d) => foodsByDate.has(d));
    const pairedDayCount = foodRatingDays.length;

    // Candidate foods: those eaten on at least one rating day
    const allFoods = new Set<string>();
    for (const d of foodRatingDays) {
      for (const f of foodsByDate.get(d)!) allFoods.add(f);
    }

    const foodComparisons: FoodRatingComparison[] = [];
    for (const food of allFoods) {
      const withArr: number[] = [];
      const withoutArr: number[] = [];
      for (const d of foodRatingDays) {
        const rating = ratingByDate.get(d)!;
        if (foodsByDate.get(d)!.has(food)) withArr.push(rating);
        else withoutArr.push(rating);
      }
      if (withArr.length < 2 || withoutArr.length < 2) continue;
      const meanWith = withArr.reduce((s, v) => s + v, 0) / withArr.length;
      const meanWithout = withoutArr.reduce((s, v) => s + v, 0) / withoutArr.length;
      foodComparisons.push({
        foodName: food,
        daysWith: withArr.length,
        daysWithout: withoutArr.length,
        meanRatingWith: round(meanWith, 2),
        meanRatingWithout: round(meanWithout, 2),
        ratingDifference: round(meanWith - meanWithout, 2),
        effectSize: round(cohensD(withArr, withoutArr), 2),
      });
    }
    foodComparisons.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));

    return {
      direction,
      ratingCount: ratingDates.length,
      pairedDayCount,
      ratingDates,
      normalizedPerKcal: normalizePerKcal,
      minNThreshold: MIN_N_THRESHOLD,
      maxLag,
      maxWindow,
      metrics: metricGrids,
      foodComparisons,
    };
  },
};
