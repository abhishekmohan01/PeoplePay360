import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { AttendanceWidget } from './AttendanceWidget';
import { useAuthStore } from '../../stores/auth.store';
import { LogOut, Settings, ChevronDown, Users } from 'lucide-react';
import './TopNav.css';

export const TopNav = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isHR = useAuthStore((state) => state.canManageHR)();
  const isPayroll = useAuthStore((state) => state.canAccessPayroll)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const primaryRole = user?.roles?.[0] || 'EMPLOYEE';

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <div className="topnav-logo-icon">P</div>
        <span className="topnav-brand-text hidden md:inline">
          PeoplePay<span>360</span>
        </span>
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

        {/* Contracts - Employees see My Contracts, HR/Admin see Contracts */}
        {isEmployeeOnly ? (
          <NavLink to="/contracts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            My Contracts
          </NavLink>
        ) : (isHR || isPayroll || isAdmin) && (
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

        {/* Attendance - Available to everyone */}
        <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {isEmployeeOnly ? 'My Attendance' : 'Attendance'}
        </NavLink>

        {/* Time Off - Available to everyone */}
        <NavLink to="/time-off" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {isEmployeeOnly ? 'My Time Off' : 'Time Off'}
        </NavLink>

        {/* My Payslips - Employee only navigation link */}
        {isEmployeeOnly && (
          <NavLink to="/payslips" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            My Payslips
          </NavLink>
        )}

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
            Payroll Analytics
          </NavLink>
        )}

        {/* Settings dropdown — Admin & HR Manager only */}
        {(isAdmin || isHR) && (
          <div className="nav-dropdown-root">
            <button className="nav-link nav-dropdown-trigger" type="button">
              <Settings size={13} />
              <span>Settings</span>
              <ChevronDown size={11} className="nav-dropdown-chevron" />
            </button>
            <div className="nav-dropdown-menu">
              <button
                type="button"
                className="nav-dropdown-item"
                onClick={() => navigate('/users')}
              >
                <Users size={13} />
                <span>Users &amp; Access</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="topnav-actions">
        {/* Quick-action attendance widget */}
        <AttendanceWidget />

        {/* Current User Role Pill */}
        {user && (
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-text-primary leading-tight">
              {user.name || user.email}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              {primaryRole.replace('_', ' ')}
            </span>
          </div>
        )}

        <ThemeToggle />
        <button className="nav-logout-btn" onClick={logout} title="Sign Out">
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};
