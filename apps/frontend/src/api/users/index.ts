import { apiClient } from '../client';

export interface UserAccount {
  id: string;
  name: string;
  employeeName: string;
  email: string;
  role: string;
  roles: Array<{ id: string; code: string; name: string }>;
  status: string;
  employeeId?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    department?: { id: string; name: string };
  } | null;
}

function normalizeUser(u: any): UserAccount {
  const employeeName = u.employee 
    ? `${u.employee.firstName} ${u.employee.lastName}`.trim() 
    : (u.employeeName || u.email.split('@')[0]);

  const roleList: Array<{ id: string; code: string; name: string }> = Array.isArray(u.roles)
    ? u.roles.map((r: any) => typeof r === 'string' ? { id: r, code: r, name: r } : (r.role || r))
    : [];

  const mainRole = roleList.length > 0 
    ? roleList.map(r => r.name || r.code).join(', ') 
    : (u.role || 'Employee');

  return {
    ...u,
    name: employeeName,
    employeeName,
    role: mainRole,
    roles: roleList,
    status: u.status === 'ACTIVE' ? 'Active' : (u.status || 'Active'),
  };
}

export async function getUsers(): Promise<UserAccount[]> {
  const data = await apiClient.get<any[]>('/users');
  return data.map(normalizeUser);
}

export async function createUser(data: {
  email: string;
  password?: string;
  employeeId?: string | null;
  roleCodes?: string[];
  role?: string;
  status?: string;
}): Promise<UserAccount> {
  const roleCode = data.role ? data.role.toUpperCase().replace(/\s+/g, '_') : 'EMPLOYEE';
  const roleCodes = Array.isArray(data.roleCodes) && data.roleCodes.length > 0 
    ? data.roleCodes 
    : [roleCode];

  const payload = {
    email: data.email,
    password: data.password || 'password123',
    employeeId: data.employeeId || null,
    roleCodes,
  };
  const created = await apiClient.post<any>('/users', payload);
  return normalizeUser(created);
}

export async function updateUser(
  id: string, 
  data: { status?: string; email?: string; employeeId?: string | null; roleCodes?: string[] }
): Promise<UserAccount> {
  const patchData: any = {};
  if (data.status) patchData.status = data.status.toUpperCase();
  if (data.email) patchData.email = data.email;
  if (data.employeeId !== undefined) patchData.employeeId = data.employeeId;

  const res = await apiClient.patch<any>(`/users/${id}`, patchData);

  if (Array.isArray(data.roleCodes)) {
    try {
      await apiClient.patch<any>(`/users/${id}/roles`, { roleCodes: data.roleCodes });
    } catch (err) {
      console.warn("Could not update roles:", err);
    }
  }

  return normalizeUser(res);
}
