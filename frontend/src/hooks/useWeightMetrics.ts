import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { WeightHistory, WeightEntry, CreateWeightInput, WeightQueryParams } from '@muffintop/shared/types';

/**
 * Hook to fetch weight history with optional date filtering
 */
export function useWeightHistory(params?: WeightQueryParams) {
  const { currentUser } = useUser();

  return useQuery<WeightHistory>({
    queryKey: ['weight', currentUser?.id, params?.startDate, params?.endDate],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      return api.get(`/users/${currentUser!.id}/metrics/weight${query ? `?${query}` : ''}`);
    },
    enabled: !!currentUser,
  });
}

/**
 * Hook to create/update weight (upsert for date)
 */
export function useUpsertWeight() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWeightInput) =>
      api.post<WeightEntry>(`/users/${currentUser!.id}/metrics/weight`, input),
    onSuccess: () => {
      // Invalidate all weight queries to refresh the history and trend
      queryClient.invalidateQueries({ queryKey: ['weight', currentUser?.id] });
    },
  });
}

/**
 * Hook to delete weight for a specific date
 */
export function useDeleteWeight() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => api.delete(`/users/${currentUser!.id}/metrics/weight/${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight', currentUser?.id] });
    },
  });
}
