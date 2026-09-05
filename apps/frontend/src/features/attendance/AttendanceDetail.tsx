import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendanceRecord } from './useAttendance';
import { useAuthStore } from '../../stores/auth.store';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { AttendanceEditModal } from './AttendanceEditModal';
import { ArrowLeft, Clock, Home, FileText, CheckCircle, Edit3 } from 'lucide-react';

export const AttendanceDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { data: record, isLoading, isError } = useAttendanceRecord(recordId!);
  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) return <div className="p-12 text-center text-text-muted text-sm font-medium">Loading attendance record...</div>;
  if (isError || !record) return <div className="p-12 text-center text-error text-sm font-medium">Failed to load record.</div>;

  const isWfh = record.notes?.includes('WFH');

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 pb-12">
      
      {/* Back button */}
      <div className="mb-3">
        <button
          onClick={() => navigate('/attendance')}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Attendance Logs</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary m-0">
              Punch Entry — {record.employeeName}
            </h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-xs text-text-secondary m-0 mt-1">
            Recorded on {record.date || 'Today'}
          </p>
        </div>

        {/* Action Button */}
        {canManageHR ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer hover:border-primary transition-colors shadow-xs"
          >
            <Edit3 size={14} />
            <span>Edit Punch</span>
          </Button>
        ) : (
          <span className="text-xs text-text-muted bg-elevated px-2.5 py-1 rounded-md">
            Read-Only (Self-Service)
          </span>
        )}
      </div>

      {/* WFH Review Alert Banner */}
      {isWfh && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Home size={18} />
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold text-amber-600 dark:text-amber-400 m-0">
                Remote Work (WFH) Punch
              </h4>
              <p className="text-xs text-text-secondary m-0 mt-0.5">
                This punch was initiated offsite and is queued for manager/HR attendance validation.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-full text-xs font-semibold uppercase">
            Review Pending
          </span>
        </div>
      )}

      {/* Form Fields Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Timing */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <Clock size={14} className="text-primary" /> Timing & Duration
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Employee</label>
            <div className="text-sm font-semibold text-text-primary">{record.employeeName}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Check In Time</label>
            <div className="text-sm font-semibold text-text-primary">
              {record.checkInTime ? `${record.date} ${record.checkInTime}` : (record.checkIn || '—')}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Check Out Time</label>
            <div className="text-sm font-semibold text-text-primary">
              {record.checkOutTime ? `${record.date} ${record.checkOutTime}` : (record.checkOut || '— Active / Not checked out')}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Worked Duration</label>
            <div className="text-sm font-semibold text-emerald-500 tabular-nums">
              {record.workedHours !== undefined ? `${record.workedHours} hrs` : (record.duration !== null ? `${record.duration} hrs` : '— Active')}
            </div>
          </div>
        </div>

        {/* Right Column: Organization */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <CheckCircle size={14} className="text-primary" /> Verification Details
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Department</label>
            <div className="text-sm font-semibold text-text-primary">{record.departmentName || 'General Dept'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Supervisor / Manager</label>
            <div className="text-sm font-semibold text-text-primary">{record.managerName || 'None Assigned'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Verification Status</label>
            <div>
              <StatusBadge status={record.status} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Overtime Logged</label>
            <div className="text-sm font-semibold text-text-primary tabular-nums">
              {record.overtime ?? 0} hrs
            </div>
          </div>
        </div>

      </div>

      {/* Notes / Audit Box */}
      <div className="mt-6 border border-border rounded-xl p-4 bg-surface shadow-xs">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-1.5 flex items-center gap-1.5">
          <FileText size={14} className="text-primary" /> Notes & System Audit Trail
        </label>
        <p className="text-xs text-text-secondary m-0">
          {record.notes || 'System-generated from punch widget or manually verified by an authorized HR user.'}
        </p>
      </div>

      {/* Edit Punch Modal */}
      <AttendanceEditModal
        record={record}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

    </div>
  );
};
