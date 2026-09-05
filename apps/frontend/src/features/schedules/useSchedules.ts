import { useQuery } from '@tanstack/react-query';
import { getSchedules, type Schedule } from '../../api/schedules';

export function useSchedules() {
  return useQuery<Schedule[], Error>({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });
}
