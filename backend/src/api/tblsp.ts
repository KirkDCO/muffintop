import { Router } from 'express';
import { tblspService, type TblspRecipeQuery } from '../services/tblsp-service.js';
import { validateQuery } from '../middleware/validate.js';
import { z } from 'zod';

export const tblspRouter = Router();

// Query schema for listing tblsp recipes
const tblspQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /tblsp/status - Check if tblsp database is available
 */
tblspRouter.get('/status', (_req, res) => {
  const available = tblspService.isAvailable();
  res.json({ available });
});

/**
 * GET /tblsp/recipes - List/search tblsp recipes
 */
tblspRouter.get('/recipes', validateQuery(tblspQuerySchema), (req, res) => {
  const query = req.query as TblspRecipeQuery;
  const recipes = tblspService.list(query);
  res.json({ recipes });
});

/**
 * GET /tblsp/recipes/:recipeId - Get tblsp recipe with ingredients
 */
tblspRouter.get('/recipes/:recipeId', (req, res) => {
  const recipeId = parseInt(req.params.recipeId as string, 10);
  const recipe = tblspService.getById(recipeId);
  res.json(recipe);
});
