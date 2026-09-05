import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Temporary mock types until we build the backend
export interface User {
  id: string;
  name?: string;
  email: string;
  employeeName?: string | null;
  employeeId?: string | null;
  companyId?: string | null;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isHRManager: () => boolean;
  isPayrollUser: () => boolean;
  isTimeOffAdmin: () => boolean;
  isEmployeeOnly: () => boolean;
  canManageHR: () => boolean;
  canAccessPayroll: () => boolean;
  canEditPayrollConfig: () => boolean;
  canApproveTimeOff: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, rawUser) => {
        const user: User = {
          ...rawUser,
          name: rawUser.name || rawUser.employeeName || rawUser.email.split('@')[0],
        };
        set({ token, user });
      },
      
      logout: () => set({ token: null, user: null }),
      
      isAuthenticated: () => !!get().token && !!get().user,
      
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        const normalized = user.roles.map((r) => r.toUpperCase());
        return normalized.includes(role.toUpperCase()) || normalized.includes('ADMIN');
      },

      hasAnyRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        const normalized = user.roles.map((r) => r.toUpperCase());
        if (normalized.includes('ADMIN')) return true;
        return roles.some((r) => normalized.includes(r.toUpperCase()));
      },

      isAdmin: () => {
        const user = get().user;
        if (!user) return false;
        return user.roles.some((r) => r.toUpperCase() === 'ADMIN');
      },

      isHRManager: () => {
        return get().hasAnyRole(['HR_MANAGER', 'ADMIN']);
      },

      isPayrollUser: () => {
        return get().hasAnyRole(['PAYROLL_USER', 'ADMIN']);
      },

      isTimeOffAdmin: () => {
        return get().hasAnyRole(['TIME_OFF_ADMIN', 'HR_MANAGER', 'ADMIN']);
      },

      isEmployeeOnly: () => {
        const user = get().user;
        if (!user) return false;
        const normalized = user.roles.map((r) => r.toUpperCase());
        const hasPrivilegedRole = normalized.some((r) =>
          ['ADMIN', 'HR_MANAGER', 'PAYROLL_USER', 'TIME_OFF_ADMIN'].includes(r)
        );
        return !hasPrivilegedRole && normalized.includes('EMPLOYEE');
      },

      canManageHR: () => {
        return get().hasAnyRole(['HR_MANAGER', 'ADMIN']);
      },

      canAccessPayroll: () => {
        return get().hasAnyRole(['PAYROLL_USER', 'ADMIN']);
      },

      canEditPayrollConfig: () => {
        return get().isAdmin();
      },

      canApproveTimeOff: () => {
        return get().hasAnyRole(['HR_MANAGER', 'TIME_OFF_ADMIN', 'ADMIN']);
      },
    }),
    {
      name: 'pp360-auth',
    }
  )
);
