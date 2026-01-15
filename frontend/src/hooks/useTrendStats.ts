import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { LongitudinalTrendResult, TrendTimeRange, NutrientKey } from '@muffintop/shared/types';

interface UseTrendStatsParams {
  timeRange: TrendTimeRange;
  nutrient?: NutrientKey;
}

/**
 * Hook to fetch trend data for longitudinal analysis
 */
export function useTrendStats({ timeRange, nutrient = 'calories' }: UseTrendStatsParams) {
  const { currentUser } = useUser();

  return useQuery<LongitudinalTrendResult>({
    queryKey: ['trends', currentUser?.id, timeRange, nutrient],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (nutrient) params.append('nutrient', nutrient);
      return api.get(`/users/${currentUser!.id}/stats/trends?${params.toString()}`);
    },
    enabled: !!currentUser,
  });
}
