import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAttendance,
  getAttendanceRecord,
  getAttendanceStatus,
  checkIn,
  checkOut,
  type AttendanceRecord,
  type AttendanceStatusResponse,
} from '../../api/attendance';

export function useAttendance(params?: { employeeId?: string; status?: string }) {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: ['attendance', params],
    queryFn: () => getAttendance(params),
  });
}

export function useAttendanceStatus() {
  return useQuery<AttendanceStatusResponse, Error>({
    queryKey: ['attendance-status'],
    queryFn: getAttendanceStatus,
    refetchInterval: 30000, // refresh every 30 seconds
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery<AttendanceRecord, Error>({
    queryKey: ['attendance', id],
    queryFn: () => getAttendanceRecord(id),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { isWfh?: boolean; locationType?: string; latitude?: number; longitude?: number; notes?: string }) =>
      checkIn(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-status'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
