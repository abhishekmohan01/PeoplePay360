import { describe, it, expect } from 'bun:test';
import type { UserAccount } from '../../api/users';

function filterUsers(users: UserAccount[] | undefined, search: string, roleFilter: string): UserAccount[] {
  if (!users) return [];
  return users.filter((user) => {
    const s = search.trim().toLowerCase();
    const matchesSearch = !s ||
      (user.employeeName || '').toLowerCase().includes(s) ||
      (user.email || '').toLowerCase().includes(s) ||
      (user.role || '').toLowerCase().includes(s) ||
      (user.employee?.employeeCode || '').toLowerCase().includes(s);

    const matchesRole = roleFilter === 'ALL' || (
      user.roles?.some((r) => r.code?.toUpperCase() === roleFilter || r.name?.toUpperCase() === roleFilter)
    );

    return matchesSearch && matchesRole;
  });
}

const mockUsers: UserAccount[] = [
  {
    id: 'u-1',
    name: 'Aarav Mehta',
    employeeName: 'Aarav Mehta',
    email: 'aarav@company.com',
    role: 'Payroll Specialist',
    roles: [{ id: 'r-1', code: 'PAYROLL_USER', name: 'Payroll Specialist' }],
    status: 'Active',
  },
  {
    id: 'u-2',
    name: 'Maya Shah',
    employeeName: 'Maya Shah',
    email: 'maya@company.com',
    role: 'Time Off Administrator',
    roles: [{ id: 'r-2', code: 'TIME_OFF_ADMIN', name: 'Time Off Administrator' }],
    status: 'Active',
  },
  {
    id: 'u-3',
    name: 'Rohan Patel (HR & Payroll Manager)',
    employeeName: 'Rohan Patel',
    email: 'rohan@company.com',
    role: 'HR Manager, Payroll Specialist',
    roles: [
      { id: 'r-3', code: 'HR_MANAGER', name: 'HR Manager' },
      { id: 'r-1', code: 'PAYROLL_USER', name: 'Payroll Specialist' },
    ],
    status: 'Active',
  },
  {
    id: 'u-4',
    name: 'Nisha Rao (Admin)',
    employeeName: 'Nisha Rao',
    email: 'nisha@company.com',
    role: 'System Administrator',
    roles: [{ id: 'r-4', code: 'ADMIN', name: 'System Administrator' }],
    status: 'Active',
  },
];

describe('User Management Multi-Role Filter', () => {
  it('returns all users when roleFilter is ALL', () => {
    const result = filterUsers(mockUsers, '', 'ALL');
    expect(result.length).toBe(4);
  });

  it('filters by PAYROLL_USER and includes multi-role user Rohan Patel', () => {
    const result = filterUsers(mockUsers, '', 'PAYROLL_USER');
    expect(result.length).toBe(2);
    expect(result.map(u => u.employeeName)).toContain('Aarav Mehta');
    expect(result.map(u => u.employeeName)).toContain('Rohan Patel');
  });

  it('filters by HR_MANAGER and finds Rohan Patel', () => {
    const result = filterUsers(mockUsers, '', 'HR_MANAGER');
    expect(result.length).toBe(1);
    expect(result[0]!.employeeName).toBe('Rohan Patel');
  });

  it('filters by TIME_OFF_ADMIN and finds Maya Shah', () => {
    const result = filterUsers(mockUsers, '', 'TIME_OFF_ADMIN');
    expect(result.length).toBe(1);
    expect(result[0]!.employeeName).toBe('Maya Shah');
  });

  it('filters by ADMIN and finds Nisha Rao', () => {
    const result = filterUsers(mockUsers, '', 'ADMIN');
    expect(result.length).toBe(1);
    expect(result[0]!.employeeName).toBe('Nisha Rao');
  });

  it('searches by name or email with active role filter', () => {
    const result = filterUsers(mockUsers, 'rohan', 'PAYROLL_USER');
    expect(result.length).toBe(1);
    expect(result[0]!.employeeName).toBe('Rohan Patel');
  });
});
