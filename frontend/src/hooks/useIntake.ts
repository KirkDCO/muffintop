import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useUser } from '../providers/UserProvider';
import type { IntakeEntry, IntakeResponse, CreateIntakeInput, IntakeType } from '@muffintop/shared/types';

/**
 * Hook to fetch intake entries for a date and type
 */
export function useIntake(date: string, type: IntakeType) {
  const { currentUser } = useUser();

  return useQuery<IntakeResponse>({
    queryKey: ['intake', currentUser?.id, date, type],
    queryFn: () =>
      api.get(`/users/${currentUser!.id}/intake?date=${date}&type=${type}`),
    enabled: !!currentUser,
  });
}

/**
 * Hook to create a new intake entry
 */
export function useCreateIntake() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIntakeInput) =>
      api.post<IntakeEntry>(`/users/${currentUser!.id}/intake`, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['intake', currentUser?.id, variables.logDate, variables.intakeType],
      });
    },
  });
}

/**
 * Hook to delete an intake entry
 */
export function useDeleteIntake() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { entryId: number; logDate: string; intakeType: IntakeType }) =>
      api.delete(`/users/${currentUser!.id}/intake/${input.entryId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['intake', currentUser?.id, variables.logDate, variables.intakeType],
      });
    },
  });
}
