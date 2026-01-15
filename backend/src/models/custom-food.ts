import { z } from 'zod';

/**
 * Custom food portion input
 */
export const createCustomFoodPortionSchema = z.object({
  description: z.string().min(1, 'Portion description is required').max(100),
  servingMultiplier: z.number().positive().default(1),
  gramWeight: z.number().positive().optional(),
});

/**
 * Nutrient input - big 4 required, rest optional
 */
export const customFoodNutrientsSchema = z.object({
  calories: z.number().min(0, 'Calories must be non-negative'),
  protein: z.number().min(0, 'Protein must be non-negative'),
  carbs: z.number().min(0, 'Carbs must be non-negative'),
  totalFat: z.number().min(0, 'Fat must be non-negative'),
  // Optional nutrients
  fiber: z.number().min(0).optional(),
  addedSugar: z.number().min(0).optional(),
  totalSugar: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  potassium: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  iron: z.number().min(0).optional(),
  vitaminA: z.number().min(0).optional(),
  vitaminC: z.number().min(0).optional(),
  vitaminD: z.number().min(0).optional(),
});

/**
 * Create custom food input
 */
export const createCustomFoodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  servingGrams: z.number().positive().optional(),
  nutrients: customFoodNutrientsSchema,
  portions: z.array(createCustomFoodPortionSchema).optional(),
  isShared: z.boolean().default(false),
});

/**
 * Update custom food (same structure as create)
 */
export const updateCustomFoodSchema = createCustomFoodSchema;

/**
 * Query params for listing custom foods
 */
export const customFoodQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Type exports
export type CreateCustomFoodPortionInput = z.infer<typeof createCustomFoodPortionSchema>;
export type CustomFoodNutrients = z.infer<typeof customFoodNutrientsSchema>;
export type CreateCustomFoodInput = z.infer<typeof createCustomFoodSchema>;
export type UpdateCustomFoodInput = z.infer<typeof updateCustomFoodSchema>;
export type CustomFoodQuery = z.infer<typeof customFoodQuerySchema>;
