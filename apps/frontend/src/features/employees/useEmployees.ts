import { useQuery } from '@tanstack/react-query';
import { getEmployees, getEmployee, type Employee } from '../../api/employees';

export function useEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee, Error>({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
}
