import { useQuery } from '@tanstack/react-query';
import { getSalaryStructures, getPayrollRules, type SalaryStructure, type PayrollRule } from '../../api/payroll-config';

export function useSalaryStructures() {
  return useQuery<SalaryStructure[], Error>({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  });
}

export function usePayrollRules() {
  return useQuery<PayrollRule[], Error>({
    queryKey: ['payroll-rules'],
    queryFn: getPayrollRules,
  });
}
