import { Router } from 'express';
import { foodLogService } from '../services/food-log-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createFoodLogSchema,
  updateFoodLogSchema,
  foodLogQuerySchema,
} from '../models/food-log.js';

export const foodLogRouter = Router({ mergeParams: true });

// All routes require user context
foodLogRouter.use(requireUser);

/**
 * GET /users/:userId/food-log - Get food log entries
 */
foodLogRouter.get('/', validateQuery(foodLogQuerySchema), (req, res) => {
  const entries = foodLogService.getByQuery(req.userId!, req.query as never);
  res.json({ entries });
});

/**
 * GET /users/:userId/food-log/recent - Get recently logged foods
 */
foodLogRouter.get('/recent', (req, res) => {
  const recentFoods = foodLogService.getRecent(req.userId!);
  res.json({ recentFoods });
});

/**
 * POST /users/:userId/food-log - Log a food item
 */
foodLogRouter.post('/', validateBody(createFoodLogSchema), (req, res) => {
  const entry = foodLogService.create(req.userId!, req.body);
  res.status(201).json(entry);
});

/**
 * GET /users/:userId/food-log/:entryId - Get single entry
 */
foodLogRouter.get('/:entryId', (req, res) => {
  const entryId = parseInt(req.params.entryId as string, 10);
  const entry = foodLogService.getById(req.userId!, entryId);
  res.json(entry);
});

/**
 * PUT /users/:userId/food-log/:entryId - Update entry
 */
foodLogRouter.put('/:entryId', validateBody(updateFoodLogSchema), (req, res) => {
  const entryId = parseInt(req.params.entryId as string, 10);
  const entry = foodLogService.update(req.userId!, entryId, req.body);
  res.json(entry);
});

/**
 * DELETE /users/:userId/food-log/:entryId - Delete entry
 */
foodLogRouter.delete('/:entryId', (req, res) => {
  const entryId = parseInt(req.params.entryId as string, 10);
  foodLogService.delete(req.userId!, entryId);
  res.status(204).send();
});
