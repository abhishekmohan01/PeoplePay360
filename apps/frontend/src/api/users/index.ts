export interface UserAccount {
  id: string;
  name: string;
  employeeName: string;
  email: string;
  role: 'Employee' | 'Hr Manager' | 'Hr Payroll User' | 'Hr Payroll Admin' | 'Admin' | 'Time Off Admin' | 'Time Off User' | 'Payroll User' | 'Payroll Admin';
  status: 'Active' | 'Inactive';
}

export const mockUsers: UserAccount[] = [
  { id: 'u-admin', name: 'Super Admin', employeeName: 'Super Admin', email: 'superadmin@company.com', role: 'Admin', status: 'Active' },
  { id: 'u-emp', name: 'John Employee', employeeName: 'John Employee', email: 'employee@company.com', role: 'Employee', status: 'Active' },
  { id: 'u-1', name: 'Aarav Mehta', employeeName: 'Aarav Mehta', email: 'aarav@company.com', role: 'Payroll User', status: 'Active' },
  { id: 'u-2', name: 'Maya Shah', employeeName: 'Maya Shah', email: 'maya@company.com', role: 'Time Off Admin', status: 'Active' },
  { id: 'u-3', name: 'Rohan Patel', employeeName: 'Rohan Patel', email: 'rohan@company.com', role: 'Time Off User', status: 'Active' },
  { id: 'u-4', name: 'Nisha Rao', employeeName: 'Nisha Rao', email: 'nisha@company.com', role: 'Payroll Admin', status: 'Active' },
];

export async function getUsers(): Promise<UserAccount[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockUsers;
}

export async function createUser(data: Partial<UserAccount>): Promise<UserAccount> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newUser = { ...data, id: `u-${Date.now()}` } as UserAccount;
  mockUsers.push(newUser);
  return newUser;
}
