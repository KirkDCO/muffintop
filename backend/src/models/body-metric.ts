import { z } from 'zod';

/**
 * Body metric validation schemas
 */

// Date format validation (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const weightUnitSchema = z.enum(['kg', 'lb'], {
  errorMap: () => ({ message: 'Weight unit must be kg or lb' }),
});

export const createWeightSchema = z.object({
  metricDate: dateSchema,
  weightValue: z
    .number()
    .min(20, 'Weight must be at least 20')
    .max(1000, 'Weight cannot exceed 1000'),
  weightUnit: weightUnitSchema,
});

export const weightQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export type CreateWeightInput = z.infer<typeof createWeightSchema>;
export type WeightQuery = z.infer<typeof weightQuerySchema>;
