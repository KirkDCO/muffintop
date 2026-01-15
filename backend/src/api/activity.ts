import { Router } from 'express';
import { activityService } from '../services/activity-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createActivitySchema, activityQuerySchema } from '../models/activity-log.js';

export const activityRouter = Router({ mergeParams: true });

// All routes require user context
activityRouter.use(requireUser);

/**
 * GET /users/:userId/activity - Get activity entries with optional date filtering
 */
activityRouter.get('/', validateQuery(activityQuerySchema), (req, res) => {
  const entries = activityService.getByQuery(req.userId!, req.query as { date?: string; startDate?: string; endDate?: string });
  res.json({ entries });
});

/**
 * POST /users/:userId/activity - Log activity calories for a day (upsert)
 */
activityRouter.post('/', validateBody(createActivitySchema), (req, res) => {
  const entry = activityService.upsert(req.userId!, req.body);
  res.status(201).json(entry);
});

/**
 * DELETE /users/:userId/activity/:date - Remove activity for a specific date
 */
activityRouter.delete('/:date', (req, res) => {
  const date = req.params.date as string;
  activityService.delete(req.userId!, date);
  res.status(204).send();
});
