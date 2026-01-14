/**
 * Recipe and RecipeIngredient entity types
 */

import type { NutrientValues } from './nutrients.js';
import type { FoodSummary } from './food.js';

export interface RecipeIngredient {
  id: number;
  foodId: number | null;
  customFoodId: number | null;
  foodName: string;
  quantityGrams: number;
  displayQuantity: string | null;
  position: number;
}

export interface RecipeSummary {
  id: number;
  name: string;
  servings: number;
  caloriesPerServing: number;
  createdAt: string;
}

export interface Recipe {
  id: number;
  name: string;
  servings: number;
  nutrients: NutrientValues;
  ingredients: RecipeIngredient[];
  tblspRecipeId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeIngredientInput {
  foodId?: number;
  customFoodId?: number;
  quantityGrams: number;
  displayQuantity?: string;
}

export interface CreateRecipeInput {
  name: string;
  servings: number;
  ingredients: CreateRecipeIngredientInput[];
}

export interface UpdateRecipeInput extends CreateRecipeInput {}

// tblsp import types
export interface TblspRecipeSummary {
  id: number;
  title: string;
  ingredientCount: number;
}

export interface TblspIngredientPreview {
  originalText: string;
  parsedName: string;
  parsedQuantity: string;
  suggestedFoods: FoodSummary[];
}

export interface TblspRecipePreview {
  id: number;
  title: string;
  ingredients: TblspIngredientPreview[];
}

export interface ImportIngredientMapping {
  originalText: string;
  foodId?: number;
  customFoodId?: number;
  quantityGrams: number;
  displayQuantity?: string;
}

export interface ImportTblspRecipeInput {
  tblspRecipeId: number;
  name?: string;
  servings?: number;
  ingredients: ImportIngredientMapping[];
}
