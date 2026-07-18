import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type {
  EventCorrelationRequest,
  EventCorrelationResponse,
} from '@muffintop/shared/types';

/**
 * Hook to run rated-event correlation analysis (on-demand mutation, not cached).
 */
export function useEventCorrelation() {
  const { currentUser } = useUser();

  return useMutation<EventCorrelationResponse, Error, EventCorrelationRequest>({
    mutationFn: (request) =>
      api.post<EventCorrelationResponse>(
        `/users/${currentUser!.id}/analysis/event-correlation`,
        request
      ),
  });
}
