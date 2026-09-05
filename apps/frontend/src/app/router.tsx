import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AppShell } from '../components/ui/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { EmployeeListPage } from '../features/employees/EmployeeListPage';
import { EmployeeDetail } from '../features/employees/EmployeeDetail';
import { ContractListPage } from '../features/contracts/ContractListPage';
import { ContractDetail } from '../features/contracts/ContractDetail';
import { ScheduleListPage } from '../features/schedules/ScheduleListPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { AttendanceDetail } from '../features/attendance/AttendanceDetail';
import { TimeOffPage } from '../features/time-off/TimeOffPage';
import { PayrollConfigPage } from '../features/payroll-config/PayrollConfigPage';
import { PayrollDashboardPage } from '../features/payroll/PayrollDashboardPage';
import { PayrunListPage } from '../features/payroll/PayrunListPage';
import { PayrunDetailPage } from '../features/payroll/PayrunDetailPage';
import { UserManagementPage } from '../features/users/UserManagementPage';

// We'll import real pages as they are built.
// For now, we use a simple placeholder component.
const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: '2rem' }}>
    <h2>{title}</h2>
    <p>This page is under construction.</p>
  </div>
);

// Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Role-Based Route Guard
const RoleRoute = ({
  children,
  allowedRoles,
  redirectPath = '/attendance',
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const isAdmin = useAuthStore((state) => state.isAdmin)();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Basic routing config matching PRD
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell>
          <Navigate to="/employees" replace />
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees',
    element: <ProtectedRoute><AppShell><EmployeeListPage /></AppShell></ProtectedRoute>,
  },
  {
    path: '/employees/:employeeId',
    element: <ProtectedRoute><AppShell><EmployeeDetail /></AppShell></ProtectedRoute>,
  },
  {
    path: '/contracts',
    element: (
      <RoleRoute allowedRoles={['HR_MANAGER', 'PAYROLL_USER', 'ADMIN']}>
        <AppShell><ContractListPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/contracts/:contractId',
    element: (
      <RoleRoute allowedRoles={['HR_MANAGER', 'PAYROLL_USER', 'ADMIN']}>
        <AppShell><ContractDetail /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/working-schedules',
    element: (
      <RoleRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
        <AppShell><ScheduleListPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/attendance',
    element: <ProtectedRoute><AppShell><AttendancePage /></AppShell></ProtectedRoute>,
  },
  {
    path: '/attendance/:recordId',
    element: <ProtectedRoute><AppShell><AttendanceDetail /></AppShell></ProtectedRoute>,
  },
  {
    path: '/time-off',
    element: <ProtectedRoute><AppShell><TimeOffPage /></AppShell></ProtectedRoute>,
  },
  {
    path: '/payroll-config',
    element: (
      <RoleRoute allowedRoles={['PAYROLL_USER', 'ADMIN']}>
        <AppShell><PayrollConfigPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/payroll/dashboard',
    element: (
      <RoleRoute allowedRoles={['PAYROLL_USER', 'ADMIN']}>
        <AppShell><PayrollDashboardPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/payroll/payruns',
    element: (
      <RoleRoute allowedRoles={['PAYROLL_USER', 'ADMIN']}>
        <AppShell><PayrunListPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/payroll/payruns/:payrunId',
    element: (
      <RoleRoute allowedRoles={['PAYROLL_USER', 'ADMIN']}>
        <AppShell><PayrunDetailPage /></AppShell>
      </RoleRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <RoleRoute allowedRoles={['ADMIN']}>
        <AppShell><UserManagementPage /></AppShell>
      </RoleRoute>
    ),
  },
]);
