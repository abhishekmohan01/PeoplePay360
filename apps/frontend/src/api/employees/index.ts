// Mock data type
export interface Employee {
  id: string;
  name: string;
  email: string;
  jobPosition: string;
  department: string;
  manager?: string;
  workingSchedule?: string;
  company: string;
  workLocation: string;
  status: 'Active' | 'Inactive';
}

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Anita Oliver',
    email: 'anita@oxp.com',
    jobPosition: 'HR Manager',
    department: 'HR',
    company: 'OXP Pvt Ltd',
    workLocation: 'New York',
    status: 'Active',
    workingSchedule: 'Standard 40h'
  },
  {
    id: 'emp-2',
    name: 'Audrey Peterson',
    email: 'audrey@oxp.com',
    jobPosition: 'Sales Executive',
    department: 'Sales',
    company: 'OXP Pvt Ltd',
    workLocation: 'Chicago',
    status: 'Active',
    workingSchedule: 'Standard 40h'
  },
  {
    id: 'emp-3',
    name: 'Billy Kyle',
    email: 'billy@oxp.com',
    jobPosition: 'Support Agent',
    department: 'Support',
    company: 'OXP Pvt Ltd',
    workLocation: 'Remote',
    status: 'Active',
    workingSchedule: 'Part Time 20h'
  }
];

export async function getEmployees(): Promise<Employee[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockEmployees;
}

export async function getEmployee(id: string): Promise<Employee> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const emp = mockEmployees.find(e => e.id === id);
  if (!emp) throw new Error('Employee not found');
  return emp;
}
