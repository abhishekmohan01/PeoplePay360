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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
    },
  });
}

export function useRefuseTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => refuseTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      queryClient.invalidateQueries({ queryKey: ['timeOffAllocations'] });
    },
  });
}

