import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalaryStructures,
  getPayrollRules,
  createSalaryStructure,
  createSalaryRule,
  type SalaryStructure,
  type PayrollRule,
} from '../../api/payroll-config';

export function useSalaryStructures() {
  return useQuery<SalaryStructure[], Error>({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code?: string; description?: string; isActive?: boolean }) =>
      createSalaryStructure(data),
    onSuccess: (newStruct) => {
      // Optimistically push new structure to cache immediately
      queryClient.setQueryData<SalaryStructure[]>(['salary-structures'], (old) => {
        if (!old) return [newStruct];
        if (old.some((s) => s.id === newStruct.id)) return old;
        return [...old, newStruct];
      });
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['salary-structures'], exact: false });
      queryClient.refetchQueries({ queryKey: ['salary-structures'], exact: false });
    },
  });
}

export function usePayrollRules(salaryStructureId?: string) {
  return useQuery<PayrollRule[], Error>({
    queryKey: ['payroll-rules', salaryStructureId],
    queryFn: () => getPayrollRules(salaryStructureId ? { salaryStructureId } : undefined),
  });
}

export function useCreateSalaryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      salaryStructureId?: string;
      name: string;
      code?: string;
      category: string;
      sequence?: number;
      computationType: string;
      computationValue: string;
    }) => createSalaryRule(data),
    onSuccess: (newRule) => {
      // Optimistically update rules cache immediately
      queryClient.setQueryData<PayrollRule[]>(['payroll-rules', undefined], (old) => {
        if (!old) return [newRule];
        if (old.some((r) => r.id === newRule.id)) return old;
        return [...old, newRule];
      });
      queryClient.setQueryData<PayrollRule[]>(['payroll-rules'], (old) => {
        if (!old) return [newRule];
        if (old.some((r) => r.id === newRule.id)) return old;
        return [...old, newRule];
      });
      if (newRule.salaryStructureId) {
        queryClient.setQueryData<PayrollRule[]>(['payroll-rules', newRule.salaryStructureId], (old) => {
          if (!old) return [newRule];
          if (old.some((r) => r.id === newRule.id)) return old;
          return [...old, newRule];
        });

        // Immediately increment rule count on the structure in the cache
        queryClient.setQueryData<SalaryStructure[]>(['salary-structures'], (old) => {
          if (!old) return old;
          return old.map((s) => {
            if (s.id === newRule.salaryStructureId) {
              const currentCount = s._count?.rules ?? 0;
              return {
                ...s,
                _count: {
                  rules: currentCount + 1,
                  contracts: s._count?.contracts ?? 0,
                  payruns: s._count?.payruns ?? 0,
                },
              };
            }
            return s;
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ['payroll-rules'], exact: false });
      queryClient.refetchQueries({ queryKey: ['payroll-rules'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'], exact: false });
      queryClient.refetchQueries({ queryKey: ['salary-structures'], exact: false });
    },
  });
}

