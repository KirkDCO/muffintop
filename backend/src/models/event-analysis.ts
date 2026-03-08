import { z } from 'zod';
import { ALL_NUTRIENT_KEYS } from '@muffintop/shared/types';
import { INTAKE_TYPES } from '@muffintop/shared/types';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const allMetricKeys = [...ALL_NUTRIENT_KEYS, ...INTAKE_TYPES] as const;

export const eventAnalysisSchema = z
  .object({
    selectionMode: z.enum(['description', 'instance']),
    eventDescription: z.string().min(1).max(100).optional(),
    eventId: z.number().int().positive().optional(),
    startDate: dateSchema,
    endDate: dateSchema,
    lookbackDays: z.number().int().min(1).max(7),
    metrics: z
      .array(z.enum(allMetricKeys as unknown as [string, ...string[]]))
      .min(0),
  })
  .refine(
    (data) => {
      if (data.selectionMode === 'description') return !!data.eventDescription;
      return data.eventId !== undefined;
    },
    {
      message:
        'eventDescription is required for description mode; eventId is required for instance mode',
    }
  );

export type EventAnalysisInput = z.infer<typeof eventAnalysisSchema>;
