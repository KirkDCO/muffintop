import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FoodDetail, FoodSearchResult } from '@muffintop/shared/types';

interface SearchParams {
  q: string;
  dataType?: 'foundation' | 'sr_legacy' | 'branded' | 'all';
  limit?: number;
}

export function useFoodSearch(params: SearchParams | null) {
  return useQuery<FoodSearchResult>({
    queryKey: ['foods', 'search', params],
    queryFn: () => {
      if (!params || !params.q) {
        return { foods: [], total: 0 };
      }
      const searchParams = new URLSearchParams();
      searchParams.set('q', params.q);
      if (params.dataType) searchParams.set('dataType', params.dataType);
      if (params.limit) searchParams.set('limit', String(params.limit));
      return api.get(`/foods/search?${searchParams.toString()}`);
    },
    enabled: !!params?.q && params.q.length >= 2,
  });
}

export function useFoodDetail(fdcId: number | null) {
  return useQuery<FoodDetail>({
    queryKey: ['foods', fdcId],
    queryFn: () => api.get(`/foods/${fdcId}`),
    enabled: fdcId !== null,
  });
}
