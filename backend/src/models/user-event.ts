import { z } from 'zod';

/**
 * User event validation schemas
 */

// Date format validation (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Color validation (hex color)
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex color (e.g., #ff6b6b)');

export const createEventSchema = z.object({
  eventDate: dateSchema,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(100, 'Description must be 100 characters or less'),
  color: colorSchema,
});

export const eventQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
