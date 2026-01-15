import { Router } from 'express';
import { metricService } from '../services/metric-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createWeightSchema, weightQuerySchema } from '../models/body-metric.js';

export const metricsRouter = Router({ mergeParams: true });

// All routes require user context
metricsRouter.use(requireUser);

/**
 * GET /users/:userId/metrics/weight - Get weight history with optional date filtering
 */
metricsRouter.get('/weight', validateQuery(weightQuerySchema), (req, res) => {
  const history = metricService.getHistory(
    req.userId!,
    req.query as { startDate?: string; endDate?: string }
  );
  res.json(history);
});

/**
 * POST /users/:userId/metrics/weight - Log weight for a day (upsert)
 */
metricsRouter.post('/weight', validateBody(createWeightSchema), (req, res) => {
  const entry = metricService.upsert(req.userId!, req.body);
  res.status(201).json(entry);
});

/**
 * DELETE /users/:userId/metrics/weight/:date - Remove weight for a specific date
 */
metricsRouter.delete('/weight/:date', (req, res) => {
  const date = req.params.date as string;
  metricService.delete(req.userId!, date);
  res.status(204).send();
});
