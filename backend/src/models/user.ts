import { z } from 'zod';

/**
 * User validation schemas
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
