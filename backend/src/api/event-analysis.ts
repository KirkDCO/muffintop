import { Router } from 'express';
import { eventAnalysisService } from '../services/event-analysis-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody } from '../middleware/validate.js';
import { eventAnalysisSchema } from '../models/event-analysis.js';

export const eventAnalysisRouter = Router({ mergeParams: true });

eventAnalysisRouter.use(requireUser);

/**
 * POST /users/:userId/analysis/events - Run event analysis
 */
eventAnalysisRouter.post('/', validateBody(eventAnalysisSchema), (req, res) => {
  const result = eventAnalysisService.analyze(req.userId!, req.body);
  res.json(result);
});
