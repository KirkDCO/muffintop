import { Router } from 'express';
import { z } from 'zod';
import * as statsService from '../services/stats-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateQuery } from '../middleware/validate.js';
import type { TrendTimeRange, NutrientKey } from '@muffintop/shared/types';

const router = Router({ mergeParams: true });

const dailyStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(90).default(7),
});

const trendQuerySchema = z.object({
  timeRange: z.enum(['week', 'month', '3months', '6months', 'year', 'lastyear', 'all']).default('month'),
  nutrient: z.string().optional(),
});

// All routes require user context
router.use(requireUser);

/**
 * GET /users/:userId/stats/daily
 * Get daily nutrient summaries
 * Query params:
 *   - days: number of days to look back (default 7, max 90)
 *   - startDate, endDate: specific date range (overrides days)
 */
router.get('/daily', validateQuery(dailyStatsQuerySchema), (req, res) => {
  const query = req.query as unknown as z.infer<typeof dailyStatsQuerySchema>;
  const { startDate, endDate, days } = query;

  let result;
  if (startDate && endDate) {
    result = statsService.getDailySummaries(req.userId!, startDate, endDate);
  } else {
    result = statsService.getDailySummariesForLastDays(req.userId!, days);
  }

  res.json(result);
});

/**
 * GET /users/:userId/stats/trends
 * Get trend data for longitudinal analysis (nutrients + weight)
 * Query params:
 *   - timeRange: 'week' | 'month' | '3months' | '6months' | 'year' | 'lastyear' | 'all'
 *   - nutrient: which nutrient to include (default 'calories')
 */
router.get('/trends', validateQuery(trendQuerySchema), (req, res) => {
  const query = req.query as unknown as z.infer<typeof trendQuerySchema>;
  const { timeRange, nutrient } = query;

  const result = statsService.getTrendData(
    req.userId!,
    timeRange as TrendTimeRange,
    (nutrient as NutrientKey) || 'calories'
  );

  res.json(result);
});

export { router as statsRouter };
