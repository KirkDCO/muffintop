import { Router } from 'express';
import { intakeService } from '../services/intake-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createIntakeSchema, intakeQuerySchema } from '../models/intake.js';

export const intakeRouter = Router({ mergeParams: true });

// All routes require user context
intakeRouter.use(requireUser);

/**
 * GET /users/:userId/intake - Get intake entries with optional filtering
 */
intakeRouter.get('/', validateQuery(intakeQuerySchema), (req, res) => {
  const query = req.query as { date?: string; type?: 'water' | 'caffeine' };
  const result = intakeService.getByQuery(req.userId!, query);
  res.json(result);
});

/**
 * POST /users/:userId/intake - Log an intake entry
 */
intakeRouter.post('/', validateBody(createIntakeSchema), (req, res) => {
  const entry = intakeService.create(req.userId!, req.body);
  res.status(201).json(entry);
});

/**
 * DELETE /users/:userId/intake/:id - Delete an intake entry
 */
intakeRouter.delete('/:id', (req, res) => {
  const entryId = parseInt(req.params.id as string, 10);
  intakeService.delete(req.userId!, entryId);
  res.status(204).send();
});
