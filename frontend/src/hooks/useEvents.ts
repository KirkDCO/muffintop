import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { UserEvent, CreateEventInput, EventQueryParams } from '@muffintop/shared/types';

/**
 * Hook to fetch user events with optional date filtering
 */
export function useEvents(params?: EventQueryParams) {
  const { currentUser } = useUser();

  return useQuery<UserEvent[]>({
    queryKey: ['events', currentUser?.id, params?.startDate, params?.endDate],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      return api.get(`/users/${currentUser!.id}/events${query ? `?${query}` : ''}`);
    },
    enabled: !!currentUser,
  });
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api.post<UserEvent>(`/users/${currentUser!.id}/events`, input),
    onSuccess: () => {
      // Invalidate all event queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.id] });
      // Also invalidate trends since events appear on the chart
      queryClient.invalidateQueries({ queryKey: ['trends', currentUser?.id] });
    },
  });
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: number) =>
      api.delete(`/users/${currentUser!.id}/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['trends', currentUser?.id] });
    },
  });
}
