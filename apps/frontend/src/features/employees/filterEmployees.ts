import type { Employee } from '../../api/employees';

export interface EmployeeFilterOptions {
  search?: string;
  deptFilter?: string;
  statusFilter?: string;
}

/**
 * Robust multi-case employee filter covering:
 * - Case-insensitive & trimmed search across name, firstName, lastName, department, job, email, code, location, status, type
 * - Multi-word tokenized search
 * - Case-insensitive & trimmed department matching (supports departmentName & department.name)
 * - Case-insensitive & trimmed status matching (ACTIVE, INACTIVE, TERMINATED, Active, inactive, etc.)
 * - Safe null/undefined fallbacks
 */
export function filterEmployees(
  employees: Employee[] | undefined | null,
  options: EmployeeFilterOptions
): Employee[] {
  if (!employees || !Array.isArray(employees)) return [];

  const { search = '', deptFilter = 'ALL', statusFilter = 'ALL' } = options;

  const searchTokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const normalizedDeptFilter = deptFilter.trim().toLowerCase();
  const normalizedStatusFilter = statusFilter.trim().toUpperCase();

  return employees.filter(emp => {
    // 1. Search Query filter (matches if empty, or if every token matches any employee attribute)
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => {
      const name = (emp.name || '').toLowerCase();
      const firstName = (emp.firstName || '').toLowerCase();
      const lastName = (emp.lastName || '').toLowerCase();
      const dept = (emp.departmentName || emp.department?.name || '').toLowerCase();
      const job = (emp.jobPosition || '').toLowerCase();
      const email = (emp.email || emp.workEmail || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const location = (emp.workLocation || '').toLowerCase();
      const status = (emp.status || '').toLowerCase();
      const type = (emp.employeeType || '').toLowerCase();

      return (
        name.includes(token) ||
        firstName.includes(token) ||
        lastName.includes(token) ||
        dept.includes(token) ||
        job.includes(token) ||
        email.includes(token) ||
        code.includes(token) ||
        location.includes(token) ||
        status.includes(token) ||
        type.includes(token)
      );
    });

    // 2. Department filter (case-insensitive and trimmed)
    const empDept = (emp.departmentName || emp.department?.name || '').trim().toLowerCase();
    const matchesDept = normalizedDeptFilter === 'all' || empDept === normalizedDeptFilter;

    // 3. Status filter (case-insensitive, trimmed, uppercase-normalized)
    const empStatus = (emp.status || '').trim().toUpperCase();
    const matchesStatus = normalizedStatusFilter === 'ALL' || empStatus === normalizedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });
}
