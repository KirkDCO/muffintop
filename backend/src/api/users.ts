import { Router } from 'express';
import { userService } from '../services/user-service.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema } from '../models/user.js';

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
 * GET /users/:userId - Get user details
 */
usersRouter.get('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const user = userService.getById(userId);
  res.json(user);
});

/**
 * DELETE /users/:userId - Delete user and all data
 */
usersRouter.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  userService.delete(userId);
  res.status(204).send();
});
