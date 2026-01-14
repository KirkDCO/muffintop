import { z } from 'zod';

/**
 * Food search validation schemas
 */
export const foodSearchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  dataType: z.enum(['foundation', 'sr_legacy', 'branded', 'all']).optional().default('all'),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export type FoodSearchQuery = z.infer<typeof foodSearchQuerySchema>;

export const fdcIdParamSchema = z.object({
  fdcId: z.coerce.number().int().positive(),
});

export type FdcIdParam = z.infer<typeof fdcIdParamSchema>;
