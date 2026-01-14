import { z } from 'zod';
import { ALL_NUTRIENT_KEYS, type NutrientKey } from '@muffintop/shared/types';

/**
 * User validation schemas
 */

// Valid nutrient keys for preferences
const nutrientKeySchema = z.enum(ALL_NUTRIENT_KEYS as [NutrientKey, ...NutrientKey[]]);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  visibleNutrients: z.array(nutrientKeySchema).min(1).max(17).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateNutrientPreferencesSchema = z.object({
  visibleNutrients: z.array(nutrientKeySchema).min(1, 'At least one nutrient must be selected').max(17),
});

export type UpdateNutrientPreferencesInput = z.infer<typeof updateNutrientPreferencesSchema>;
