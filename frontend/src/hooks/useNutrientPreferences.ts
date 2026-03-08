import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  NutrientPreferences,
  UpdateNutrientPreferencesInput,
} from '@muffintop/shared/types';

/**
 * Hook to fetch user's nutrient preferences
 */
export function useNutrientPreferences(userId: number | null) {
  return useQuery<NutrientPreferences>({
    queryKey: ['nutrientPreferences', userId],
    queryFn: () => api.get(`/users/${userId}/preferences`),
    enabled: userId !== null,
  });
}

/**
 * Hook to update user's nutrient preferences
 */
export function useUpdateNutrientPreferences(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateNutrientPreferencesInput) =>
      api.put<NutrientPreferences>(`/users/${userId}/preferences`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrientPreferences', userId] });
    },
  });
}
