import { Router } from 'express';
import { foodService } from '../services/food-service.js';
import { validateQuery, validateParams } from '../middleware/validate.js';
import { foodSearchQuerySchema, fdcIdParamSchema } from '../models/food.js';

export const foodsRouter = Router();

/**
 * GET /foods/search - Search food database
 */
foodsRouter.get('/search', validateQuery(foodSearchQuerySchema), (req, res) => {
  const result = foodService.search(req.query as never);
  res.json(result);
});

/**
 * GET /foods/:fdcId - Get food details with portions
 */
foodsRouter.get('/:fdcId', validateParams(fdcIdParamSchema), (req, res) => {
  const fdcId = parseInt(req.params.fdcId as string, 10);
  const food = foodService.getById(fdcId);
  res.json(food);
});
