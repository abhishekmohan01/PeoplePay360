import { apiClient } from '../client';

export interface SalaryStructure {
  id: string;
  name: string;
  code?: string;
  type: string;
  baseSalary: number;
  status: 'Active' | 'Archived';
  isActive?: boolean;
  _count?: {
    rules: number;
    contracts: number;
    payruns: number;
  };
}

export interface PayrollRule {
  id: string;
  name: string;
  category: string;
  code: string;
  amount: number | string;
  computationType?: string;
  computationValue?: string;
  sequence?: number;
  salaryStructureId?: string;
  salaryStructure?: {
    id: string;
    name: string;
    code?: string;
  };
}

function normalizeStructure(s: any): SalaryStructure {
  const ruleCount = s._count?.rules ?? 0;
  const isExecutive = s.name?.toLowerCase().includes('exec');
  const fallbackBase = isExecutive ? 120000 : (ruleCount > 0 ? ruleCount * 10000 : 75000);

  return {
    ...s,
    type: s.type || (isExecutive ? 'Executive' : 'Standard'),
    baseSalary: s.baseSalary || fallbackBase,
    status: s.isActive === false ? 'Archived' : 'Active',
    _count: s._count || { rules: 0, contracts: 0, payruns: 0 },
  };
}

function normalizeRule(r: any): PayrollRule {
  let displayCategory = r.category || 'Basic';
  const catUpper = String(displayCategory).toUpperCase();
  if (catUpper === 'BASIC') displayCategory = 'Basic';
  else if (catUpper === 'ALLOWANCE') displayCategory = 'Allowance';
  else if (catUpper === 'DEDUCTION') displayCategory = 'Deduction';
  else if (catUpper === 'GROSS') displayCategory = 'Gross';
  else if (catUpper === 'NET') displayCategory = 'Net';

  let amount = r.amount;
  if (!amount) {
    if (r.computationType === 'PERCENTAGE' || r.computationType === 'PERCENTAGE_OF_WAGE') {
      amount = `${r.computationValue}% of Wage`;
    } else if (r.computationType === 'FIXED_AMOUNT') {
      amount = `₹${Number(r.computationValue || 0).toLocaleString()}`;
    } else if (r.computationType === 'PYTHON_CODE') {
      amount = 'fx Formula';
    } else {
      amount = r.computationValue || 'Rule Code';
    }
  }

  return {
    ...r,
    category: displayCategory,
    amount,
  };
}

export async function getSalaryStructures(): Promise<SalaryStructure[]> {
  const data = await apiClient.get<any[]>('/salary-structures');
  return data.map(normalizeStructure);
}

export async function createSalaryStructure(data: {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}): Promise<SalaryStructure> {
  const created = await apiClient.post<any>('/salary-structures', data);
  return normalizeStructure(created);
}

export async function getPayrollRules(params?: { salaryStructureId?: string }): Promise<PayrollRule[]> {
  const query = params?.salaryStructureId ? `?salaryStructureId=${params.salaryStructureId}` : '';
  const data = await apiClient.get<any[]>(`/salary-rules${query}`);
  return data.map(normalizeRule);
}

export async function createSalaryRule(data: {
  salaryStructureId?: string;
  name: string;
  code?: string;
  category: string;
  sequence?: number;
  computationType: string;
  computationValue: string;
}): Promise<PayrollRule> {
  const created = await apiClient.post<any>('/salary-rules', data);
  return normalizeRule(created);
}

