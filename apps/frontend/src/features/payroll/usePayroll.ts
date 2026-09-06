import { useQuery } from '@tanstack/react-query';
import { 
  getComprehensiveDashboardData, 
  getPayslips, 
  getPayslip, 
  type DashboardFilters 
} from '../../api/payroll';

export function usePayrollDashboard(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['payroll-dashboard-comprehensive', filters],
    queryFn: () => getComprehensiveDashboardData(filters),
  });
}

export function usePayslips(params?: { employeeId?: string; status?: string }) {
  return useQuery({
    queryKey: ['payslips', params],
    queryFn: () => getPayslips(params),
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: ['payslips', id],
    queryFn: () => getPayslip(id),
    enabled: !!id,
  });
}
