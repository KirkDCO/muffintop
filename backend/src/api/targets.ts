import { Router } from 'express';
import { targetService } from '../services/target-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody } from '../middleware/validate.js';
import { createDailyTargetSchema, updateDailyTargetSchema } from '../models/daily-target.js';

export const targetsRouter = Router({ mergeParams: true });

// All routes require user context
targetsRouter.use(requireUser);

/**
 * GET /users/:userId/targets - Get user's daily targets
 */
targetsRouter.get('/', (req, res) => {
  const target = targetService.getByUserId(req.userId!);
  res.json({ target });
});

/**
 * POST /users/:userId/targets - Create or replace daily targets
 */
targetsRouter.post('/', validateBody(createDailyTargetSchema), (req, res) => {
  const target = targetService.create(req.userId!, req.body);
  res.status(201).json(target);
});

/**
 * PUT /users/:userId/targets - Update daily targets (partial)
 */
targetsRouter.put('/', validateBody(updateDailyTargetSchema), (req, res) => {
  const target = targetService.update(req.userId!, req.body);
  res.json(target);
});

/**
 * DELETE /users/:userId/targets - Remove daily targets
 */
targetsRouter.delete('/', (req, res) => {
  targetService.delete(req.userId!);
  res.status(204).send();
});
