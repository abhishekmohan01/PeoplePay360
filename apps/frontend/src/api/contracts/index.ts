export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'CDI' | 'CDD' | 'Freelance' | 'Internship';
  startDate: string;
  endDate?: string;
  status: 'Draft' | 'Active' | 'Terminated';
  salary: number;
}

const mockContracts: Contract[] = [
  {
    id: 'c-1',
    employeeId: 'emp-1',
    employeeName: 'Anita Oliver',
    type: 'CDI',
    startDate: '2023-01-15',
    status: 'Active',
    salary: 85000
  },
  {
    id: 'c-2',
    employeeId: 'emp-2',
    employeeName: 'Audrey Peterson',
    type: 'CDD',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'Active',
    salary: 65000
  }
];

export async function getContracts(): Promise<Contract[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockContracts;
}

export async function getContract(id: string): Promise<Contract> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const contract = mockContracts.find(c => c.id === id);
  if (!contract) throw new Error('Contract not found');
  return contract;
}
