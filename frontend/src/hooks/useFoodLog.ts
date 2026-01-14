import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type {
  FoodLogEntry,
  CreateFoodLogInput,
  UpdateFoodLogInput,
  RecentFood,
} from '@muffintop/shared/types';

interface FoodLogResponse {
  entries: FoodLogEntry[];
}

interface RecentFoodsResponse {
  recentFoods: RecentFood[];
}

export function useFoodLog(date?: string) {
  const { currentUser } = useUser();

  return useQuery<FoodLogResponse>({
    queryKey: ['food-log', currentUser?.id, date],
    queryFn: () => {
      const params = date ? `?date=${date}` : '';
      return api.get(`/users/${currentUser!.id}/food-log${params}`);
    },
    enabled: !!currentUser,
  });
}

export function useRecentFoods() {
  const { currentUser } = useUser();

  return useQuery<RecentFoodsResponse>({
    queryKey: ['food-log', 'recent', currentUser?.id],
    queryFn: () => api.get(`/users/${currentUser!.id}/food-log/recent`),
    enabled: !!currentUser,
  });
}

export function useCreateFoodLog() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFoodLogInput) =>
      api.post<FoodLogEntry>(`/users/${currentUser!.id}/food-log`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-log', currentUser?.id] });
    },
  });
}

export function useUpdateFoodLog() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: number; input: UpdateFoodLogInput }) =>
      api.put<FoodLogEntry>(`/users/${currentUser!.id}/food-log/${entryId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-log', currentUser?.id] });
    },
  });
}

export function useDeleteFoodLog() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: number) =>
      api.delete(`/users/${currentUser!.id}/food-log/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-log', currentUser?.id] });
    },
  });
}
