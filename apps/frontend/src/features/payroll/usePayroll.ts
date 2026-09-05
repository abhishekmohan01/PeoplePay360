import { useQuery } from '@tanstack/react-query';
import { getComprehensiveDashboardData, type DashboardFilters } from '../../api/payroll';

export function usePayrollDashboard(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['payroll-dashboard-comprehensive', filters],
    queryFn: () => getComprehensiveDashboardData(filters),
  });
}
