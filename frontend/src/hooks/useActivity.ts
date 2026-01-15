import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { ActivityEntry, CreateActivityInput } from '@muffintop/shared/types';

interface ActivityResponse {
  entries: ActivityEntry[];
}

/**
 * Hook to fetch activity entries with optional date filtering
 */
export function useActivity(date?: string) {
  const { currentUser } = useUser();

  return useQuery<ActivityResponse>({
    queryKey: ['activity', currentUser?.id, date],
    queryFn: () => {
      const params = date ? `?date=${date}` : '';
      return api.get(`/users/${currentUser!.id}/activity${params}`);
    },
    enabled: !!currentUser,
  });
}

/**
 * Hook to create/update activity (upsert for date)
 */
export function useUpsertActivity() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateActivityInput) =>
      api.post<ActivityEntry>(`/users/${currentUser!.id}/activity`, input),
    onSuccess: (_, variables) => {
      // Invalidate both the specific date and the general activity list
      queryClient.invalidateQueries({ queryKey: ['activity', currentUser?.id, variables.logDate] });
      queryClient.invalidateQueries({ queryKey: ['activity', currentUser?.id] });
    },
  });
}

/**
 * Hook to delete activity for a specific date
 */
export function useDeleteActivity() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => api.delete(`/users/${currentUser!.id}/activity/${date}`),
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ['activity', currentUser?.id, date] });
      queryClient.invalidateQueries({ queryKey: ['activity', currentUser?.id] });
    },
  });
}
