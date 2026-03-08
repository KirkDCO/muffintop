import { z } from 'zod';

/**
 * Intake log validation schemas
 */

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const intakeTypeSchema = z.enum(['water', 'caffeine']);

export const createIntakeSchema = z.object({
  logDate: dateSchema,
  intakeType: intakeTypeSchema,
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(10000, 'Amount cannot exceed 10000'),
});

export const intakeQuerySchema = z.object({
  date: dateSchema.optional(),
  type: intakeTypeSchema.optional(),
});

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;
export type IntakeQuery = z.infer<typeof intakeQuerySchema>;
