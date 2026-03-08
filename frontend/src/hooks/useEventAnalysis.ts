import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { EventAnalysisRequest, EventAnalysisResponse } from '@muffintop/shared/types';

/**
 * Hook to run event analysis (on-demand mutation, not cached)
 */
export function useEventAnalysis() {
  const { currentUser } = useUser();

  return useMutation<EventAnalysisResponse, Error, EventAnalysisRequest>({
    mutationFn: (request) =>
      api.post<EventAnalysisResponse>(
        `/users/${currentUser!.id}/analysis/events`,
        request
      ),
  });
}
