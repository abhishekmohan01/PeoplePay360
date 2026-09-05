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
  contracts?: Array<{ id: string; contractNumber?: string; wage?: number; status?: string; salaryStructure?: any; workingSchedule?: any }>;
  workingSchedule?: string;
  workLocation?: string;
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

export async function getEmployees(): Promise<Employee[]> {
  const employees = await apiClient.get<any[]>('/employees');
  return employees.map(normalizeEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const emp = await apiClient.get<any>(`/employees/${id}`);
  return normalizeEmployee(emp);
}
