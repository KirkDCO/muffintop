import { Router } from 'express';
import { customFoodService } from '../services/custom-food-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { ValidationError } from '../middleware/error-handler.js';
import {
  createCustomFoodSchema,
  updateCustomFoodSchema,
  customFoodQuerySchema,
} from '../models/custom-food.js';

export const customFoodsRouter = Router({ mergeParams: true });

// All routes require user context
customFoodsRouter.use(requireUser);

/**
 * Parse and validate customFoodId from route params
 */
function parseCustomFoodId(param: string): number {
  const id = parseInt(param, 10);
  if (isNaN(id) || id <= 0) {
    throw new ValidationError(`Invalid custom food ID: ${param}`);
  }
  return id;
}

/**
 * GET /users/:userId/custom-foods - List user's custom foods
 */
customFoodsRouter.get('/', validateQuery(customFoodQuerySchema), (req, res) => {
  const customFoods = customFoodService.list(req.userId!, req.query as never);
  res.json({ customFoods });
});

/**
 * GET /users/:userId/custom-foods/:customFoodId - Get single custom food with portions
 */
customFoodsRouter.get('/:customFoodId', (req, res) => {
  const customFoodId = parseCustomFoodId(req.params.customFoodId as string);
  const customFood = customFoodService.getById(req.userId!, customFoodId);
  res.json(customFood);
});

/**
 * POST /users/:userId/custom-foods - Create custom food
 */
customFoodsRouter.post('/', validateBody(createCustomFoodSchema), (req, res) => {
  const customFood = customFoodService.create(req.userId!, req.body);
  res.status(201).json(customFood);
});

/**
 * PUT /users/:userId/custom-foods/:customFoodId - Update custom food
 */
customFoodsRouter.put('/:customFoodId', validateBody(updateCustomFoodSchema), (req, res) => {
  const customFoodId = parseCustomFoodId(req.params.customFoodId as string);
  const customFood = customFoodService.update(req.userId!, customFoodId, req.body);
  res.json(customFood);
});

/**
 * DELETE /users/:userId/custom-foods/:customFoodId - Delete custom food
 */
customFoodsRouter.delete('/:customFoodId', (req, res) => {
  const customFoodId = parseCustomFoodId(req.params.customFoodId as string);
  customFoodService.delete(req.userId!, customFoodId);
  res.status(204).send();
});
