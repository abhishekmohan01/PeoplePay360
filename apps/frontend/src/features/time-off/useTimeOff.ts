import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeOffRequests,
  getTimeOffAllocations,
  approveTimeOff,
  refuseTimeOff,
  type TimeOffRequest,
  type TimeOffAllocation,
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

export function useApproveTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
    },
  });
}

export function useRefuseTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => refuseTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
    },
  });
}
