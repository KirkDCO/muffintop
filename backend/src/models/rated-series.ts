import { z } from 'zod';

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex color (e.g., #ff6b6b)');

export const upsertRatedSeriesSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(100, 'Description must be 100 characters or less'),
  direction: z.enum(['higher_better', 'higher_worse']),
  color: colorSchema,
});

export type UpsertRatedSeriesInput = z.infer<typeof upsertRatedSeriesSchema>;
