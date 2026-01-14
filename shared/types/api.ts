/**
 * API response types
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
  }[];
}

// Stats types
export interface DailyIntake {
  calories: number;
  protein: number;
  carbs: number;
  addedSugar: number | null;
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
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  sugar: number | null;
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
