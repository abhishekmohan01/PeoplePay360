import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEmployees, 
  searchEmployees,
  getEmployee, 
  createEmployee, 
  updateEmployee,
  getDepartments, 
  type Employee, 
  type Department, 
  type CreateEmployeeInput 
} from '../../api/employees';

export function useEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
}

/**
 * Debounced server-side employee search — efficient for large datasets.
 * Only fires when query is >= 2 characters.
 */
export function useEmployeeSearch(query: string, limit = 20) {
  return useQuery<Employee[], Error>({
    queryKey: ['employees', 'search', query, limit],
    queryFn: () => searchEmployees(query, limit),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,   // cache results for 30s — avoids re-fetching same query
    placeholderData: [],  // show empty list while loading, not undefined
  });
}

export function useEmployee(id: string) {
  const queryClient = useQueryClient();
  return useQuery<Employee, Error>({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id),
    initialData: () => {
      const all = queryClient.getQueryData<Employee[]>(['employees']);
      return all?.find((e) => e.id === id);
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['employees'])?.dataUpdatedAt;
    },
    enabled: !!id,
  });
}

export function useDepartments() {
  return useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<Employee, Error, CreateEmployeeInput>({
    mutationFn: (data: CreateEmployeeInput) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<Employee, Error, { id: string; data: Partial<CreateEmployeeInput> }>({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', updated.id] });
    },
  });
}
