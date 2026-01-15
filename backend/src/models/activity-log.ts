import { z } from 'zod';

/**
 * Activity log validation schemas
 */

// Date format validation (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const createActivitySchema = z.object({
  logDate: dateSchema,
  activityCalories: z
    .number()
    .int('Activity calories must be a whole number')
    .min(0, 'Activity calories cannot be negative')
    .max(10000, 'Activity calories cannot exceed 10000'),
});

export const activityQuerySchema = z.object({
  date: dateSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
