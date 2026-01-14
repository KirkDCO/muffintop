import { Router } from 'express';
import { usersRouter } from './users.js';

export const apiRouter = Router();

// Mount route handlers
apiRouter.use('/users', usersRouter);

// Additional routes will be added as phases progress:
// apiRouter.use('/foods', foodsRouter);
