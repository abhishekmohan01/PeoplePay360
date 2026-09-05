import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useUpdateAttendanceRecord } from './useAttendance';
import type { AttendanceRecord } from '../../api/attendance';
import { X, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface AttendanceEditModalProps {
  record: AttendanceRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const updateMutation = useUpdateAttendanceRecord();

  const [status, setStatus] = useState(record.status?.toUpperCase() || 'PRESENT');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [workedHours, setWorkedHours] = useState(String(record.workedHours || record.duration || 0));
  const [overtime, setOvertime] = useState(String(record.overtime || 0));
  const [notes, setNotes] = useState(record.notes || '');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      setStatus(record.status?.toUpperCase() || 'PRESENT');
      // If checkIn has ISO date
      try {
        if (record.date) {
          setCheckIn(record.date);
        }
      } catch {
        setCheckIn('');
      }
      setWorkedHours(String(record.workedHours || record.duration || 0));
      setOvertime(String(record.overtime || 0));
      setNotes(record.notes || '');
      setFormError(null);
    }
  }, [isOpen, record]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hours = parseFloat(workedHours);
    if (isNaN(hours) || hours < 0) {
      setFormError('Please enter a valid number of worked hours.');
      return;
    }

    const ot = parseFloat(overtime) || 0;

    updateMutation.mutate(
      {
        id: record.id,
        data: {
          status,
          workedHours: hours,
          overtime: ot,
          notes: notes.trim() || 'Manually updated by Administrator',
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to update attendance punch.');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div 
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border animate-in zoom-in-95 flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                Edit Punch Entry
              </h3>
              <p className="text-xs text-text-muted m-0">
                {record.employeeName} • {record.date || 'Punch Record'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500 font-medium">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Attendance Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Attendance Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EARLY_CHECKOUT">Early Checkout</option>
                <option value="CORRECTED">Corrected</option>
              </select>
            </div>

            {/* Worked Hours & Overtime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Worked Duration (Hours) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="24"
                  value={workedHours}
                  onChange={(e) => setWorkedHours(e.target.value)}
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Overtime (Hours)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="16"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Audit Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Correction Audit Note
              </label>
              <textarea
                rows={3}
                placeholder="Reason for manual time/status adjustment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border bg-surface flex-shrink-0 z-10 shadow-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving Punch...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
