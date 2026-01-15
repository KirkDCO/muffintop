import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { DailyTarget, CreateDailyTargetInput, UpdateDailyTargetInput } from '@muffintop/shared/types';

interface TargetResponse {
  target: DailyTarget | null;
}

/**
 * Hook to fetch current user's daily targets
 */
export function useTargets() {
  const { currentUser } = useUser();

  return useQuery<TargetResponse>({
    queryKey: ['targets', currentUser?.id],
    queryFn: () => api.get(`/users/${currentUser!.id}/targets`),
    enabled: !!currentUser,
  });
}

/**
 * Hook to create daily targets
 */
export function useCreateTargets() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDailyTargetInput) =>
      api.post<DailyTarget>(`/users/${currentUser!.id}/targets`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets', currentUser?.id] });
    },
  });
}

/**
 * Hook to update daily targets
 */
export function useUpdateTargets() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDailyTargetInput) =>
      api.put<DailyTarget>(`/users/${currentUser!.id}/targets`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets', currentUser?.id] });
    },
  });
}

/**
 * Hook to create targets for a specific user (used during user creation)
 */
export function useCreateTargetsForUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: number; input: CreateDailyTargetInput }) =>
      api.post<DailyTarget>(`/users/${userId}/targets`, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['targets', userId] });
    },
  });
}
