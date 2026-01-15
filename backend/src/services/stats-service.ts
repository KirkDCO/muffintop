import { getDb } from '../db/connection.js';
import type {
  NutrientValues,
  NutrientKey,
  DailyNutrientSummary,
  DailyStatsResult,
  TrendTimeRange,
  NutrientDataPoint,
  WeightDataPoint,
  LongitudinalTrendResult,
  WeightUnit,
} from '@muffintop/shared/types';

const NUTRIENT_KEYS: (keyof NutrientValues)[] = [
  'calories',
  'protein',
  'carbs',
  'totalFat',
  'fiber',
  'addedSugar',
  'totalSugar',
  'saturatedFat',
  'transFat',
  'cholesterol',
  'sodium',
  'potassium',
  'calcium',
  'iron',
  'vitaminA',
  'vitaminC',
  'vitaminD',
];

function createEmptyNutrients(): NutrientValues {
  const nutrients: Partial<NutrientValues> = {};
  for (const key of NUTRIENT_KEYS) {
    nutrients[key] = 0;
  }
  return nutrients as NutrientValues;
}

/**
 * Get daily nutrient summaries for a date range
 */
export function getDailySummaries(
  userId: number,
  startDate: string,
  endDate: string
): DailyStatsResult {
  const db = getDb();

  // Query aggregates nutrients by date with activity calories
  const stmt = db.prepare(`
    SELECT
      fl.log_date as date,
      SUM(fl.calories) as calories,
      SUM(fl.protein) as protein,
      SUM(fl.carbs) as carbs,
      SUM(fl.total_fat) as totalFat,
      SUM(fl.fiber) as fiber,
      SUM(fl.added_sugar) as addedSugar,
      SUM(fl.total_sugar) as totalSugar,
      SUM(fl.saturated_fat) as saturatedFat,
      SUM(fl.trans_fat) as transFat,
      SUM(fl.cholesterol) as cholesterol,
      SUM(fl.sodium) as sodium,
      SUM(fl.potassium) as potassium,
      SUM(fl.calcium) as calcium,
      SUM(fl.iron) as iron,
      SUM(fl.vitamin_a) as vitaminA,
      SUM(fl.vitamin_c) as vitaminC,
      SUM(fl.vitamin_d) as vitaminD,
      COUNT(*) as entryCount,
      al.activity_calories as activityCalories
    FROM food_log fl
    LEFT JOIN activity_log al ON fl.user_id = al.user_id AND fl.log_date = al.log_date
    WHERE fl.user_id = ? AND fl.log_date >= ? AND fl.log_date <= ?
    GROUP BY fl.log_date
    ORDER BY fl.log_date ASC
  `);

  const rows = stmt.all(userId, startDate, endDate) as Array<{
    date: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    totalFat: number | null;
    fiber: number | null;
    addedSugar: number | null;
    totalSugar: number | null;
    saturatedFat: number | null;
    transFat: number | null;
    cholesterol: number | null;
    sodium: number | null;
    potassium: number | null;
    calcium: number | null;
    iron: number | null;
    vitaminA: number | null;
    vitaminC: number | null;
    vitaminD: number | null;
    entryCount: number;
    activityCalories: number | null;
  }>;

  // Get activity data for days that might not have food logs
  const activityStmt = db.prepare(`
    SELECT log_date as date, activity_calories as activityCalories
    FROM activity_log
    WHERE user_id = ? AND log_date >= ? AND log_date <= ?
  `);
  const activityRows = activityStmt.all(userId, startDate, endDate) as Array<{
    date: string;
    activityCalories: number;
  }>;
  const activityByDate = new Map(activityRows.map((r) => [r.date, r.activityCalories]));

  // Create a map of dates with data
  const dataByDate = new Map<string, DailyNutrientSummary>();
  for (const row of rows) {
    const nutrients = createEmptyNutrients();
    for (const key of NUTRIENT_KEYS) {
      nutrients[key] = row[key] ?? 0;
    }
    dataByDate.set(row.date, {
      date: row.date,
      nutrients,
      entryCount: row.entryCount,
      activityCalories: row.activityCalories ?? 0,
    });
  }

  // Fill in missing dates with zeros
  const dailySummaries: DailyNutrientSummary[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const existing = dataByDate.get(dateStr);
    if (existing) {
      dailySummaries.push(existing);
    } else {
      // Day with no food logs - still might have activity
      dailySummaries.push({
        date: dateStr,
        nutrients: createEmptyNutrients(),
        entryCount: 0,
        activityCalories: activityByDate.get(dateStr) ?? 0,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    dailySummaries,
    startDate,
    endDate,
  };
}

/**
 * Get daily summaries for the last N days (including today)
 */
export function getDailySummariesForLastDays(
  userId: number,
  days: number = 7
): DailyStatsResult {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startDateStr = startDate.toISOString().split('T')[0];

  return getDailySummaries(userId, startDateStr, endDate);
}

/**
 * Calculate date range based on time range selection
 */
function getDateRangeForTimeRange(timeRange: TrendTimeRange): { startDate: string; endDate: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  let startDate: Date;

  switch (timeRange) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      break;
    case '3months':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
      break;
    case 'lastyear':
      startDate = new Date(now.getFullYear() - 1, 0, 1); // Jan 1 of last year
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0], // Dec 31 of last year
      };
    case 'all':
      startDate = new Date('2000-01-01'); // Far back enough to capture all data
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today,
  };
}

/**
 * Convert weight to kg for consistent charting
 */
function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * 0.453592 : value;
}

/**
 * Get trend data for longitudinal analysis
 * Returns nutrient data and weight data for the specified time range
 */
export function getTrendData(
  userId: number,
  timeRange: TrendTimeRange,
  nutrient: NutrientKey = 'calories'
): LongitudinalTrendResult {
  const db = getDb();
  const { startDate, endDate } = getDateRangeForTimeRange(timeRange);

  // Get daily nutrient values for the selected nutrient
  const nutrientColumn = nutrientKeyToColumn(nutrient);
  const nutrientStmt = db.prepare(`
    SELECT
      log_date as date,
      SUM(${nutrientColumn}) as value
    FROM food_log
    WHERE user_id = ? AND log_date >= ? AND log_date <= ?
    GROUP BY log_date
    ORDER BY log_date ASC
  `);

  const nutrientRows = nutrientStmt.all(userId, startDate, endDate) as Array<{
    date: string;
    value: number | null;
  }>;

  // Create nutrient data with all dates in range
  const nutrientByDate = new Map(nutrientRows.map((r) => [r.date, r.value]));
  const nutrientData: NutrientDataPoint[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    nutrientData.push({
      date: dateStr,
      value: nutrientByDate.get(dateStr) ?? null,
    });
    current.setDate(current.getDate() + 1);
  }

  // Get weight entries (sparse data - only dates with entries)
  const weightStmt = db.prepare(`
    SELECT
      metric_date as date,
      weight_value as weightValue,
      weight_unit as weightUnit
    FROM body_metric
    WHERE user_id = ? AND metric_date >= ? AND metric_date <= ?
    ORDER BY metric_date ASC
  `);

  const weightRows = weightStmt.all(userId, startDate, endDate) as Array<{
    date: string;
    weightValue: number;
    weightUnit: string;
  }>;

  const weightData: WeightDataPoint[] = weightRows.map((row) => ({
    date: row.date,
    weightValue: row.weightValue,
    weightUnit: row.weightUnit as WeightUnit,
    weightKg: toKg(row.weightValue, row.weightUnit as WeightUnit),
  }));

  // Get target for the selected nutrient
  let nutrientTarget: number | null = null;
  if (nutrient === 'calories') {
    const targetStmt = db.prepare(
      'SELECT basal_calories FROM daily_target WHERE user_id = ?'
    );
    const targetRow = targetStmt.get(userId) as { basal_calories: number } | undefined;
    nutrientTarget = targetRow?.basal_calories ?? null;
  } else {
    const targetStmt = db.prepare(
      'SELECT nutrient_targets FROM daily_target WHERE user_id = ?'
    );
    const targetRow = targetStmt.get(userId) as { nutrient_targets: string } | undefined;
    if (targetRow) {
      try {
        const targets = JSON.parse(targetRow.nutrient_targets);
        nutrientTarget = targets[nutrient]?.value ?? null;
      } catch {
        nutrientTarget = null;
      }
    }
  }

  return {
    startDate,
    endDate,
    timeRange,
    nutrientData,
    weightData,
    nutrientTarget,
  };
}

/**
 * Convert nutrient key to database column name
 */
function nutrientKeyToColumn(key: NutrientKey): string {
  const mapping: Record<NutrientKey, string> = {
    calories: 'calories',
    protein: 'protein',
    carbs: 'carbs',
    totalFat: 'total_fat',
    fiber: 'fiber',
    addedSugar: 'added_sugar',
    totalSugar: 'total_sugar',
    saturatedFat: 'saturated_fat',
    transFat: 'trans_fat',
    cholesterol: 'cholesterol',
    sodium: 'sodium',
    potassium: 'potassium',
    calcium: 'calcium',
    iron: 'iron',
    vitaminA: 'vitamin_a',
    vitaminC: 'vitamin_c',
    vitaminD: 'vitamin_d',
  };
  return mapping[key] || 'calories';
}
