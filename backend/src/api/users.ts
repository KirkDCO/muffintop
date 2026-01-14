import { Router } from 'express';
import { userService } from '../services/user-service.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema, updateNutrientPreferencesSchema } from '../models/user.js';

export const usersRouter = Router();

/**
 * GET /users - List all users
 */
usersRouter.get('/', (_req, res) => {
  const users = userService.list();
  res.json({ users });
});

/**
 * POST /users - Create a new user
 */
usersRouter.post('/', validateBody(createUserSchema), (req, res) => {
  const user = userService.create(req.body);
  res.status(201).json(user);
});

/**
 * GET /users/:userId - Get user details with preferences
 */
usersRouter.get('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId as string, 10);
  const user = userService.getWithPreferences(userId);
  res.json(user);
});

/**
 * DELETE /users/:userId - Delete user and all data
 */
usersRouter.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId as string, 10);
  userService.delete(userId);
  res.status(204).send();
});

/**
 * GET /users/:userId/preferences - Get user's nutrient display preferences
 */
usersRouter.get('/:userId/preferences', (req, res) => {
  const userId = parseInt(req.params.userId as string, 10);
  const preferences = userService.getFullPreferences(userId);
  res.json(preferences);
});

/**
 * PUT /users/:userId/preferences - Update user's nutrient display preferences
 */
usersRouter.put(
  '/:userId/preferences',
  validateBody(updateNutrientPreferencesSchema),
  (req, res) => {
    const userId = parseInt(req.params.userId as string, 10);
    const preferences = userService.setPreferences(userId, req.body.visibleNutrients);
    res.json(preferences);
  }
);
