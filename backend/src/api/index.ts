import { Router } from 'express';
import { usersRouter } from './users.js';
import { foodsRouter } from './foods.js';
import { foodLogRouter } from './food-log.js';

export const apiRouter = Router();

// Mount route handlers
apiRouter.use('/users', usersRouter);
apiRouter.use('/foods', foodsRouter);
apiRouter.use('/users/:userId/food-log', foodLogRouter);
