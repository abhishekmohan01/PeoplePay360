import { useParams, useNavigate } from 'react-router-dom';
import { useAttendanceRecord } from './useAttendance';
import { useAuthStore } from '../../stores/auth.store';

export const AttendanceDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { data: record, isLoading, isError } = useAttendanceRecord(recordId!);
  const canManageHR = useAuthStore((state) => state.canManageHR)();

  if (isLoading) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading record...</div>;
  if (isError || !record) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Failed to load record</div>;

  const isWfh = record.notes?.includes('WFH');

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full p-4 mt-4">
      
      {/* Top Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/attendance')}
            className="font-[Caveat] text-lg text-accent hover:underline mb-2 block cursor-pointer"
          >
            ← Back to Attendance List
          </button>
          <h1 className="text-4xl font-[Caveat] font-bold m-0 text-text-primary tracking-wide">
            Attendance / {record.employeeName} / {record.date}
          </h1>
          <p className="text-muted m-0 mt-2 font-[Caveat] text-xl">Form view of one attendance record</p>
        </div>

        {/* Action Button: Only HR Managers & Admins can edit attendance records */}
        {canManageHR ? (
          <button className="px-6 py-2 border-2 border-border/80 rounded-xl font-[Caveat] font-bold tracking-widest text-text-primary bg-surface hover:bg-elevated transition-colors uppercase cursor-pointer">
            Edit
          </button>
        ) : (
          <span className="px-4 py-1.5 border border-border/80 rounded-xl font-[Caveat] text-muted text-lg bg-surface/50">
            Read-Only (Self-Service)
          </span>
        )}
      </div>

      {/* WFH Review Alert Banner */}
      {isWfh && (
        <div className="mb-8 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h4 className="font-[Caveat] font-bold text-2xl text-amber-400 m-0">Remote Work (WFH) Attendance</h4>
              <p className="font-sans text-xs text-text-secondary m-0 mt-0.5">
                This record was punched remotely and submitted for manager/HR verification.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-sans text-xs font-semibold uppercase">
            Review Pending
          </span>
        </div>
      )}

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
            <input type="text" readOnly value={record.checkInTime ? `${record.date} ${record.checkInTime}` : (record.checkIn || '—')} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Check Out</label>
            <input type="text" readOnly value={record.checkOutTime ? `${record.date} ${record.checkOutTime}` : (record.checkOut || '—')} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Worked Hours</label>
            <input type="text" readOnly value={record.workedHours !== undefined ? `${record.workedHours} hrs` : (record.duration !== null ? `${record.duration} hrs` : '—')} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center">
            <label className="w-40 text-muted">Department</label>
            <input type="text" readOnly value={record.departmentName || 'General'} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Manager</label>
            <input type="text" readOnly value={record.managerName || 'None'} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Status</label>
            <input type="text" readOnly value={record.status} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Overtime</label>
            <input type="text" readOnly value={`${record.overtime ?? 0} hrs`} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

      </div>

      {/* Notes / Audit Box */}
      <div className="mt-10 border border-border/80 rounded-2xl p-5 bg-surface/40 max-w-4xl">
        <label className="text-muted font-[Caveat] text-xl block mb-2 font-bold">Notes & Audit Trail</label>
        <p className="font-sans text-sm text-text-secondary m-0">
          {record.notes || 'System-generated from check in/out or manually corrected by an authorized user.'}
        </p>
      </div>

    </div>
  );
};
