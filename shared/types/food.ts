/**
 * Food and FoodPortion entity types
 */

import type { NutrientValues } from './nutrients.js';

export interface FoodSummary {
  fdcId: number;
  description: string;
  dataType: 'foundation' | 'sr_legacy' | 'branded';
  brandOwner: string | null;
  nutrients: NutrientValues;
}

export interface FoodPortion {
  id: number;
  gramWeight: number;
  description: string;
  amount: number;
}

export interface FoodDetail extends FoodSummary {
  portions: FoodPortion[];
}

export interface CustomFoodPortion {
  id: number;
  description: string;
  servingMultiplier: number;
  gramWeight: number | null;
}

export interface CustomFood {
  id: number;
  userId: number;
  name: string;
  servingGrams: number | null;
  nutrients: NutrientValues;  // Per 1 serving
  portions: CustomFoodPortion[];
  isShared: boolean;
  createdAt: string;
}

export interface CustomFoodSummary {
  id: number;
  userId: number;
  name: string;
  caloriesPerServing: number;
  isShared: boolean;
  createdAt: string;
}

export interface CreateCustomFoodPortionInput {
  description: string;
  servingMultiplier: number;
  gramWeight?: number;
}

export interface CreateCustomFoodInput {
  name: string;
  servingGrams?: number;
  nutrients: Partial<NutrientValues>;  // Only big 4 required
  portions?: CreateCustomFoodPortionInput[];
  isShared?: boolean;
}

export interface FoodSearchParams {
  q: string;
  dataType?: 'foundation' | 'sr_legacy' | 'branded' | 'all';
  limit?: number;
}

export interface FoodSearchResult {
  foods: FoodSummary[];
  total: number;
}

export interface CustomFoodQueryParams {
  search?: string;
  limit?: number;
}

export interface CustomFoodListResult {
  customFoods: CustomFoodSummary[];
  total: number;
}
