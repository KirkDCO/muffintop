import { Router } from 'express';
import { ratedSeriesService } from '../services/rated-series-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody } from '../middleware/validate.js';
import { upsertRatedSeriesSchema } from '../models/rated-series.js';

export const ratedSeriesRouter = Router({ mergeParams: true });

ratedSeriesRouter.use(requireUser);

/**
 * GET /users/:userId/rated-series - List rated series metadata
 */
ratedSeriesRouter.get('/', (req, res) => {
  res.json(ratedSeriesService.list(req.userId!));
});

/**
 * POST /users/:userId/rated-series - Create or update a rated series (by description)
 */
ratedSeriesRouter.post('/', validateBody(upsertRatedSeriesSchema), (req, res) => {
  const series = ratedSeriesService.upsert(req.userId!, req.body);
  res.status(201).json(series);
});

/**
 * DELETE /users/:userId/rated-series/:description - Remove series metadata
 */
ratedSeriesRouter.delete('/:description', (req, res) => {
  ratedSeriesService.delete(req.userId!, decodeURIComponent(req.params.description));
  res.status(204).send();
});
