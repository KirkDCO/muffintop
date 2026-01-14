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

export interface CustomFood {
  id: number;
  name: string;
  nutrients: NutrientValues;
  createdAt: string;
}

export interface CreateCustomFoodInput {
  name: string;
  nutrients: NutrientValues;
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
