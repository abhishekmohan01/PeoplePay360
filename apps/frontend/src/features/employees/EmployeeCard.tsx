import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Employee } from '../../api/employees';
import { 
  Briefcase, 
  Mail, 
  MapPin, 
  Clock, 
  Calendar, 
  FileText, 
  ArrowUpRight,
  Shield
} from 'lucide-react';
import './EmployeeCard.css';

export const EmployeeCard: React.FC<{ employee: Employee }> = ({ employee }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/employees/${employee.id}`);
  };

  const handleQuickAction = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div 
      className="emp-card group" 
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      {/* Top Header: Avatar + Identity + Hover Action */}
      <div className="emp-card-header">
        <div className="relative">
          <Avatar name={employee.name} size="md" />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface)] ${
            (employee.status || '').toUpperCase() === 'ACTIVE' 
              ? 'bg-emerald-500' 
              : (employee.status || '').toUpperCase() === 'TERMINATED'
                ? 'bg-rose-500'
                : 'bg-amber-500'
          }`} />
        </div>

        <div className="emp-card-info flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="group-hover:text-primary transition-colors truncate">
              {employee.name}
            </h3>
            <div className="w-6 h-6 rounded-md bg-elevated border border-border/70 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-all flex-shrink-0">
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
          <p className="truncate">{employee.jobPosition || 'Employee'}</p>
        </div>
      </div>

      {/* Badges: Department & Code */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="emp-tag emp-tag-dept">
          <Briefcase size={11} />
          <span>{employee.departmentName || employee.department?.name || 'General'}</span>
        </span>
        {employee.employeeCode && (
          <span className="emp-tag emp-tag-code">
            {employee.employeeCode}
          </span>
        )}
      </div>

      {/* Metadata Details */}
      <div className="emp-card-body">
        <div className="emp-meta-row">
          <Mail size={12} className="text-text-muted flex-shrink-0" />
          <span className="truncate">{employee.email || employee.workEmail || 'No email provided'}</span>
        </div>

        <div className="emp-meta-row">
          <MapPin size={12} className="text-text-muted flex-shrink-0" />
          <span className="truncate">{employee.workLocation || 'Main Campus'}</span>
        </div>

        {employee.managerName && (
          <div className="emp-meta-row">
            <Shield size={12} className="text-text-muted flex-shrink-0" />
            <span className="truncate">Reports to: {employee.managerName}</span>
          </div>
        )}
      </div>

      {/* Quick Direct Activity Counters */}
      <div className="emp-card-stats">
        <button 
          type="button"
          onClick={(e) => handleQuickAction(e, `/attendance?employeeId=${employee.id}`)}
          title="View Attendance Logs"
          className="emp-stat-btn"
        >
          <Clock size={12} className="text-primary" />
          <span>{employee._count?.attendances ?? 0}</span>
        </button>

        <button 
          type="button"
          onClick={(e) => handleQuickAction(e, `/time-off?employeeId=${employee.id}`)}
          title="View Time Off"
          className="emp-stat-btn"
        >
          <Calendar size={12} className="text-amber-500" />
          <span>{employee._count?.timeOffRequests ?? 0}</span>
        </button>

        <button 
          type="button"
          onClick={(e) => handleQuickAction(e, `/contracts?employeeId=${employee.id}`)}
          title="View Contracts"
          className="emp-stat-btn"
        >
          <FileText size={12} className="text-emerald-500" />
          <span>{employee._count?.contracts ?? 0}</span>
        </button>
      </div>

      {/* Card Footer: Status Badge & Action hint */}
      <div className="emp-card-footer">
        <StatusBadge status={employee.status} />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted group-hover:text-primary transition-colors">
          <span>View Profile</span>
          <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </div>
  );
};
