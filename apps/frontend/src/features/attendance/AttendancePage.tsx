import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAttendance } from './useAttendance';
import { AttendanceManualEntryModal } from './AttendanceManualEntryModal';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, X, Clock, Home, Users } from 'lucide-react';

export const AttendancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;

  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const { data: records, isLoading, isError } = useAttendance(
    employeeIdParam ? { employeeId: employeeIdParam } : undefined
  );
  const [search, setSearch] = useState('');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'COMPLETED'>('ALL');

  // Pagination state (25 per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, employeeIdParam]);

  const totalLogs = records?.length || 0;
  const checkedInCount = records?.filter(r => !r.checkOut || (r.status || '').toLowerCase().includes('in')).length || 0;
  const totalHours = records?.reduce((sum, r) => sum + (Number(r.workedHours) || 0), 0) || 0;

  const filtered = useMemo(() => {
    return records?.filter((record) => {
      const matchesSearch = 
        (record.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
        (record.status || '').toLowerCase().includes(search.toLowerCase());

      if (statusFilter === 'PRESENT') return matchesSearch && (!record.checkOut || (record.status || '').toLowerCase().includes('in'));
      if (statusFilter === 'COMPLETED') return matchesSearch && Boolean(record.checkOut);
      return matchesSearch;
    }) || [];
  }, [records, search, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
      <PageHeader 
        title={isEmployeeOnly ? "My Attendance Records" : "Workforce Attendance"} 
        subtitle={isEmployeeOnly ? "Review your real-time check-in and punch logs" : "List view of organization punch-in records and hours worked"}
        actions={
          canManageHR ? (
            <Button variant="primary" onClick={() => setIsManualEntryOpen(true)}>
              <Plus size={16} />
              <span>Manual Entry</span>
            </Button>
          ) : undefined
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div 
          onClick={() => { setStatusFilter('ALL'); setSearch(''); setSearchParams({}); }}
          role="button"
          tabIndex={0}
          title="Click to view all attendance records"
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Total Logs</span>
            <span className="text-xl font-heading font-bold text-text-primary">{totalLogs}</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'PRESENT' ? 'ALL' : 'PRESENT')}
          role="button"
          tabIndex={0}
          title="Click to filter by Checked In records"
          className={`bg-surface border rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group ${
            statusFilter === 'PRESENT' ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-border hover:border-emerald-500/40'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              {statusFilter === 'PRESENT' ? 'Checked In (Filtered)' : 'Checked In'}
            </span>
            <span className="text-xl font-heading font-bold text-emerald-500">{checkedInCount}</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/payroll/dashboard')}
          role="button"
          tabIndex={0}
          title="Click to view attendance health in Analytics"
          className="bg-surface border border-border hover:border-indigo-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Logged Hours</span>
            <span className="text-xl font-heading font-bold text-text-primary">
              {totalHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {!isEmployeeOnly ? (
          <div 
            onClick={() => navigate('/employees')}
            role="button"
            tabIndex={0}
            title="Click to view workforce directory"
            className="bg-surface border border-border hover:border-primary/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Workforce Directory</span>
              <span className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5">
                View directory &rarr;
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="bg-surface border border-border rounded-xl p-3.5 shadow-xs flex items-center gap-3 select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Attendance Health</span>
              <span className="text-xs font-bold text-emerald-500 mt-1 block">
                100% Verified
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendance records..."
          />
        </div>
        
        <div className="flex items-center gap-2">
          {employeeIdParam && (
            <button 
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer"
            >
              <span>Filtered by Employee</span>
              <X size={14} />
            </button>
          )}
          <button 
            onClick={() => { setSearch(''); setSearchParams({}); }}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary text-xs font-medium transition-colors cursor-pointer"
          >
            All Logs
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-text-muted text-sm font-medium">
          Loading attendance records...
        </div>
      )}

      {isError && (
        <div className="p-12 text-center text-error text-sm font-medium">
          Failed to load attendance logs.
        </div>
      )}

      {filtered && filtered.length > 0 ? (
        <>
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Status & Flags</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map(record => (
                  <tr 
                    key={record.id} 
                    onClick={() => navigate(`/attendance/${record.id}`)}
                    className="cursor-pointer"
                  >
                    <td className="font-medium text-text-primary">{record.employeeName}</td>
                    <td className="text-text-secondary text-sm">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-text-muted" />
                        {record.checkIn}
                      </span>
                    </td>
                    <td className="text-text-muted text-sm">
                      {record.checkOut ? (
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <Clock size={13} className="text-text-muted" />
                          {record.checkOut}
                        </span>
                      ) : '— Active Punch'}
                    </td>
                    <td className="font-semibold text-text-primary text-sm tabular-nums">
                      {record.duration !== null ? `${record.duration}h` : '0.00h'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={record.status} />
                        {record.notes?.includes('WFH') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            <Home size={11} /> WFH Review
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="attendance logs"
          />
        </>
      ) : (
        !isLoading && (
          <div className="p-12 text-center text-text-muted text-sm bg-surface border border-border rounded-xl">
            No attendance records found.
          </div>
        )
      )}

      <AttendanceManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        defaultEmployeeId={employeeIdParam}
      />
    </div>
  );
};
