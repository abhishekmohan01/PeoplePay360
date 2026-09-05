import { apiClient } from '../client';

export interface Contract {
  id: string;
  contractNumber: string;
  employeeId: string;
  employeeName: string;
  type: string;
  contractType: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  salary: number;
  wage: number;
  jobPosition?: string;
  departmentName?: string;
  scheduleName?: string;
  department?: { id: string; name: string };
  workingSchedule?: { id: string; name: string };
  salaryStructure?: { id: string; name: string; code: string };
  employee?: { id: string; employeeCode?: string; firstName: string; lastName: string };
}

function normalizeContract(c: any): Contract {
  const employeeName = c.employee 
    ? `${c.employee.firstName} ${c.employee.lastName}`.trim() 
    : (c.employeeName || 'Unknown');
  const startDate = c.startDate ? c.startDate.split('T')[0] : '';
  const endDate = c.endDate ? c.endDate.split('T')[0] : null;
  const wage = Number(c.wage || c.salary || 0);

  return {
    ...c,
    contractNumber: c.contractNumber || c.id,
    employeeName,
    startDate,
    endDate,
    salary: wage,
    wage,
    type: c.contractType || c.type || 'OPEN_ENDED',
    departmentName: c.department?.name || 'General',
    scheduleName: c.workingSchedule?.name || 'Standard 40h',
    jobPosition: c.jobPosition || 'Staff',
  };
}

export async function getContracts(employeeId?: string): Promise<Contract[]> {
  const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
  const data = await apiClient.get<any[]>(`/contracts${query}`);
  return data.map(normalizeContract);
}

export async function getContract(id: string): Promise<Contract> {
  const data = await apiClient.get<any>(`/contracts/${id}`);
  return normalizeContract(data);
}
