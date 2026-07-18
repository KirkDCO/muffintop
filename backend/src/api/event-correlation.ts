import { Router } from 'express';
import { eventCorrelationService } from '../services/event-correlation-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody } from '../middleware/validate.js';
import { eventCorrelationSchema } from '../models/event-correlation.js';

export const eventCorrelationRouter = Router({ mergeParams: true });

eventCorrelationRouter.use(requireUser);

/**
 * POST /users/:userId/analysis/event-correlation - Run rated-event correlation analysis
 */
eventCorrelationRouter.post('/', validateBody(eventCorrelationSchema), (req, res) => {
  const result = eventCorrelationService.analyze(req.userId!, req.body);
  res.json(result);
});
