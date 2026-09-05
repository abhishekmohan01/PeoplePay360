import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { useCreatePayrun } from './usePayruns';
import { useSalaryStructures } from '../payroll-config/usePayrollConfig';
import { X, Calendar, AlertCircle, Layers, Info } from 'lucide-react';

interface PayrunCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayrunCreateModal: React.FC<PayrunCreateModalProps> = ({ isOpen, onClose }) => {
  const { data: structures } = useSalaryStructures();
  const createMutation = useCreatePayrun();

  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      // First and last day of current month
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(yyyy, now.getMonth() + 1, 0).getDate();

      setName(`${currentMonth} ${currentYear} Regular Payroll`);
      setPeriodStart(`${yyyy}-${mm}-01`);
      setPeriodEnd(`${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`);

      if (structures && structures.length > 0) {
        setSalaryStructureId(structures[0]?.id ?? '');
      }
      setFormError(null);
    }
  }, [isOpen, structures]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a payrun batch name.');
      return;
    }
    if (!periodStart || !periodEnd) {
      setFormError('Please specify start and end dates.');
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setFormError('Period start date cannot be after end date.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        periodStart,
        periodEnd,
        salaryStructureId: salaryStructureId || (structures && structures[0]?.id) || '',
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create payrun cycle.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                New Payrun Cycle
              </h2>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Initialize compensation batch for automated calculation
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Payrun Name */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Payrun Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. September 2026 Regular Payroll"
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Date Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Period Start Date *
              </label>
              <DatePicker
                id="payrun-period-start"
                value={periodStart}
                onChange={setPeriodStart}
                maxDate={periodEnd || undefined}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Period End Date *
              </label>
              <DatePicker
                id="payrun-period-end"
                value={periodEnd}
                onChange={setPeriodEnd}
                minDate={periodStart || undefined}
                required
              />
            </div>
          </div>

          {/* Salary Structure Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-primary" /> Governing Salary Structure
            </label>
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            >
              {structures?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Base: ₹{s.baseSalary.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Informational Card */}
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <span className="text-xs text-text-secondary">
              Upon initialization, the system will populate active contracts matching this cycle. You can then review and compute payslips on the next screen.
            </span>
          </div>

          {/* Footer Actions */}
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
            >
              {createMutation.isPending ? 'Initializing...' : 'Create Payrun'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
