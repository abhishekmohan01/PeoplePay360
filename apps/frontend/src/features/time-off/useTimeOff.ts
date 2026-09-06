import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeOffRequests,
  getTimeOffAllocations,
  getTimeOffTypes,
  createTimeOffRequest,
  createTimeOffAllocation,
  approveTimeOff,
  refuseTimeOff,
  type TimeOffRequest,
  type TimeOffAllocation,
  type TimeOffType,
} from '../../api/time-off';

export function useTimeOffRequests(params?: { myTeam?: boolean; employeeId?: string; status?: string }) {
  return useQuery<TimeOffRequest[], Error>({
    queryKey: ['timeOff', params],
    queryFn: () => getTimeOffRequests(params),
  });
}

export function useTimeOffAllocations(params?: { employeeId?: string; timeOffTypeId?: string; status?: string }) {
  return useQuery<TimeOffAllocation[], Error>({
    queryKey: ['timeOffAllocations', params],
    queryFn: () => getTimeOffAllocations(params),
  });
}

export function useTimeOffTypes() {
  return useQuery<TimeOffType[], Error>({
    queryKey: ['timeOffTypes'],
    queryFn: getTimeOffTypes,
  });
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createTimeOffRequest>[0]) => createTimeOffRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
    },
  });
}

export function useCreateTimeOffAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createTimeOffAllocation>[0]) => createTimeOffAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
    },
  });
}

export function useApproveTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveTimeOff(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['timeOff'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['timeOff'] });
      // Optimistically mark request as APPROVED
      queryClient.setQueriesData({ queryKey: ['timeOff'] }, (old: any) =>
        Array.isArray(old)
          ? old.map((r: any) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
          : old
      );
      return { previousData };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
    },
  });
}

export function useRefuseTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => refuseTimeOff(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['timeOff'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['timeOff'] });
      // Optimistically mark request as REFUSED
      queryClient.setQueriesData({ queryKey: ['timeOff'] }, (old: any) =>
        Array.isArray(old)
          ? old.map((r: any) => (r.id === id ? { ...r, status: 'REFUSED' } : r))
          : old
      );
      return { previousData };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
    },
  });
}

