import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { LongitudinalTrendResult, TrendTimeRange, NutrientKey } from '@muffintop/shared/types';

interface UseTrendStatsParams {
  timeRange: TrendTimeRange;
  nutrient?: NutrientKey;
  ratedEvent?: string;
}

/**
 * Hook to fetch trend data for longitudinal analysis
 */
function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useTrendStats({ timeRange, nutrient = 'calories', ratedEvent }: UseTrendStatsParams) {
  const { currentUser } = useUser();

  return useQuery<LongitudinalTrendResult>({
    queryKey: ['trends', currentUser?.id, timeRange, nutrient, ratedEvent],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (nutrient) params.append('nutrient', nutrient);
      if (ratedEvent) params.append('ratedEvent', ratedEvent);
      params.append('today', localDateString());
      return api.get(`/users/${currentUser!.id}/stats/trends?${params.toString()}`);
    },
    enabled: !!currentUser,
  });
}
