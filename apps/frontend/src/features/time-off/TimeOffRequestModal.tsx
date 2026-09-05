import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { EmployeeSearchSelect } from '../../components/ui/EmployeeSearchSelect';
import { useTimeOffTypes, useCreateTimeOffRequest, useTimeOffAllocations } from './useTimeOff';
import { useAuthStore } from '../../stores/auth.store';
import { X, CalendarRange, AlertCircle, Info, Umbrella, CheckCircle2 } from 'lucide-react';

interface TimeOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export const TimeOffRequestModal: React.FC<TimeOffRequestModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
}) => {
  const { data: timeOffTypes } = useTimeOffTypes();
  const user = useAuthStore((state) => state.user);
  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const createMutation = useCreateTimeOffRequest();

  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const targetEmpId = employeeId || user?.employeeId;
  const { data: allocations } = useTimeOffAllocations(
    targetEmpId ? { employeeId: targetEmpId } : undefined
  );
  const selectedType = timeOffTypes?.find((t) => t.id === timeOffTypeId);
  const currentAlloc = allocations?.find(
    (a) => (a.timeOffTypeId && a.timeOffTypeId === timeOffTypeId) || a.timeOffTypeName === selectedType?.name
  );

  useEffect(() => {
    if (isOpen) {
      const initialEmpId = defaultEmployeeId || user?.employeeId || '';
      setEmployeeId(initialEmpId);
      if (timeOffTypes && timeOffTypes.length > 0) {
        setTimeOffTypeId(timeOffTypes[0]?.id ?? '');
      }
      const today = new Date().toISOString().split('T')[0] ?? '';
      setStartDate(today);
      setEndDate(today);
      setDuration('1');
      setReason('');
      setFormError(null);
    }
  }, [isOpen, defaultEmployeeId, user, timeOffTypes]);

  // Automatically calculate days between start and end date
  useEffect(() => {
    if (startDate && endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      if (d2 >= d1) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDuration(String(diffDays));
      }
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Please select an employee profile.');
      return;
    }
    if (!timeOffTypeId) {
      setFormError('Please select a leave type.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Start date and end date are required.');
      return;
    }
    const days = parseFloat(duration);
    if (isNaN(days) || days <= 0) {
      setFormError('Duration must be at least 1 day.');
      return;
    }

    if (selectedType?.requiresAllocation) {
      if (!currentAlloc || currentAlloc.remaining < days) {
        setFormError(
          `Insufficient leave balance for ${selectedType.name}. Available: ${currentAlloc?.remaining ?? 0} days, Requested: ${days} days.`
        );
        return;
      }
    }

    createMutation.mutate(
      {
        employeeId,
        timeOffTypeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        duration: days,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to submit time-off request. Check leave balance.');
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
              <Umbrella size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                Request Time Off
              </h3>
              <p className="text-xs text-text-muted m-0">
                Submit a leave application for manager & HR review
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500 font-medium">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Employee Selection (if privileged) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Employee Profile *
              </label>
              {canManageHR ? (
                <EmployeeSearchSelect
                  id="request-employee"
                  value={employeeId}
                  onChange={(id) => setEmployeeId(id)}
                  required
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={user?.name || user?.email || 'Current Employee'}
                  className="border border-border bg-elevated/50 text-text-secondary p-2.5 rounded-lg text-sm outline-none cursor-not-allowed"
                />
              )}
            </div>

            {/* Time Off Type Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Leave Category *
              </label>
              <select
                value={timeOffTypeId}
                onChange={(e) => { setTimeOffTypeId(e.target.value); setFormError(null); }}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer transition-colors"
                required
              >
                {timeOffTypes?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.requiresAllocation ? '(Requires Allocation)' : '(No Quota Required)'}
                  </option>
                ))}
              </select>

              {/* Live Balance / Policy Indicator */}
              {selectedType && (
                <div className="mt-0.5">
                  {selectedType.requiresAllocation ? (
                    currentAlloc ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>
                          Available Balance: <strong>{currentAlloc.remaining} {currentAlloc.unit.toLowerCase()}</strong> remaining (of {currentAlloc.allocated} allocated)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>
                          No quota currently allocated for {selectedType.name} (0 days remaining). Please contact HR.
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                      <Info size={13} className="shrink-0 text-primary" />
                      <span>No pre-allocated quota required for this leave type (subject to manager approval).</span>
                    </div>
                  )}
                </div>
              )}

              {selectedType?.configurationNotes && (
                <span className="text-[11px] text-text-muted">
                  {selectedType.configurationNotes}
                </span>
              )}
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Start Date *
                </label>
                <DatePicker
                  id="timeoff-req-start"
                  value={startDate}
                  onChange={setStartDate}
                  maxDate={endDate || undefined}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  End Date *
                </label>
                <DatePicker
                  id="timeoff-req-end"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || undefined}
                  required
                />
              </div>
            </div>

            {/* Duration Display */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Calculated Duration (Days) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                required
              />
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Reason / Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Details or handoff notes for your time away..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="p-3 bg-elevated/50 border border-border rounded-xl flex items-start gap-2 text-[11px] text-text-muted leading-relaxed">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                Requests are submitted in Pending status for approval. If the leave type requires an allocation, sufficient balance must be available.
              </span>
            </div>
          </div>

          {/* Fixed Sticky Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border bg-surface flex-shrink-0 z-10 shadow-xs">
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
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
