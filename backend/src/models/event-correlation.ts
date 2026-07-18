import { z } from 'zod';
import { ALL_NUTRIENT_KEYS, INTAKE_TYPES } from '@muffintop/shared/types';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const allMetricKeys = [...ALL_NUTRIENT_KEYS, ...INTAKE_TYPES] as const;

export const eventCorrelationSchema = z.object({
  eventDescription: z.string().min(1).max(100),
  startDate: dateSchema,
  endDate: dateSchema,
  maxLag: z.number().int().min(0).max(7),
  maxWindow: z.number().int().min(1).max(7),
  metrics: z.array(z.enum(allMetricKeys as unknown as [string, ...string[]])).min(1),
  normalizePerKcal: z.boolean(),
});

export type EventCorrelationInput = z.infer<typeof eventCorrelationSchema>;
