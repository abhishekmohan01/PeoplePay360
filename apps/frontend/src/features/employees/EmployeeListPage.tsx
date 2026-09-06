import { useState, useMemo, useEffect } from 'react';
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
import { useAuthStore } from '../../stores/auth.store';
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
  FileText,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin
} from 'lucide-react';
import './EmployeeListPage.css';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { data: employees, isLoading, isError } = useEmployees();
  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Pagination state (Default 25 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, statusFilter]);

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

  // Slice employees for active page
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filtered.length);

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
          canManageHR ? (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>New Employee</span>
            </Button>
          ) : undefined
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

      {/* Search & Filter Toolbar - Sticky Pinning Below Floating TopNav (84px offset) */}
      <div className="emp-toolbar-sticky bg-surface/95 backdrop-blur-md border border-border rounded-xl p-3 mb-5 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-all">
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
        
        <div className="flex items-center gap-2.5">
          {/* Pagination Options Toolbar Span */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary whitespace-nowrap font-medium hidden sm:inline">
                <strong className="text-text-primary font-semibold">{startItem}–{endItem}</strong> of {filtered.length}
              </span>

              {/* Items Per Page Selector */}
              <select
                id="toolbar-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-border bg-surface text-text-primary px-2 py-1.5 rounded-lg text-xs font-medium outline-none focus:border-primary cursor-pointer transition-colors"
                title="Employees per page"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              {/* Quick Prev / Next Chevrons */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Next page"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Subtle divider */}
              <div className="h-5 w-px bg-border mx-0.5" />
            </div>
          )}

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
        <>
          {view === 'kanban' ? (
            <div className="emp-kanban-scroll-container">
              <div className="emp-grid">
                {paginatedEmployees.map(emp => (
                  <EmployeeCard key={emp.id} employee={emp} />
                ))}
              </div>
            </div>
          ) : (
            <div className="emp-list-scroll-container">
              {paginatedEmployees.map((emp) => (
                <div 
                  key={emp.id} 
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="bg-surface hover:bg-elevated border border-border hover:border-primary/40 rounded-xl p-3.5 shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group select-none"
                >
                  {/* Left: Avatar, Name, Code, Role, Dept */}
                  <div className="flex items-center gap-3.5 min-w-[260px]">
                    <div className="relative flex-shrink-0">
                      <Avatar name={emp.name} size="md" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface)] ${
                        (emp.status || '').toUpperCase() === 'ACTIVE' 
                          ? 'bg-emerald-500' 
                          : (emp.status || '').toUpperCase() === 'TERMINATED'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm group-hover:text-primary transition-colors truncate">
                          {emp.name}
                        </span>
                        {emp.employeeCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated border border-border text-text-muted">
                            {emp.employeeCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-secondary font-medium truncate">
                          {emp.jobPosition || 'Employee'}
                        </span>
                        <span className="text-text-muted text-[10px]">•</span>
                        <span className="text-[11px] font-medium text-text-muted bg-elevated px-2 py-0.5 rounded-md border border-border/60 truncate">
                          {emp.departmentName || emp.department?.name || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Work Email & Location */}
                  <div className="hidden lg:flex items-center gap-4 text-xs text-text-secondary min-w-[220px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-text-muted flex-shrink-0" />
                      <span className="truncate">{emp.email || '—'}</span>
                    </div>
                    {emp.workLocation && (
                      <div className="flex items-center gap-1.5 text-text-muted truncate">
                        <MapPin size={13} className="flex-shrink-0" />
                        <span className="truncate">{emp.workLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Quick Action Badges, Status, and Action Chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0 justify-between sm:justify-end">
                    {/* Quick Metric Badges */}
                    <div className="flex items-center gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/attendance?employeeId=${emp.id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-surface hover:bg-elevated hover:border-primary/30 text-text-secondary hover:text-primary transition-colors"
                        title="Attendance Records"
                      >
                        <Clock size={12} className="text-primary" />
                        <span className="font-medium">{emp._count?.attendances ?? 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/time-off?employeeId=${emp.id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-surface hover:bg-elevated hover:border-amber-500/30 text-text-secondary hover:text-amber-500 transition-colors"
                        title="Time Off Requests"
                      >
                        <Calendar size={12} className="text-amber-500" />
                        <span className="font-medium">{emp._count?.timeOffRequests ?? 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/contracts?employeeId=${emp.id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-surface hover:bg-elevated hover:border-emerald-500/30 text-text-secondary hover:text-emerald-500 transition-colors"
                        title="Active Contracts"
                      >
                        <FileText size={12} className="text-emerald-500" />
                        <span className="font-medium">{emp._count?.contracts ?? 0}</span>
                      </button>
                    </div>

                    {/* Status Badge */}
                    <StatusBadge status={emp.status} />

                    {/* Navigate Chevron */}
                    <div className="w-8 h-8 rounded-lg bg-elevated border border-border text-text-muted group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/10 flex items-center justify-center transition-all flex-shrink-0 group-hover:translate-x-0.5">
                      <ChevronRight size={15} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
