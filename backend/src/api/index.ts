import { Router } from 'express';
import { usersRouter } from './users.js';
import { foodsRouter } from './foods.js';
import { foodLogRouter } from './food-log.js';
import { targetsRouter } from './targets.js';
import { activityRouter } from './activity.js';
import { recipesRouter } from './recipes.js';
import { customFoodsRouter } from './custom-foods.js';
import { statsRouter } from './stats.js';
import { metricsRouter } from './metrics.js';
import { eventsRouter } from './events.js';
import { tblspRouter } from './tblsp.js';

export const apiRouter = Router();

// Mount route handlers
apiRouter.use('/users', usersRouter);
apiRouter.use('/foods', foodsRouter);
apiRouter.use('/users/:userId/food-log', foodLogRouter);
apiRouter.use('/users/:userId/targets', targetsRouter);
apiRouter.use('/users/:userId/activity', activityRouter);
apiRouter.use('/users/:userId/recipes', recipesRouter);
apiRouter.use('/users/:userId/custom-foods', customFoodsRouter);
apiRouter.use('/users/:userId/stats', statsRouter);
apiRouter.use('/users/:userId/metrics', metricsRouter);
apiRouter.use('/users/:userId/events', eventsRouter);
apiRouter.use('/tblsp', tblspRouter);
