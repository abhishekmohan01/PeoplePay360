import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPayruns,
  getPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  createPayrun,
  getPayslip,
  type PayrunItem,
  type PayslipSummary,
} from '../../api/payroll';

export function usePayruns() {
  return useQuery<PayrunItem[], Error>({
    queryKey: ['payruns'],
    queryFn: getPayruns,
  });
}

export function usePayrun(id: string) {
  return useQuery<PayrunItem, Error>({
    queryKey: ['payrun', id],
    queryFn: () => getPayrun(id),
    enabled: Boolean(id),
  });
}

export function useCreatePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; periodStart: string; periodEnd: string; salaryStructureId: string }) =>
      createPayrun(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
    },
  });
}

export function useComputePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => computePayrun(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
    },
  });
}

export function useValidatePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => validatePayrun(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
    },
  });
}

export function useMarkPayrunPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPayrunPaid(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
    },
  });
}

export function usePayslip(id: string) {
  return useQuery<PayslipSummary, Error>({
    queryKey: ['payslip', id],
    queryFn: () => getPayslip(id),
    enabled: Boolean(id),
  });
}
