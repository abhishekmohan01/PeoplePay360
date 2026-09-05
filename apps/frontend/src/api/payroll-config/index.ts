export interface SalaryStructure {
  id: string;
  name: string;
  type: 'Employee' | 'Worker' | 'Executive';
  baseSalary: number;
  status: 'Active' | 'Archived';
}

export interface PayrollRule {
  id: string;
  name: string;
  category: 'Basic' | 'Allowance' | 'Deduction' | 'Net';
  code: string;
  amount: number | string;
}

const mockStructures: SalaryStructure[] = [
  { id: 'ss-1', name: 'Standard Employee', type: 'Employee', baseSalary: 50000, status: 'Active' },
  { id: 'ss-2', name: 'Executive Package', type: 'Executive', baseSalary: 120000, status: 'Active' },
];

const mockRules: PayrollRule[] = [
  { id: 'r-1', name: 'Basic Salary', category: 'Basic', code: 'BASIC', amount: '100% of Base' },
  { id: 'r-2', name: 'House Rent Allowance', category: 'Allowance', code: 'HRA', amount: '20% of Basic' },
  { id: 'r-3', name: 'Health Insurance', category: 'Deduction', code: 'HLTH', amount: 150 },
  { id: 'r-4', name: 'Income Tax', category: 'Deduction', code: 'TAX', amount: '15% of Gross' },
];

export async function getSalaryStructures(): Promise<SalaryStructure[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockStructures;
}

export async function getPayrollRules(): Promise<PayrollRule[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRules;
}
