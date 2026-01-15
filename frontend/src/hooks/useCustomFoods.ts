import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type {
  CustomFood,
  CustomFoodSummary,
  CreateCustomFoodInput,
} from '@muffintop/shared/types';

interface CustomFoodsResponse {
  customFoods: CustomFoodSummary[];
}

interface CustomFoodSearchParams {
  search?: string;
  limit?: number;
}

export function useCustomFoods(params?: CustomFoodSearchParams) {
  const { currentUser } = useUser();

  return useQuery<CustomFoodsResponse>({
    queryKey: ['customFoods', currentUser?.id, params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return api.get(`/users/${currentUser!.id}/custom-foods${qs ? `?${qs}` : ''}`);
    },
    enabled: !!currentUser,
  });
}

export function useCustomFood(customFoodId: number | null) {
  const { currentUser } = useUser();

  return useQuery<CustomFood>({
    queryKey: ['customFoods', currentUser?.id, customFoodId],
    queryFn: () => api.get(`/users/${currentUser!.id}/custom-foods/${customFoodId}`),
    enabled: !!currentUser && customFoodId !== null,
  });
}

export function useCreateCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomFoodInput) =>
      api.post<CustomFood>(`/users/${currentUser!.id}/custom-foods`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFoods', currentUser?.id] });
    },
  });
}

export function useUpdateCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customFoodId, input }: { customFoodId: number; input: CreateCustomFoodInput }) =>
      api.put<CustomFood>(`/users/${currentUser!.id}/custom-foods/${customFoodId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFoods', currentUser?.id] });
    },
  });
}

export function useDeleteCustomFood() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customFoodId: number) =>
      api.delete(`/users/${currentUser!.id}/custom-foods/${customFoodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFoods', currentUser?.id] });
    },
  });
}
