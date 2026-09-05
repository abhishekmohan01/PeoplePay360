import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAttendance } from './useAttendance';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AttendancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;

  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const { data: records, isLoading } = useAttendance(
    employeeIdParam ? { employeeId: employeeIdParam } : undefined
  );
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = records?.filter((record) =>
    (record.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (record.status || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader 
        title={isEmployeeOnly ? "My Attendance" : "Attendance"} 
        subtitle={isEmployeeOnly ? "Review your real-time attendance and punch logs" : "List view of employee attendance records"}
      />

      <div className="flex items-center gap-4 mb-6">
        {/* Only HR Managers and Admins can create manual records */}
        {canManageHR && (
          <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold !font-handwritten text-xl transition-colors uppercase tracking-widest cursor-pointer">
            New
          </button>
        )}
        
        <div className="w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendance..."
          />
        </div>
        
        <div className="flex gap-2 ml-auto">
          {employeeIdParam && (
            <button 
              onClick={() => setSearchParams({})}
              className="px-4 py-1.5 border border-accent/60 bg-accent/15 text-accent rounded-lg font-[Caveat] font-bold text-lg hover:bg-accent/25 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Filtered by Employee</span>
              <span className="text-xs">✕ Clear</span>
            </button>
          )}
          <button 
            onClick={() => { setSearch(''); setSearchParams({}); }}
            className="px-6 py-2 border border-border bg-surface text-text-primary rounded-lg font-[Caveat] font-bold text-lg hover:bg-elevated transition-colors cursor-pointer"
          >
            All
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading attendance...</div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-elevated/30">
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[25%]">Employee</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">Check In</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">Check Out</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">Worked Hours</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-border/50 w-[20%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(record => (
                <tr 
                  key={record.id} 
                  onClick={() => navigate(`/attendance/${record.id}`)}
                  className="border-b border-border hover:bg-elevated/30 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{record.employeeName}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{record.checkIn}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{record.checkOut || '—'}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{record.duration !== null ? record.duration : '0.00'}</td>
                  <td className="p-4 font-[Caveat] text-lg">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} />
                      {record.notes?.includes('WFH') && (
                        <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          WFH Review
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
