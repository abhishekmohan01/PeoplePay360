import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { EmployeeSearchSelect } from '../../components/ui/EmployeeSearchSelect';
import { useCreateAttendanceRecord } from './useAttendance';
import { X, Clock, AlertCircle, User, FileText } from 'lucide-react';

interface AttendanceManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export const AttendanceManualEntryModal: React.FC<AttendanceManualEntryModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
}) => {
  const createMutation = useCreateAttendanceRecord();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [hasCheckOut, setHasCheckOut] = useState(true);
  const [status, setStatus] = useState('PRESENT');
  const [workedHours, setWorkedHours] = useState('8');
  const [overtime, setOvertime] = useState('0');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialEmpId = defaultEmployeeId || '';
      setEmployeeId(initialEmpId);
      const today = new Date().toISOString().split('T')[0] ?? '';
      setDate(today);
      setCheckInTime('09:00');
      setCheckOutTime('18:00');
      setHasCheckOut(true);
      setStatus('PRESENT');
      setWorkedHours('8');
      setOvertime('0');
      setNotes('Manual entry by HR');
      setFormError(null);
    }
  }, [isOpen, defaultEmployeeId]);

  // Auto calculate worked hours when check-in or check-out changes
  useEffect(() => {
    if (hasCheckOut && checkInTime && checkOutTime) {
      try {
        const parts = checkInTime.split(':').map(Number);
        const outParts = checkOutTime.split(':').map(Number);
        const inH = parts[0] ?? 0, inM = parts[1] ?? 0;
        const outH = outParts[0] ?? 0, outM = outParts[1] ?? 0;
        const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM) - 60; // 1 hr default lunch break
        if (diffMinutes > 0) {
          const hours = Math.round((diffMinutes / 60) * 10) / 10;
          setWorkedHours(String(hours));
          if (hours > 8) {
            setOvertime(String(Math.round((hours - 8) * 10) / 10));
          } else {
            setOvertime('0');
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, [checkInTime, checkOutTime, hasCheckOut]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!date) {
      setFormError('Please select a date.');
      return;
    }
    if (!checkInTime) {
      setFormError('Please provide a check-in time.');
      return;
    }

    try {
      const inIso = `${date}T${checkInTime}:00Z`;
      const outIso = hasCheckOut && checkOutTime ? `${date}T${checkOutTime}:00Z` : null;

      await createMutation.mutateAsync({
        employeeId,
        checkIn: inIso,
        checkOut: outIso,
        workedHours: Number(workedHours) || 0,
        overtime: Number(overtime) || 0,
        status,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create manual attendance entry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                Manual Attendance Entry
              </h2>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Record attendance punch and work hours for an employee
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-primary" /> Employee *
            </label>
            <EmployeeSearchSelect
              id="attendance-employee"
              value={employeeId}
              onChange={(id) => setEmployeeId(id)}
              required
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Date *
            </label>
            <DatePicker
              id="attendance-date"
              value={date}
              onChange={setDate}
              required
            />
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Check-In Time *
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Check-Out Time
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCheckOut}
                    onChange={(e) => setHasCheckOut(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0"
                  />
                  <span>Recorded</span>
                </label>
              </div>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                disabled={!hasCheckOut}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Worked Hours & Overtime */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={workedHours}
                onChange={(e) => setWorkedHours(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Overtime (Hours)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="12"
                value={overtime}
                onChange={(e) => setOvertime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Punch Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="EARLY_CHECKOUT">Early Checkout</option>
                <option value="ABSENT">Absent</option>
                <option value="CORRECTED">Corrected</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-text-muted" /> Audit Notes / Reason
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Employee attended off-site client deployment..."
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              {createMutation.isPending ? 'Recording...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
