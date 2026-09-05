import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../../stores/auth.store';
import './TopNav.css';

export const TopNav = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.roles?.includes('Admin');

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <span className="topnav-logo">HR</span>
      </div>

      <div className="topnav-links">
        <NavLink to="/employees" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Employees
        </NavLink>
        <NavLink to="/contracts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Contracts
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Attendance
        </NavLink>
        <NavLink to="/time-off" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Time Off
        </NavLink>
        <NavLink to="/payroll-config" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Payroll Config
        </NavLink>
        <NavLink to="/payroll/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Payroll
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Users
          </NavLink>
        )}
      </div>

      <div className="topnav-actions">
        <ThemeToggle />
        <button className="nav-logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};
