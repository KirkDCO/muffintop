import { z } from 'zod';
import { ALL_NUTRIENT_KEYS, type NutrientKey } from '@muffintop/shared/types';

/**
 * Daily target validation schemas
 */

// Valid nutrient keys
const nutrientKeySchema = z.enum(ALL_NUTRIENT_KEYS as [NutrientKey, ...NutrientKey[]]);

// Target direction - min (reach goal) or max (stay under limit)
const targetDirectionSchema = z.enum(['min', 'max']);

// Single nutrient target with value and direction
const nutrientTargetSchema = z.object({
  value: z.number().min(0, 'Target value must be non-negative'),
  direction: targetDirectionSchema,
});

// Map of nutrient keys to targets
const nutrientTargetsSchema = z.record(nutrientKeySchema, nutrientTargetSchema).optional();

export const createDailyTargetSchema = z.object({
  basalCalories: z
    .number()
    .int('Basal calories must be a whole number')
    .min(500, 'Basal calories must be at least 500')
    .max(10000, 'Basal calories cannot exceed 10000'),
  nutrientTargets: nutrientTargetsSchema,
});

export const updateDailyTargetSchema = z.object({
  basalCalories: z
    .number()
    .int('Basal calories must be a whole number')
    .min(500, 'Basal calories must be at least 500')
    .max(10000, 'Basal calories cannot exceed 10000')
    .optional(),
  nutrientTargets: nutrientTargetsSchema,
});

export type CreateDailyTargetInput = z.infer<typeof createDailyTargetSchema>;
export type UpdateDailyTargetInput = z.infer<typeof updateDailyTargetSchema>;
