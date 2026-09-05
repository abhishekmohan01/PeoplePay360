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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
    },
  });
}

export function usePayrollRules() {
  return useQuery<PayrollRule[], Error>({
    queryKey: ['payroll-rules'],
    queryFn: getPayrollRules,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-rules'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
    },
  });
}

