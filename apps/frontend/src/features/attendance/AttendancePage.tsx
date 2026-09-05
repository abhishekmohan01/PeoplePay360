import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from './useAttendance';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AttendancePage = () => {
  const { data: records, isLoading } = useAttendance();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader 
        title="Attendance" 
        subtitle="List view of employee attendance records"
      />

      <div className="flex items-center gap-4 mb-6">
        <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold !font-handwritten text-xl transition-colors uppercase tracking-widest">
          New
        </button>
        <div className="w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendance..."
          />
        </div>
        
        <div className="flex gap-4 ml-4">
          <button className="px-6 py-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-lg !font-handwritten font-bold text-lg hover:bg-blue-100 transition-colors">
            Today
          </button>
          <button className="px-6 py-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-lg !font-handwritten font-bold text-lg hover:bg-blue-100 transition-colors">
            Employee: Aarav
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
              {records?.map(record => (
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
                    <StatusBadge status={record.status} />
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
