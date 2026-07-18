/**
 * Event analysis types for comparing pre-event nutrient patterns against baselines
 */

import type { NutrientKey } from './nutrients.js';
import type { IntakeType } from './intake.js';
import type { RatingDirection } from './rated-series.js';

export type EventSelectionMode = 'description' | 'instance';
export type AnalysisMetricKey = NutrientKey | IntakeType;

export interface EventAnalysisRequest {
  selectionMode: EventSelectionMode;
  /** Required when selectionMode='description' */
  eventDescription?: string;
  /** Required when selectionMode='instance' */
  eventId?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  lookbackDays: number; // 1-7
  metrics: AnalysisMetricKey[];
}

export interface MetricComparison {
  key: AnalysisMetricKey;
  displayName: string;
  unit: string;
  preEvent: { mean: number; stddev: number };
  baseline: { mean: number; stddev: number };
  /** (preEvent.mean - baseline.mean) / baseline.stddev */
  effectSize: number;
  /** ((preEvent.mean - baseline.mean) / baseline.mean) * 100 */
  percentDifference: number;
}

export interface FoodFrequencyEntry {
  foodName: string;
  /** 0-1 fraction of pre-event windows containing this food */
  preEventFrequency: number;
  /** 0-1 fraction of baseline windows containing this food */
  baselineFrequency: number;
  /** preEventFrequency - baselineFrequency */
  frequencyDifference: number;
  preEventCount: number;
  baselineCount: number;
}

export interface NutrientAnalysisResult {
  eventCount: number;
  eventDates: string[];
  comparisons: MetricComparison[];
  baselineWindowCount: number;
}

export interface FoodFrequencyAnalysisResult {
  eventCount: number;
  eventDates: string[];
  foods: FoodFrequencyEntry[];
  baselineWindowCount: number;
}

export interface EventAnalysisResponse {
  nutrientAnalysis: NutrientAnalysisResult | null;
  foodFrequencyAnalysis: FoodFrequencyAnalysisResult;
}

// ============================================
// Rated-event correlation analysis (continuous)
// ============================================

export interface EventCorrelationRequest {
  /** Rated series name (user_event.description with a rating) */
  eventDescription: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  /** Grid x-axis: test lags 0..maxLag (default 7) */
  maxLag: number;
  /** Grid y-axis: averaging windows 1..maxWindow (default 7) */
  maxWindow: number;
  metrics: AnalysisMetricKey[];
  /** Express nutrient metrics per 1000 kcal to control the calorie confounder */
  normalizePerKcal: boolean;
}

export interface CorrelationCell {
  lag: number; // days between rating day and most-recent day of the window (0..maxLag)
  window: number; // number of days averaged (1..maxWindow)
  n: number; // paired days with data
  pearson: number;
  pearsonP: number;
  /** Benjamini-Hochberg adjusted q-value across this metric's grid */
  qValue: number;
  spearman: number;
  spearmanP: number;
}

export interface MetricCorrelationGrid {
  key: AnalysisMetricKey;
  displayName: string;
  unit: string;
  meanRating: number;
  meanValue: number;
  /** Strongest |pearson| cell among cells with n >= minNThreshold (falls back to overall) */
  best: CorrelationCell;
  /** Full grid, row-major over lag 0..maxLag then window 1..maxWindow */
  cells: CorrelationCell[];
}

export interface FoodRatingComparison {
  foodName: string;
  daysWith: number;
  daysWithout: number;
  meanRatingWith: number;
  meanRatingWithout: number;
  /** meanRatingWith - meanRatingWithout */
  ratingDifference: number;
  /** Cohen's d (pooled) */
  effectSize: number;
}

export interface EventCorrelationResponse {
  direction: RatingDirection;
  ratingCount: number; // rated days found in range
  pairedDayCount: number; // rated days with at least some food data (same-day)
  ratingDates: string[];
  normalizedPerKcal: boolean;
  minNThreshold: number; // UI flags/hatches cells with n below this
  maxLag: number;
  maxWindow: number;
  metrics: MetricCorrelationGrid[];
  /** Same-day (lag 0, window 1) food-presence comparison */
  foodComparisons: FoodRatingComparison[];
}
