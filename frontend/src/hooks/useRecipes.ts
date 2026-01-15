import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type {
  Recipe,
  RecipeSummary,
  CreateRecipeInput,
  UpdateRecipeInput,
  ImportTblspRecipeInput,
} from '@muffintop/shared/types';

interface RecipesResponse {
  recipes: RecipeSummary[];
}

interface RecipeSearchParams {
  search?: string;
  limit?: number;
}

export function useRecipes(params?: RecipeSearchParams) {
  const { currentUser } = useUser();

  return useQuery<RecipesResponse>({
    queryKey: ['recipes', currentUser?.id, params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return api.get(`/users/${currentUser!.id}/recipes${qs ? `?${qs}` : ''}`);
    },
    enabled: !!currentUser,
  });
}

export function useRecipe(recipeId: number | null) {
  const { currentUser } = useUser();

  return useQuery<Recipe>({
    queryKey: ['recipes', currentUser?.id, recipeId],
    queryFn: () => api.get(`/users/${currentUser!.id}/recipes/${recipeId}`),
    enabled: !!currentUser && recipeId !== null,
  });
}

export function useCreateRecipe() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecipeInput) =>
      api.post<Recipe>(`/users/${currentUser!.id}/recipes`, input),
    onSuccess: (newRecipe) => {
      // Update all recipe list caches to include the new recipe
      queryClient.setQueriesData<RecipesResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'recipes' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3, // List queries have [recipes, userId, params]
        },
        (oldData) => {
          if (!oldData) return { recipes: [toSummary(newRecipe)] };
          return {
            recipes: [toSummary(newRecipe), ...oldData.recipes],
          };
        }
      );
    },
  });
}

// Helper to convert full Recipe to RecipeSummary
function toSummary(recipe: Recipe): RecipeSummary {
  return {
    id: recipe.id,
    userId: recipe.userId,
    name: recipe.name,
    servings: recipe.servings,
    isShared: recipe.isShared,
    createdAt: recipe.createdAt,
  };
}

export function useUpdateRecipe() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, input }: { recipeId: number; input: UpdateRecipeInput }) =>
      api.put<Recipe>(`/users/${currentUser!.id}/recipes/${recipeId}`, input),
    onSuccess: (updatedRecipe) => {
      // Update recipe in list caches
      queryClient.setQueriesData<RecipesResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'recipes' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3,
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            recipes: oldData.recipes.map((r) =>
              r.id === updatedRecipe.id ? toSummary(updatedRecipe) : r
            ),
          };
        }
      );
      // Update single recipe cache
      queryClient.setQueryData(['recipes', currentUser?.id, updatedRecipe.id], updatedRecipe);
    },
  });
}

export function useDeleteRecipe() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: number) =>
      api.delete(`/users/${currentUser!.id}/recipes/${recipeId}`),
    onSuccess: (_, recipeId) => {
      // Remove recipe from list caches
      queryClient.setQueriesData<RecipesResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'recipes' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3,
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            recipes: oldData.recipes.filter((r) => r.id !== recipeId),
          };
        }
      );
      // Remove single recipe cache
      queryClient.removeQueries({ queryKey: ['recipes', currentUser?.id, recipeId] });
    },
  });
}

export function useImportTblspRecipe() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportTblspRecipeInput) =>
      api.post<Recipe>(`/users/${currentUser!.id}/recipes/import-tblsp`, input),
    onSuccess: (newRecipe) => {
      // Update all recipe list caches to include the imported recipe
      queryClient.setQueriesData<RecipesResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'recipes' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3,
        },
        (oldData) => {
          if (!oldData) return { recipes: [toSummary(newRecipe)] };
          return {
            recipes: [toSummary(newRecipe), ...oldData.recipes],
          };
        }
      );
    },
  });
}
