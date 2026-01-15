import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { DailyStatsResult, DailyStatsQueryParams } from '@muffintop/shared/types';

/**
 * Hook to fetch daily nutrient summaries for charts
 */
export function useDailyStats(params?: DailyStatsQueryParams) {
  const { currentUser } = useUser();

  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.days) queryParams.set('days', String(params.days));

  const queryString = queryParams.toString();
  const url = `/users/${currentUser!.id}/stats/daily${queryString ? `?${queryString}` : ''}`;

  return useQuery<DailyStatsResult>({
    queryKey: ['dailyStats', currentUser?.id, params],
    queryFn: () => api.get(url),
    enabled: !!currentUser,
  });
}
