/**
 * DailyTarget and ActivityLog entity types
 */

import type { NutrientKey } from './nutrients.js';

/**
 * Direction for a nutrient target
 * - 'min': try to reach this amount (e.g., protein, fiber, vitamins)
 * - 'max': stay under this amount (e.g., calories, sugar, sodium)
 */
export type TargetDirection = 'min' | 'max';

/**
 * A single nutrient target with its value and direction
 */
export interface NutrientTarget {
  value: number;
  direction: TargetDirection;
}

/**
 * Default target directions for each nutrient
 * Used when creating targets to suggest sensible defaults
 */
export const DEFAULT_TARGET_DIRECTIONS: Partial<Record<NutrientKey, TargetDirection>> = {
  calories: 'max',
  protein: 'min',
  carbs: 'max',
  fiber: 'min',
  addedSugar: 'max',
  totalSugar: 'max',
  totalFat: 'max',
  saturatedFat: 'max',
  transFat: 'max',
  cholesterol: 'max',
  sodium: 'max',
  potassium: 'min',
  calcium: 'min',
  iron: 'min',
  vitaminA: 'min',
  vitaminC: 'min',
  vitaminD: 'min',
};

/**
 * User's daily targets configuration
 */
export interface DailyTarget {
  id: number;
  basalCalories: number;
  nutrientTargets: Partial<Record<NutrientKey, NutrientTarget>>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating daily targets
 */
export interface CreateDailyTargetInput {
  basalCalories: number;
  nutrientTargets?: Partial<Record<NutrientKey, NutrientTarget>>;
}

/**
 * Input for updating daily targets
 */
export interface UpdateDailyTargetInput {
  basalCalories?: number;
  nutrientTargets?: Partial<Record<NutrientKey, NutrientTarget>>;
}

/**
 * Activity log entry for a single day
 */
export interface ActivityEntry {
  id: number;
  logDate: string;
  activityCalories: number;
  createdAt: string;
}

/**
 * Input for creating/updating activity
 */
export interface CreateActivityInput {
  logDate: string;
  activityCalories: number;
}

/**
 * Query parameters for activity entries
 */
export interface ActivityQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Progress status for a nutrient target
 */
export type ProgressStatus = 'under' | 'met' | 'over';

/**
 * Calculated progress for a single nutrient
 */
export interface NutrientProgress {
  nutrientKey: NutrientKey;
  current: number;
  target: number;
  direction: TargetDirection;
  percentage: number;
  status: ProgressStatus;
}

/**
 * Calculate progress status based on percentage and direction
 */
export function calculateProgressStatus(
  percentage: number,
  direction: TargetDirection
): ProgressStatus {
  if (direction === 'min') {
    return percentage >= 100 ? 'met' : 'under';
  } else {
    return percentage > 100 ? 'over' : percentage >= 100 ? 'met' : 'under';
  }
}
