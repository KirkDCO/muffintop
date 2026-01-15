import { Router } from 'express';
import { recipeService } from '../services/recipe-service.js';
import { requireUser } from '../middleware/user-context.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeQuerySchema,
  importTblspRecipeSchema,
} from '../models/recipe.js';

export const recipesRouter = Router({ mergeParams: true });

// All routes require user context
recipesRouter.use(requireUser);

/**
 * GET /users/:userId/recipes - List user's recipes
 */
recipesRouter.get('/', validateQuery(recipeQuerySchema), (req, res) => {
  const recipes = recipeService.list(req.userId!, req.query as never);
  res.json({ recipes });
});

/**
 * GET /users/:userId/recipes/:recipeId - Get single recipe with ingredients
 */
recipesRouter.get('/:recipeId', (req, res) => {
  const recipeId = parseInt(req.params.recipeId as string, 10);
  const recipe = recipeService.getById(req.userId!, recipeId);
  res.json(recipe);
});

/**
 * POST /users/:userId/recipes - Create recipe
 */
recipesRouter.post('/', validateBody(createRecipeSchema), (req, res) => {
  const recipe = recipeService.create(req.userId!, req.body);
  res.status(201).json(recipe);
});

/**
 * PUT /users/:userId/recipes/:recipeId - Update recipe
 */
recipesRouter.put('/:recipeId', validateBody(updateRecipeSchema), (req, res) => {
  const recipeId = parseInt(req.params.recipeId as string, 10);
  const recipe = recipeService.update(req.userId!, recipeId, req.body);
  res.json(recipe);
});

/**
 * DELETE /users/:userId/recipes/:recipeId - Delete recipe
 */
recipesRouter.delete('/:recipeId', (req, res) => {
  const recipeId = parseInt(req.params.recipeId as string, 10);
  recipeService.delete(req.userId!, recipeId);
  res.status(204).send();
});

/**
 * POST /users/:userId/recipes/import-tblsp - Import recipe from tblsp
 */
recipesRouter.post('/import-tblsp', validateBody(importTblspRecipeSchema), (req, res) => {
  const recipe = recipeService.importFromTblsp(req.userId!, req.body);
  res.status(201).json(recipe);
});
