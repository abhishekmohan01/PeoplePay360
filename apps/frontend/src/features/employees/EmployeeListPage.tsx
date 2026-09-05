import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from './useEmployees';
import { filterEmployees } from './filterEmployees';
import { EmployeeModal } from './EmployeeModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmployeeCard } from './EmployeeCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Users, 
  Building2, 
  CheckCircle2, 
  Filter, 
  X, 
  Clock, 
  Calendar, 
  FileText 
} from 'lucide-react';
import './EmployeeListPage.css';

export const EmployeeListPage = () => {
  const { data: employees, isLoading, isError } = useEmployees();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // Extract unique departments for filter dropdown (trimmed and sorted)
  const departments = useMemo(() => {
    if (!employees) return [];
    const depts = new Set<string>();
    employees.forEach(e => {
      const d = (e.departmentName || e.department?.name || '').trim();
      if (d) depts.add(d);
    });
    return Array.from(depts).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  // Extract available statuses dynamically with standard fallback
  const availableStatuses = useMemo(() => {
    const standard = ['ACTIVE', 'INACTIVE', 'TERMINATED'];
    if (!employees) return standard;
    const set = new Set(standard);
    employees.forEach(e => {
      if (e.status) set.add(e.status.trim().toUpperCase());
    });
    return Array.from(set);
  }, [employees]);

  // Robust multi-case filtered employees
  const filtered = useMemo(() => {
    return filterEmployees(employees, { search, deptFilter, statusFilter });
  }, [employees, search, deptFilter, statusFilter]);

  // Aggregate stats
  const totalCount = employees?.length || 0;
  const deptCount = departments.length;
  const contractCount = employees?.filter(e => (e._count?.contracts || 0) > 0 || (e.contracts && e.contracts.length > 0)).length || totalCount;
  const onLeaveCount = employees?.filter(e => e.status?.toLowerCase() === 'on leave').length || 0;

  const hasActiveFilters = Boolean(
    search.trim() !== '' || 
    (deptFilter && deptFilter.trim().toUpperCase() !== 'ALL') || 
    (statusFilter && statusFilter.trim().toUpperCase() !== 'ALL')
  );

  const clearFilters = () => {
    setSearch('');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="emp-page">
      <PageHeader 
        title="Workforce Directory" 
        subtitle="Manage employee profiles, departmental allocations, and contract assignments"
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>New Employee</span>
          </Button>
        }
      />

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div 
          onClick={clearFilters}
          role="button"
          tabIndex={0}
          title="Click to reset filters and view all employees"
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Total Headcount</span>
            <span className="text-xl font-heading font-bold text-text-primary">{totalCount}</span>
          </div>
        </div>

        <div 
          onClick={() => {
            const el = document.getElementById('dept-filter-select');
            el?.focus();
          }}
          role="button"
          tabIndex={0}
          title="Click to select department filter"
          className="bg-surface border border-border hover:border-indigo-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Departments</span>
            <span className="text-xl font-heading font-bold text-text-primary">{deptCount}</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/contracts')}
          role="button"
          tabIndex={0}
          title="Click to view all employment contracts"
          className="bg-surface border border-border hover:border-emerald-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Active Contracts</span>
            <span className="text-xl font-heading font-bold text-emerald-500">{contractCount}</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/time-off')}
          role="button"
          tabIndex={0}
          title="Click to view time off and leave requests"
          className="bg-surface border border-border hover:border-amber-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">On Leave</span>
            <span className="text-xl font-heading font-bold text-amber-500">{onLeaveCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-3 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="w-full sm:w-72">
            <SearchInput 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, email, code..."
            />
          </div>

          {/* Department Filter Dropdown */}
          <select 
            id="dept-filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-xs font-medium outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter Dropdown */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-xs font-medium outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {availableStatuses.map(st => {
              const label = 
                st === 'ACTIVE' ? 'Active' :
                st === 'INACTIVE' ? 'Inactive' :
                st === 'TERMINATED' ? 'Terminated' :
                st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
              return (
                <option key={st} value={st}>{label}</option>
              );
            })}
          </select>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary bg-elevated px-2.5 py-1 rounded-md border border-border font-medium">
                Showing {filtered?.length} of {totalCount}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-error px-2 py-1 transition-colors cursor-pointer"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Modern High-Contrast Segmented View Toggle */}
        <div className="flex bg-elevated border border-border rounded-lg p-1">
          <button 
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              view === 'kanban' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setView('kanban')}
          >
            <LayoutGrid size={14} />
            <span>Kanban</span>
          </button>
          <button 
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              view === 'list' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setView('list')}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-16 text-center text-text-muted text-sm font-medium">
          Loading workforce directory...
        </div>
      )}
      
      {isError && (
        <div className="p-16 text-center text-error text-sm font-medium">
          Failed to load workforce directory. Please try again.
        </div>
      )}

      {filtered && filtered.length > 0 ? (
        view === 'kanban' ? (
          <div className="emp-grid">
            {filtered.map(emp => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Work Email</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Related Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} size="sm" />
                        <div>
                          <div className="font-semibold text-text-primary text-sm">{emp.name}</div>
                          {emp.employeeCode && (
                            <span className="text-[10px] font-mono text-text-muted">{emp.employeeCode}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary text-sm">{emp.email}</td>
                    <td className="text-text-primary text-sm font-medium">{emp.jobPosition}</td>
                    <td>
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-elevated border border-border text-text-secondary">
                        {emp.departmentName || emp.department?.name || 'General'}
                      </span>
                    </td>
                    <td className="text-text-muted text-xs">{emp.workLocation || 'Main Office'}</td>
                    <td>
                      <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/attendance?employeeId=${emp.id}`)}
                          className="flex items-center gap-1 text-text-secondary hover:text-primary px-1.5 py-0.5 rounded border border-border bg-surface"
                          title="Attendance Records"
                        >
                          <Clock size={11} className="text-primary" />
                          <span>{emp._count?.attendances ?? 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/time-off?employeeId=${emp.id}`)}
                          className="flex items-center gap-1 text-text-secondary hover:text-primary px-1.5 py-0.5 rounded border border-border bg-surface"
                          title="Time Off Requests"
                        >
                          <Calendar size={11} className="text-amber-500" />
                          <span>{emp._count?.timeOffRequests ?? 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/contracts?employeeId=${emp.id}`)}
                          className="flex items-center gap-1 text-text-secondary hover:text-primary px-1.5 py-0.5 rounded border border-border bg-surface"
                          title="Contracts"
                        >
                          <FileText size={11} className="text-indigo-500" />
                          <span>{emp._count?.contracts ?? 0}</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        !isLoading && (
          <div className="p-16 text-center text-text-muted text-sm bg-surface border border-border rounded-xl shadow-xs flex flex-col items-center gap-3">
            <p className="font-medium text-text-secondary">No employees matching current filters found.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors cursor-pointer border border-primary/20"
              >
                <X size={13} />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        )
      )}

      {/* Provision New Employee Modal */}
      <EmployeeModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};
