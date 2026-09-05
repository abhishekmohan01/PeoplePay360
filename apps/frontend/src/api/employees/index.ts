import { apiClient } from '../client';

export interface Employee {
  id: string;
  employeeCode: string;
  companyId?: string;
  departmentId?: string;
  managerId?: string | null;
  firstName: string;
  lastName: string;
  name: string;
  workEmail: string;
  email: string;
  workPhone?: string | null;
  jobPosition: string;
  employeeType?: string;
  status: string;
  department?: { id: string; name: string; code: string };
  departmentName?: string;
  company?: { id: string; name: string };
  companyName?: string;
  manager?: { id: string; firstName: string; lastName: string; employeeCode?: string; jobPosition?: string } | null;
  managerName?: string;
  subordinates?: Array<{ id: string; firstName: string; lastName: string; employeeCode?: string; jobPosition?: string }>;
  contracts?: Array<{ id: string; contractNumber?: string; wage?: number; status?: string; salaryStructure?: any; workingSchedule?: any }>;
  workingSchedule?: string;
  workLocation?: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIdentifierCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    status: string;
    roles?: Array<{
      role?: { id: string; code: string; name: string; description?: string };
      id?: string;
      code?: string;
      name?: string;
    }>;
  } | null;
  _count?: {
    contracts: number;
    attendances: number;
    timeOffRequests: number;
    timeOffAllocations?: number;
    payslips: number;
  };
}

function normalizeEmployee(emp: any): Employee {
  const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unnamed';
  const departmentName = emp.department?.name || (typeof emp.department === 'string' ? emp.department : 'General');
  const companyName = emp.company?.name || 'PeoplePay360 Inc.';
  const managerName = emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : undefined;
  const scheduleName = emp.contracts?.[0]?.workingSchedule?.name || 'Standard 40h';

  return {
    ...emp,
    name,
    email: emp.workEmail || emp.email || '',
    departmentName,
    companyName,
    managerName,
    workingSchedule: scheduleName,
    workLocation: emp.workLocation || 'Headquarters',
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  companyId?: string;
  isActive?: boolean;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  jobPosition: string;
  departmentId: string;
  employeeCode?: string;
  workEmail?: string;
  workPhone?: string;
  employeeType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | string;
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | string;
  managerId?: string | null;
  bankAccountNumber?: string;
  bankName?: string;
  bankIdentifierCode?: string;
  workLocation?: string;
}

export async function getEmployees(): Promise<Employee[]> {
  const employees = await apiClient.get<any[]>('/employees');
  return employees.map(normalizeEmployee);
}

/** Lightweight search — only fetches `limit` matching employees for the search widget */
export async function searchEmployees(
  query: string,
  limit = 20,
  status = 'ACTIVE',
): Promise<Employee[]> {
  const params = new URLSearchParams({
    search: query.trim(),
    limit: String(limit),
    status,
  });
  const employees = await apiClient.get<any[]>(`/employees?${params}`);
  return employees.map(normalizeEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const emp = await apiClient.get<any>(`/employees/${id}`);
  return normalizeEmployee(emp);
}

export async function createEmployee(data: CreateEmployeeInput): Promise<Employee> {
  const emp = await apiClient.post<any>('/employees', data);
  return normalizeEmployee(emp);
}

export async function updateEmployee(id: string, data: Partial<CreateEmployeeInput>): Promise<Employee> {
  const emp = await apiClient.patch<any>(`/employees/${id}`, data);
  return normalizeEmployee(emp);
}

export async function getDepartments(): Promise<Department[]> {
  return apiClient.get<Department[]>('/departments');
}
