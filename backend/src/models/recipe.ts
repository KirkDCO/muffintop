import { z } from 'zod';

/**
 * Ingredient input for creating/updating recipes
 * Supports USDA foods, custom foods, or other recipes as ingredients
 */
export const createRecipeIngredientSchema = z
  .object({
    foodId: z.number().int().positive().optional(),
    customFoodId: z.number().int().positive().optional(),
    ingredientRecipeId: z.number().int().positive().optional(),
    quantityGrams: z.number().positive('Quantity must be positive'),
    displayQuantity: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasFoodId = data.foodId !== undefined;
      const hasCustomFoodId = data.customFoodId !== undefined;
      const hasIngredientRecipeId = data.ingredientRecipeId !== undefined;
      // Exactly one of the three must be provided
      const count = [hasFoodId, hasCustomFoodId, hasIngredientRecipeId].filter(Boolean).length;
      return count === 1;
    },
    { message: 'Exactly one of foodId, customFoodId, or ingredientRecipeId must be provided' }
  );

/**
 * Create recipe input
 */
export const createRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(200),
  servings: z.number().int().min(1, 'Must have at least 1 serving').default(1),
  isShared: z.boolean().default(false),
  ingredients: z
    .array(createRecipeIngredientSchema)
    .min(1, 'At least one ingredient is required'),
});

/**
 * Update recipe (same structure as create)
 */
export const updateRecipeSchema = createRecipeSchema;

/**
 * Query params for listing recipes
 */
export const recipeQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Ingredient mapping for tblsp import
 * Supports USDA foods, custom foods, or other recipes as ingredients
 */
export const importIngredientMappingSchema = z
  .object({
    originalText: z.string(),
    foodId: z.number().int().positive().optional(),
    customFoodId: z.number().int().positive().optional(),
    ingredientRecipeId: z.number().int().positive().optional(),
    quantityGrams: z.number().positive('Quantity must be positive'),
    displayQuantity: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasFoodId = data.foodId !== undefined;
      const hasCustomFoodId = data.customFoodId !== undefined;
      const hasIngredientRecipeId = data.ingredientRecipeId !== undefined;
      // Exactly one of the three must be provided
      const count = [hasFoodId, hasCustomFoodId, hasIngredientRecipeId].filter(Boolean).length;
      return count === 1;
    },
    { message: 'Exactly one of foodId, customFoodId, or ingredientRecipeId must be provided' }
  );

/**
 * tblsp import input
 */
export const importTblspRecipeSchema = z.object({
  tblspRecipeId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  servings: z.number().int().min(1).default(1),
  ingredients: z.array(importIngredientMappingSchema).min(1, 'At least one ingredient is required'),
});

// Type exports
export type CreateRecipeIngredientInput = z.infer<typeof createRecipeIngredientSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeQuery = z.infer<typeof recipeQuerySchema>;
export type ImportIngredientMapping = z.infer<typeof importIngredientMappingSchema>;
export type ImportTblspRecipeInput = z.infer<typeof importTblspRecipeSchema>;
