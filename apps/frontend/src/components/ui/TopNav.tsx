import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { AttendanceWidget } from './AttendanceWidget';
import { useAuthStore } from '../../stores/auth.store';
import './TopNav.css';

export const TopNav = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isHR = useAuthStore((state) => state.canManageHR)();
  const isPayroll = useAuthStore((state) => state.canAccessPayroll)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const primaryRole = user?.roles?.[0] || 'EMPLOYEE';

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <span className="topnav-logo">HR</span>
      </div>

      <div className="topnav-links">
        {/* Employees / My Profile */}
        {isEmployeeOnly ? (
          user?.employeeId ? (
            <NavLink to={`/employees/${user.employeeId}`} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              My Profile
            </NavLink>
          ) : (
            <NavLink to="/employees" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Employees
            </NavLink>
          )
        ) : (
          <NavLink to="/employees" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Employees
          </NavLink>
        )}

        {/* Contracts - HR, Payroll, Admin only */}
        {(isHR || isPayroll || isAdmin) && (
          <NavLink to="/contracts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Contracts
          </NavLink>
        )}

        {/* Working Schedules - HR & Admin only */}
        {(isHR || isAdmin) && (
          <NavLink to="/working-schedules" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Schedules
          </NavLink>
        )}

        {/* Attendance - Available to everyone (employees see self-scoped) */}
        <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {isEmployeeOnly ? 'My Attendance' : 'Attendance'}
        </NavLink>

        {/* Time Off - Available to everyone */}
        <NavLink to="/time-off" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {isEmployeeOnly ? 'My Time Off' : 'Time Off'}
        </NavLink>

        {/* Payroll Config - Payroll & Admin only */}
        {(isPayroll || isAdmin) && (
          <NavLink to="/payroll-config" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Payroll Config
          </NavLink>
        )}

        {/* Payruns Batch Processing - Payroll & Admin only */}
        {(isPayroll || isAdmin) && (
          <NavLink to="/payroll/payruns" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Payruns
          </NavLink>
        )}

        {/* Payroll Dashboard - Payroll & Admin only */}
        {(isPayroll || isAdmin) && (
          <NavLink to="/payroll/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Payroll
          </NavLink>
        )}

        {/* Users - Admin only */}
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Users
          </NavLink>
        )}
      </div>

      <div className="topnav-actions flex items-center gap-3">
        {/* Quick-action attendance widget */}
        <AttendanceWidget />

        {/* Current User Role Pill */}
        {user && (
          <div className="hidden lg:flex flex-col text-right font-sans">
            <span className="text-xs font-bold text-text-primary leading-tight">
              {user.name || user.email}
            </span>
            <span className="text-[10px] text-accent uppercase tracking-wider font-semibold">
              {primaryRole}
            </span>
          </div>
        )}

        <ThemeToggle />
        <button className="nav-logout-btn font-[Caveat] text-lg font-bold cursor-pointer" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};
