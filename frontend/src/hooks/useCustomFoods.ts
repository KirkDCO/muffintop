import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type {
  CustomFood,
  CustomFoodSummary,
  CreateCustomFoodInput,
} from '@muffintop/shared/types';

interface CustomFoodsResponse {
  customFoods: CustomFoodSummary[];
}

interface CustomFoodSearchParams {
  search?: string;
  limit?: number;
}

export function useCustomFoods(params?: CustomFoodSearchParams) {
  const { currentUser } = useUser();

  return useQuery<CustomFoodsResponse>({
    queryKey: ['customFoods', currentUser?.id, params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return api.get(`/users/${currentUser!.id}/custom-foods${qs ? `?${qs}` : ''}`);
    },
    enabled: !!currentUser,
  });
}

export function useCustomFood(customFoodId: number | null) {
  const { currentUser } = useUser();

  // Validate customFoodId is a valid positive integer
  const isValidId = typeof customFoodId === 'number' && !isNaN(customFoodId) && customFoodId > 0;

  return useQuery<CustomFood>({
    queryKey: ['customFoods', currentUser?.id, customFoodId],
    queryFn: () => api.get(`/users/${currentUser!.id}/custom-foods/${customFoodId}`),
    enabled: !!currentUser && isValidId,
  });
}

// Helper to convert full CustomFood to CustomFoodSummary
function toSummary(food: CustomFood): CustomFoodSummary {
  return {
    id: food.id,
    userId: food.userId,
    name: food.name,
    caloriesPerServing: food.nutrients.calories ?? 0,
    isShared: food.isShared,
    createdAt: food.createdAt,
    updatedAt: food.updatedAt,
  };
}

export function useCreateCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomFoodInput) =>
      api.post<CustomFood>(`/users/${currentUser!.id}/custom-foods`, input),
    onSuccess: (newFood) => {
      // Update all custom food list caches to include the new food
      queryClient.setQueriesData<CustomFoodsResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'customFoods' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3, // List queries have [customFoods, userId, params]
        },
        (oldData) => {
          if (!oldData?.customFoods) return { customFoods: [toSummary(newFood)] };
          return {
            customFoods: [toSummary(newFood), ...oldData.customFoods],
          };
        }
      );
    },
  });
}

export function useUpdateCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customFoodId, input }: { customFoodId: number; input: CreateCustomFoodInput }) =>
      api.put<CustomFood>(`/users/${currentUser!.id}/custom-foods/${customFoodId}`, input),
    onSuccess: (updatedFood) => {
      // Update custom food in list caches
      queryClient.setQueriesData<CustomFoodsResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'customFoods' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3,
        },
        (oldData) => {
          if (!oldData?.customFoods) return oldData;
          return {
            customFoods: oldData.customFoods.map((f) =>
              f.id === updatedFood.id ? toSummary(updatedFood) : f
            ),
          };
        }
      );
      // Update single custom food cache
      queryClient.setQueryData(['customFoods', currentUser?.id, updatedFood.id], updatedFood);
    },
  });
}

export function useDeleteCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customFoodId: number) => {
      if (typeof customFoodId !== 'number' || isNaN(customFoodId) || customFoodId <= 0) {
        return Promise.reject(new Error(`Invalid customFoodId: ${customFoodId}`));
      }
      return api.delete(`/users/${currentUser!.id}/custom-foods/${customFoodId}`);
    },
    onSuccess: (_, customFoodId) => {
      // Remove custom food from list caches
      queryClient.setQueriesData<CustomFoodsResponse>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'customFoods' &&
            query.queryKey[1] === currentUser?.id &&
            query.queryKey.length === 3,
        },
        (oldData) => {
          if (!oldData?.customFoods) return oldData;
          return {
            customFoods: oldData.customFoods.filter((f) => f.id !== customFoodId),
          };
        }
      );
      // Remove single custom food cache
      queryClient.removeQueries({ queryKey: ['customFoods', currentUser?.id, customFoodId] });
    },
  });
}
