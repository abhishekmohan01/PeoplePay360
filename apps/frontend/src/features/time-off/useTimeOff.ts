import { useQuery } from '@tanstack/react-query';
import { getTimeOffRequests, type TimeOffRequest } from '../../api/time-off';

export function useTimeOffRequests() {
  return useQuery<TimeOffRequest[], Error>({
    queryKey: ['timeOff'],
    queryFn: getTimeOffRequests,
  });
}
