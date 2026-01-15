import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// Types matching backend tblsp-service responses
export interface TblspRecipeSummary {
  id: number;
  title: string;
  rating: number | null;
  createdAt: string;
}

export interface TblspIngredient {
  id: number;
  name: string;
  quantity: string | null;
  originalText: string;
  position: number;
}

export interface TblspRecipe {
  id: number;
  title: string;
  ingredientsRaw: string | null;
  instructions: string | null;
  notes: string | null;
  sourceUrl: string | null;
  rating: number | null;
  createdAt: string;
  ingredients: TblspIngredient[];
}

interface TblspStatusResponse {
  available: boolean;
}

interface TblspRecipesResponse {
  recipes: TblspRecipeSummary[];
}

interface TblspSearchParams {
  search?: string;
  limit?: number;
}

export function useTblspStatus() {
  return useQuery<TblspStatusResponse>({
    queryKey: ['tblsp', 'status'],
    queryFn: () => api.get('/tblsp/status'),
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useTblspRecipes(params?: TblspSearchParams) {
  return useQuery<TblspRecipesResponse>({
    queryKey: ['tblsp', 'recipes', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return api.get(`/tblsp/recipes${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useTblspRecipe(recipeId: number | null) {
  return useQuery<TblspRecipe>({
    queryKey: ['tblsp', 'recipes', recipeId],
    queryFn: () => api.get(`/tblsp/recipes/${recipeId}`),
    enabled: recipeId !== null,
  });
}
