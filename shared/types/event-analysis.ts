/**
 * Event analysis types for comparing pre-event nutrient patterns against baselines
 */

import type { NutrientKey } from './nutrients.js';
import type { IntakeType } from './intake.js';

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
