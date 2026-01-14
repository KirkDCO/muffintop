import { z } from 'zod';

export const mealCategorySchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const createFoodLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  mealCategory: mealCategorySchema,
  foodId: z.number().int().positive().optional(),
  customFoodId: z.number().int().positive().optional(),
  recipeId: z.number().int().positive().optional(),
  portionAmount: z.number().positive('Portion amount must be positive'),
  portionGrams: z.number().min(0.1, 'Portion must be at least 0.1g'),
}).refine(
  (data) => {
    const sources = [data.foodId, data.customFoodId, data.recipeId].filter(Boolean);
    return sources.length === 1;
  },
  { message: 'Exactly one of foodId, customFoodId, or recipeId must be provided' }
);

export const updateFoodLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  mealCategory: mealCategorySchema.optional(),
  portionAmount: z.number().positive().optional(),
  portionGrams: z.number().min(0.1).optional(),
});

export const foodLogQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateFoodLogInput = z.infer<typeof createFoodLogSchema>;
export type UpdateFoodLogInput = z.infer<typeof updateFoodLogSchema>;
export type FoodLogQuery = z.infer<typeof foodLogQuerySchema>;
