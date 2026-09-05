import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { EmployeeSearchSelect } from '../../components/ui/EmployeeSearchSelect';
import { useTimeOffTypes, useCreateTimeOffAllocation } from './useTimeOff';
import { X, Layers, AlertCircle, Info } from 'lucide-react';

interface TimeOffAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export const TimeOffAllocationModal: React.FC<TimeOffAllocationModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
}) => {
  const { data: timeOffTypes } = useTimeOffTypes();
  const createMutation = useCreateTimeOffAllocation();

  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocated, setAllocated] = useState('14');
  const [validityStart, setValidityStart] = useState('');
  const [validityEnd, setValidityEnd] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(defaultEmployeeId || '');
      if (timeOffTypes && timeOffTypes.length > 0) {
        setTimeOffTypeId(timeOffTypes[0]?.id ?? '');
      }
      const today = new Date().toISOString().split('T')[0] ?? '';
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] ?? '';
      setValidityStart(today);
      setValidityEnd(nextYear);
      setAllocated('14');
      setDescription('Annual Leave Quota Allocation');
      setFormError(null);
    }
  }, [isOpen, defaultEmployeeId, timeOffTypes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Please select an employee profile.');
      return;
    }
    if (!timeOffTypeId) {
      setFormError('Please select a leave category.');
      return;
    }
    const days = parseFloat(allocated);
    if (isNaN(days) || days <= 0) {
      setFormError('Allocated amount must be greater than 0.');
      return;
    }
    if (!validityStart) {
      setFormError('Validity start date is required.');
      return;
    }

    createMutation.mutate(
      {
        employeeId,
        timeOffTypeId,
        allocated: days,
        validityStart: new Date(validityStart).toISOString(),
        validityEnd: validityEnd ? new Date(validityEnd).toISOString() : undefined,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to create leave allocation.');
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
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                Grant Leave Allocation
              </h3>
              <p className="text-xs text-text-muted m-0">
                Allocate annual leave quota or special day allowances
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

            {/* Employee Profile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Employee Profile *
              </label>
              <EmployeeSearchSelect
                id="allocation-employee"
                value={employeeId}
                onChange={(id) => setEmployeeId(id)}
                required
              />
            </div>

            {/* Time Off Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Leave Type *
              </label>
              <select
                value={timeOffTypeId}
                onChange={(e) => setTimeOffTypeId(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer transition-colors"
                required
              >
                {timeOffTypes?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Days Allocated */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Days Allocated *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={allocated}
                onChange={(e) => setAllocated(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                required
              />
            </div>

            {/* Validity Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Validity Start *
                </label>
                <DatePicker
                  id="timeoff-alloc-start"
                  value={validityStart}
                  onChange={setValidityStart}
                  maxDate={validityEnd || undefined}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Validity End
                </label>
                <DatePicker
                  id="timeoff-alloc-end"
                  value={validityEnd}
                  onChange={setValidityEnd}
                  minDate={validityStart || undefined}
                  placeholder="No expiry"
                />
              </div>
            </div>

            {/* Allocation Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Allocation Description
              </label>
              <input
                type="text"
                placeholder="e.g. Annual Vacation Allocation 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="p-3 bg-elevated/50 border border-border rounded-xl flex items-start gap-2 text-[11px] text-text-muted leading-relaxed">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                Allocations immediately credit the employee's available leave balance in Confirmed status.
              </span>
            </div>
          </div>

          {/* Sticky Footer */}
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
            >
              {createMutation.isPending ? 'Allocating...' : 'Confirm Allocation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
