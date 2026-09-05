import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedules, createSchedule, updateSchedule, type Schedule } from '../../api/schedules';

export function useSchedules() {
  return useQuery<Schedule[], Error>({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      timezone?: string;
      days?: { dayOfWeek: number; startTime: string; endTime: string; hours: number; breakMinutes: number }[];
    }) => createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        timezone?: string;
        isActive?: boolean;
        days?: { dayOfWeek: number; startTime: string; endTime: string; hours: number; breakMinutes: number }[];
      };
    }) => updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

