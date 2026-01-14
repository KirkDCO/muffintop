/**
 * Food and FoodPortion entity types
 */

export interface FoodSummary {
  fdcId: number;
  description: string;
  dataType: 'foundation' | 'sr_legacy' | 'branded';
  brandOwner: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  addedSugar: number | null;
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
  calories: number;
  protein: number;
  carbs: number;
  addedSugar: number;
  createdAt: string;
}

export interface CreateCustomFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  addedSugar: number;
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
