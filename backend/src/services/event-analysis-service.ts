import { getDb } from '../db/connection.js';
import { nutrientKeyToColumn } from './stats-service.js';
import { ValidationError } from '../middleware/error-handler.js';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  INTAKE_TYPES,
  type NutrientKey,
  type IntakeType,
  type EventAnalysisRequest,
  type EventAnalysisResponse,
  type MetricComparison,
  type FoodFrequencyEntry,
  type AnalysisMetricKey,
} from '@muffintop/shared/types';

interface DateWindow {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

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

/**
 * Add N days to a YYYY-MM-DD date string
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Check if two date ranges overlap
 */
function rangesOverlap(a: DateWindow, b: DateWindow): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Compute sample mean and standard deviation
 */
function meanStddev(values: number[]): { mean: number; stddev: number } {
  if (values.length === 0) return { mean: 0, stddev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length === 1) return { mean, stddev: 0 };
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return { mean, stddev: Math.sqrt(variance) };
}

/**
 * Enumerate all dates from start to end inclusive
 */
function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export const eventAnalysisService = {
  analyze(userId: number, request: EventAnalysisRequest): EventAnalysisResponse {
    const db = getDb();
    const { selectionMode, startDate, endDate, lookbackDays, metrics } = request;

    // 1. Gather event dates
    let eventDates: string[];
    if (selectionMode === 'description') {
      const stmt = db.prepare(`
        SELECT DISTINCT event_date
        FROM user_event
        WHERE user_id = ? AND description = ? AND event_date >= ? AND event_date <= ?
        ORDER BY event_date ASC
      `);
      const rows = stmt.all(userId, request.eventDescription, startDate, endDate) as Array<{
        event_date: string;
      }>;
      eventDates = rows.map((r) => r.event_date);
    } else {
      const stmt = db.prepare(`
        SELECT event_date
        FROM user_event
        WHERE user_id = ? AND id = ? AND event_date >= ? AND event_date <= ?
      `);
      const row = stmt.get(userId, request.eventId, startDate, endDate) as
        | { event_date: string }
        | undefined;
      eventDates = row ? [row.event_date] : [];
    }

    if (eventDates.length === 0) {
      throw new ValidationError('No matching events found in the specified date range');
    }

    // 2. Compute pre-event windows
    // For each event, lookback window = N days ending day before event
    const preEventWindows: DateWindow[] = eventDates.map((eventDate) => ({
      start: addDays(eventDate, -lookbackDays),
      end: addDays(eventDate, -1),
    }));

    // 3. Build exclusion ranges: [window.start, event_date] for each event
    const exclusionRanges: DateWindow[] = eventDates.map((eventDate, i) => ({
      start: preEventWindows[i].start,
      end: eventDate,
    }));

    // 4. Sample baseline windows
    // Enumerate all possible N-day windows in [startDate, endDate]
    const allWindowStarts = enumerateDates(startDate, addDays(endDate, -(lookbackDays - 1)));
    const validBaselineWindows: DateWindow[] = [];

    for (const ws of allWindowStarts) {
      const window: DateWindow = { start: ws, end: addDays(ws, lookbackDays - 1) };
      const overlaps = exclusionRanges.some((ex) => rangesOverlap(window, ex));
      if (!overlaps) {
        validBaselineWindows.push(window);
      }
    }

    shuffle(validBaselineWindows);
    const baselineWindows = validBaselineWindows.slice(0, 100);
    const baselineWindowCount = baselineWindows.length;

    // 5. Determine overall date range for queries (covers all windows)
    const allWindows = [...preEventWindows, ...baselineWindows];
    let queryStart = allWindows[0]?.start ?? startDate;
    let queryEnd = allWindows[0]?.end ?? endDate;
    for (const w of allWindows) {
      if (w.start < queryStart) queryStart = w.start;
      if (w.end > queryEnd) queryEnd = w.end;
    }

    // Separate metrics into nutrients and intake types
    const nutrientMetrics = metrics.filter(isNutrientKey);
    const intakeMetrics = metrics.filter(isIntakeType);

    // 6. Fetch nutrient data
    const nutrientByDate = new Map<string, Record<string, number>>();
    if (nutrientMetrics.length > 0) {
      const columns = nutrientMetrics
        .map((k) => `SUM(${nutrientKeyToColumn(k)}) as "${k}"`)
        .join(', ');
      const stmt = db.prepare(`
        SELECT log_date, ${columns}
        FROM food_log
        WHERE user_id = ? AND log_date >= ? AND log_date <= ?
        GROUP BY log_date
      `);
      const rows = stmt.all(userId, queryStart, queryEnd) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const date = row.log_date as string;
        const values: Record<string, number> = {};
        for (const k of nutrientMetrics) {
          values[k] = (row[k] as number) ?? 0;
        }
        nutrientByDate.set(date, values);
      }
    }

    // 7. Fetch intake data
    const intakeByDate = new Map<string, Record<string, number>>();
    if (intakeMetrics.length > 0) {
      const placeholders = intakeMetrics.map(() => '?').join(', ');
      const stmt = db.prepare(`
        SELECT log_date, intake_type, SUM(amount) as total
        FROM intake_log
        WHERE user_id = ? AND log_date >= ? AND log_date <= ?
          AND intake_type IN (${placeholders})
        GROUP BY log_date, intake_type
      `);
      const rows = stmt.all(userId, queryStart, queryEnd, ...intakeMetrics) as Array<{
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

    // Track which dates have data (only dates with actual log entries)
    const foodDataDates = new Set(nutrientByDate.keys());

    // 8. Compute per-window means for a set of windows
    // Only days with actual data count; windows with zero data days are excluded
    function computeWindowMeans(
      windows: DateWindow[]
    ): Map<AnalysisMetricKey, number[]> {
      const result = new Map<AnalysisMetricKey, number[]>();
      for (const key of metrics) {
        result.set(key, []);
      }

      for (const window of windows) {
        const dates = enumerateDates(window.start, window.end);
        for (const key of metrics) {
          let sum = 0;
          let daysWithData = 0;
          for (const date of dates) {
            if (isNutrientKey(key)) {
              if (foodDataDates.has(date)) {
                sum += nutrientByDate.get(date)![key] ?? 0;
                daysWithData++;
              }
            } else {
              const dayIntake = intakeByDate.get(date);
              if (dayIntake && key in dayIntake) {
                sum += dayIntake[key];
                daysWithData++;
              }
            }
          }
          // Skip this window for this metric if no days had data
          if (daysWithData > 0) {
            result.get(key)!.push(sum / daysWithData);
          }
        }
      }

      return result;
    }

    // 9. Compute stats
    let nutrientAnalysis = null;
    if (metrics.length > 0) {
      const preEventMeans = computeWindowMeans(preEventWindows);
      const baselineMeans = computeWindowMeans(baselineWindows);

      const comparisons: MetricComparison[] = metrics.map((key) => {
        const pre = meanStddev(preEventMeans.get(key)!);
        const base = meanStddev(baselineMeans.get(key)!);

        const effectSize = base.stddev > 0 ? (pre.mean - base.mean) / base.stddev : 0;
        const percentDifference = base.mean > 0 ? ((pre.mean - base.mean) / base.mean) * 100 : 0;

        let displayName: string;
        let unit: string;
        if (isNutrientKey(key)) {
          const def = NUTRIENT_REGISTRY[key];
          displayName = def.displayName;
          unit = def.unit;
        } else {
          displayName = INTAKE_DISPLAY[key].displayName;
          unit = INTAKE_DISPLAY[key].unit;
        }

        return {
          key,
          displayName,
          unit,
          preEvent: { mean: Math.round(pre.mean * 100) / 100, stddev: Math.round(pre.stddev * 100) / 100 },
          baseline: { mean: Math.round(base.mean * 100) / 100, stddev: Math.round(base.stddev * 100) / 100 },
          effectSize: Math.round(effectSize * 100) / 100,
          percentDifference: Math.round(percentDifference * 100) / 100,
        };
      });

      comparisons.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));

      nutrientAnalysis = {
        eventCount: eventDates.length,
        eventDates,
        comparisons,
        baselineWindowCount,
      };
    }

    // 10. Food frequency analysis
    // Use base food/recipe/custom food name (not logged_food_name which has per-date suffixes)
    const foodStmt = db.prepare(`
      SELECT fl.log_date,
        COALESCE(f.description, cf.name, r.name, fl.logged_food_name) as food_name
      FROM food_log fl
      LEFT JOIN food f ON fl.food_id = f.fdc_id
      LEFT JOIN custom_food cf ON fl.custom_food_id = cf.id
      LEFT JOIN recipe r ON fl.recipe_id = r.id
      WHERE fl.user_id = ? AND fl.log_date >= ? AND fl.log_date <= ?
    `);
    const foodRows = foodStmt.all(userId, queryStart, queryEnd) as Array<{
      log_date: string;
      food_name: string | null;
    }>;

    // Build a map: date -> Set of food names
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

    // Count food appearances in windows (only windows with food data count)
    function countFoodFrequency(windows: DateWindow[]): { counts: Map<string, number>; windowsWithData: number } {
      const counts = new Map<string, number>();
      let windowsWithData = 0;
      for (const window of windows) {
        const dates = enumerateDates(window.start, window.end);
        const hasData = dates.some((d) => foodsByDate.has(d));
        if (!hasData) continue;
        windowsWithData++;
        const windowFoods = new Set<string>();
        for (const date of dates) {
          const foods = foodsByDate.get(date);
          if (foods) {
            for (const f of foods) windowFoods.add(f);
          }
        }
        for (const food of windowFoods) {
          counts.set(food, (counts.get(food) ?? 0) + 1);
        }
      }
      return { counts, windowsWithData };
    }

    const preEventFood = countFoodFrequency(preEventWindows);
    const baselineFood = countFoodFrequency(baselineWindows);

    // Collect all food names
    const allFoodNames = new Set<string>();
    for (const name of preEventFood.counts.keys()) allFoodNames.add(name);
    for (const name of baselineFood.counts.keys()) allFoodNames.add(name);

    const foods: FoodFrequencyEntry[] = [];
    const preEventTotal = preEventFood.windowsWithData;
    const baselineTotal = baselineFood.windowsWithData;

    for (const foodName of allFoodNames) {
      const preCount = preEventFood.counts.get(foodName) ?? 0;
      const baseCount = baselineFood.counts.get(foodName) ?? 0;
      const preFreq = preEventTotal > 0 ? preCount / preEventTotal : 0;
      const baseFreq = baselineTotal > 0 ? baseCount / baselineTotal : 0;

      foods.push({
        foodName,
        preEventFrequency: Math.round(preFreq * 1000) / 1000,
        baselineFrequency: Math.round(baseFreq * 1000) / 1000,
        frequencyDifference: Math.round((preFreq - baseFreq) * 1000) / 1000,
        preEventCount: preCount,
        baselineCount: baseCount,
      });
    }

    // Sort by |difference| descending
    foods.sort((a, b) => Math.abs(b.frequencyDifference) - Math.abs(a.frequencyDifference));

    return {
      nutrientAnalysis,
      foodFrequencyAnalysis: {
        eventCount: eventDates.length,
        eventDates,
        foods,
        baselineWindowCount,
      },
    };
  },
};
