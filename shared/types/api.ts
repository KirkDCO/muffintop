/**
 * API response types
 */

import type { NutrientValues } from './nutrients.js';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  details: ValidationErrorDetail[];
}

// Stats types
export interface DailyIntake {
  nutrients: NutrientValues;
}

export interface DailyExpenditure {
  basal: number;
  activity: number;
  total: number;
}

export interface DailyProgress {
  calorieBalance: number;
  proteinPercent: number | null;
  carbsPercent: number | null;
  sugarPercent: number | null;
}

export interface DailyTargets {
  calories: number;
  protein: number | null;
  carbs: number | null;
  sugar: number | null;
}

export interface DailySummary {
  date: string;
  intake: DailyIntake;
  expenditure: DailyExpenditure;
  targets: DailyTargets | null;
  progress: DailyProgress;
  entries: import('./food-log.js').FoodLogEntry[];
}

export interface TrendDataPoint {
  date: string;
  nutrients: NutrientValues;
  weight: number | null;
  expenditure: number | null;
}

export interface TrendData {
  startDate: string;
  endDate: string;
  dataPoints: TrendDataPoint[];
  targets: DailyTargets | null;
}

export interface TrendQueryParams {
  startDate: string;
  endDate: string;
  metrics?: ('calories' | 'protein' | 'carbs' | 'sugar' | 'weight' | 'expenditure')[];
}
