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
}

function normalizeStructure(s: any): SalaryStructure {
  return {
    ...s,
    type: s.type || 'Standard',
    baseSalary: s.baseSalary || (s._count ? s._count.rules * 10000 : 50000),
    status: s.isActive === false ? 'Archived' : 'Active',
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
    if (r.computationType === 'PERCENTAGE') {
      amount = `${r.computationValue}%`;
    } else if (r.computationType === 'FIXED_AMOUNT') {
      amount = `₹${Number(r.computationValue || 0).toLocaleString()}`;
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

export async function getPayrollRules(): Promise<PayrollRule[]> {
  const data = await apiClient.get<any[]>('/salary-rules');
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

