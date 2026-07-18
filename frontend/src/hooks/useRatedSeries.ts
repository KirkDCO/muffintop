import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { RatedEventSeries, UpsertRatedSeriesInput } from '@muffintop/shared/types';

/**
 * Hook to fetch the user's rated-series metadata (direction + color).
 */
export function useRatedSeries() {
  const { currentUser } = useUser();

  return useQuery<RatedEventSeries[]>({
    queryKey: ['rated-series', currentUser?.id],
    queryFn: () => api.get(`/users/${currentUser!.id}/rated-series`),
    enabled: !!currentUser,
  });
}

/**
 * Hook to create or update a rated series (keyed by description).
 */
export function useUpsertRatedSeries() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertRatedSeriesInput) =>
      api.post<RatedEventSeries>(`/users/${currentUser!.id}/rated-series`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rated-series', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['trends', currentUser?.id] });
    },
  });
}

/**
 * Hook to delete a rated series' metadata (ratings themselves are untouched).
 */
export function useDeleteRatedSeries() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) =>
      api.delete(
        `/users/${currentUser!.id}/rated-series/${encodeURIComponent(description)}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rated-series', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['trends', currentUser?.id] });
    },
  });
}
