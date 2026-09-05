import { useQuery, useMutation } from '@tanstack/react-query';
import { getAttendance, getAttendanceRecord, checkIn, checkOut, type AttendanceRecord } from '../../api/attendance';

export function useAttendance() {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: ['attendance'],
    queryFn: getAttendance,
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery<AttendanceRecord, Error>({
    queryKey: ['attendance', id],
    queryFn: () => getAttendanceRecord(id),
  });
}

export function useCheckIn() {
  return useMutation({
    mutationFn: (empId: string) => checkIn(empId),
  });
}

export function useCheckOut() {
  return useMutation({
    mutationFn: (empId: string) => checkOut(empId),
  });
}
