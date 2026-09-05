import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee } from './useEmployees';
import { Avatar } from '../../components/ui/Avatar';

export const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError } = useEmployee(employeeId!);

  if (isLoading) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading employee...</div>;
  if (isError || !employee) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Failed to load employee</div>;

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full p-4">
      
      {/* Top Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-[Caveat] font-bold m-0 text-text-primary">Employee / {employee.name}</h1>
        <p className="text-sm text-muted m-0 mt-1 font-[Caveat] text-lg">Main employee form with related HR actions</p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
        {canManageHR ? (
          <button className="px-6 py-2 border-2 border-border/80 rounded-xl font-[Caveat] font-bold tracking-widest text-text-primary bg-surface hover:bg-elevated transition-colors uppercase cursor-pointer">
            Edit
          </button>
        ) : (
          <span className="px-4 py-1.5 border border-border/80 rounded-xl font-[Caveat] text-muted text-lg bg-surface/50">
            Personal Profile (Read-Only)
          </span>
        )}
        
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(`/time-off?employeeId=${employee.id}`)}
            className="px-4 py-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-xl font-[Caveat] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Time Off {employee._count?.timeOffRequests ?? 0}
          </button>
          {canManageHR && (
            <button 
              onClick={() => navigate(`/contracts?employeeId=${employee.id}`)}
              className="px-4 py-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-xl font-[Caveat] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Contracts {employee._count?.contracts ?? 0}
            </button>
          )}
          <button 
            onClick={() => navigate(`/attendance?employeeId=${employee.id}`)}
            className="px-4 py-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-xl font-[Caveat] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Attendance {employee._count?.attendances ?? 0}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 bg-blue-100 text-blue-700 rounded-3xl border border-blue-200 flex items-center justify-center font-[Caveat] font-bold text-3xl shadow-sm">
          {(employee.name || 'EP').split(' ').filter(Boolean).map(n => n[0]).join('')}
        </div>
        <div className="flex flex-col">
          <h2 className="text-4xl font-[Caveat] font-bold text-text-primary m-0 mb-2">{employee.name}</h2>
          <div className="text-muted font-[Caveat] text-xl">{employee.jobPosition} • {employee.departmentName || employee.department?.name}</div>
          <div className="text-muted text-sm font-primary mt-1">{employee.email || employee.workEmail} | {employee.workPhone || 'N/A'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border mb-8">
        <div className="pb-2 border-b-2 border-[#2563eb] text-[#2563eb] font-bold font-[Caveat] text-xl cursor-pointer">
          Work Information
        </div>
        <div className="pb-2 text-muted font-[Caveat] text-xl cursor-pointer hover:text-text-primary">
          Private Information
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl font-[Caveat] text-lg">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <label className="w-40 text-muted">Department</label>
            <input type="text" readOnly value={employee.departmentName || employee.department?.name || ''} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Manager</label>
            <input type="text" readOnly value={employee.managerName || (employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'None')} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Working Schedule</label>
            <input type="text" readOnly value={employee.workingSchedule || 'Standard 40h'} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Company</label>
            <input type="text" readOnly value={employee.companyName || employee.company?.name || 'PeoplePay360 Inc.'} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <label className="w-40 text-muted">Job Position</label>
            <input type="text" readOnly value={employee.jobPosition} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Work Location</label>
            <input type="text" readOnly value={employee.workLocation || 'Main Office'} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Status</label>
            <input type="text" readOnly value={employee.status} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Work Email</label>
            <input type="text" readOnly value={employee.email || employee.workEmail} className="flex-1 border border-border/80 rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

      </div>

      <div className="mt-16 text-muted font-[Caveat] text-lg italic">
        Useful note: smart buttons should open related Contracts, Attendance and Time Off records filtered for the current employee.
      </div>
    </div>
  );
};
