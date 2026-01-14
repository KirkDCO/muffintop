/**
 * FoodLog entity types
 */

import type { NutrientValues } from './nutrients.js';

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: number;
  logDate: string; // YYYY-MM-DD
  mealCategory: MealCategory;
  foodName: string;
  portionAmount: number;
  portionGrams: number;
  nutrients: NutrientValues;
  foodId: number | null;
  customFoodId: number | null;
  recipeId: number | null;
  createdAt: string;
}

export interface CreateFoodLogInput {
  logDate: string;
  mealCategory: MealCategory;
  foodId?: number;
  customFoodId?: number;
  recipeId?: number;
  portionAmount: number;
  portionGrams: number;
}

export interface UpdateFoodLogInput {
  logDate?: string;
  mealCategory?: MealCategory;
  portionAmount?: number;
  portionGrams?: number;
}

export interface RecentFood {
  foodId: number | null;
  customFoodId: number | null;
  recipeId: number | null;
  name: string;
  lastLoggedAt: string;
  typicalPortionGrams: number;
}

export interface FoodLogQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
}
