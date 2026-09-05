import { useParams } from 'react-router-dom';
import { useAttendanceRecord } from './useAttendance';

export const AttendanceDetail = () => {
  const { recordId } = useParams();
  const { data: record, isLoading, isError } = useAttendanceRecord(recordId!);

  if (isLoading) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading record...</div>;
  if (isError || !record) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Failed to load record</div>;

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full p-4 mt-4">
      
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-[Caveat] font-bold m-0 text-text-primary tracking-wide">
          Attendance / {record.employeeName} / {record.date}
        </h1>
        <p className="text-muted m-0 mt-2 font-[Caveat] text-xl">Form view of one attendance record</p>
      </div>

      <div className="mb-10">
        <button className="px-6 py-2 border-2 border-border/80 rounded-xl font-[Caveat] font-bold tracking-widest text-text-primary bg-surface hover:bg-elevated transition-colors uppercase">
          Edit
        </button>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl font-[Caveat] text-xl">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center">
            <label className="w-40 text-muted">Employee</label>
            <input type="text" readOnly value={record.employeeName} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Check In</label>
            <input type="text" readOnly value={`${record.date} ${record.checkIn}`} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Check Out</label>
            <input type="text" readOnly value={record.checkOut ? `${record.date} ${record.checkOut}` : '—'} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Worked Hours</label>
            <input type="text" readOnly value={record.duration !== null ? record.duration : '—'} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center">
            <label className="w-40 text-muted">Department</label>
            <input type="text" readOnly value="Finance" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Manager</label>
            <input type="text" readOnly value="Sara Khan" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Status</label>
            <input type="text" readOnly value={record.status} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Overtime</label>
            <input type="text" readOnly value="0.50 hrs" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

      </div>

    </div>
  );
};
