import type { NutrientValues } from './nutrients.js';
import type { WeightUnit } from './metrics.js';
import type { TargetDirection } from './targets.js';

export interface DailyNutrientSummary {
  date: string;
  nutrients: NutrientValues;
  entryCount: number;
  activityCalories: number;
}

export interface DailyStatsResult {
  dailySummaries: DailyNutrientSummary[];
  startDate: string;
  endDate: string;
}

export interface DailyStatsQueryParams {
  startDate?: string;
  endDate?: string;
  days?: number;
}

// Longitudinal trend data types for analysis over time

export type TrendTimeRange =
  | 'week'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | 'lastyear'
  | 'all';

export interface NutrientDataPoint {
  date: string;
  value: number | null;
}

export interface WeightDataPoint {
  date: string;
  weightValue: number;
  weightUnit: WeightUnit;
  // Normalized to kg for consistent charting
  weightKg: number;
}

export interface EventDataPoint {
  date: string;
  description: string;
  color: string;
}

export interface ActivityDataPoint {
  date: string;
  activityCalories: number;
}

export interface LongitudinalTrendResult {
  startDate: string;
  endDate: string;
  timeRange: TrendTimeRange;
  // Daily nutrient summaries (aggregated for the period)
  nutrientData: NutrientDataPoint[];
  // Weight entries (sparse - only dates with entries)
  weightData: WeightDataPoint[];
  // Base target value for the selected nutrient (if set)
  nutrientTarget: number | null;
  // Direction of the target ('min' = try to reach, 'max' = stay under)
  nutrientTargetDirection: TargetDirection | null;
  // Activity calories per day (sparse - only dates with activity logged)
  activityData: ActivityDataPoint[];
  // User events (sparse - only dates with events)
  eventData: EventDataPoint[];
}

export interface LongitudinalTrendQuery {
  timeRange: TrendTimeRange;
  nutrient?: string; // Which nutrient to include (defaults to calories)
}
