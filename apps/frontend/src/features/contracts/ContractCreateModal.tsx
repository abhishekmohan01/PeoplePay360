import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { EmployeeSearchSelect } from '../../components/ui/EmployeeSearchSelect';
import { useCreateContract } from './useContracts';
import { useSalaryStructures } from '../payroll-config/usePayrollConfig';
import { useSchedules } from '../schedules/useSchedules';
import { X, FileText, AlertCircle, Info, Clock } from 'lucide-react';
import type { Employee } from '../../api/employees';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export const ContractCreateModal: React.FC<ContractCreateModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
}) => {
  const { data: salaryStructures } = useSalaryStructures();
  const { data: schedules } = useSchedules();
  const createMutation = useCreateContract();

  const [employeeId, setEmployeeId] = useState('');
  const [contractType, setContractType] = useState('Full-Time');
  const [jobPosition, setJobPosition] = useState('');
  const [wage, setWage] = useState('85000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [workingScheduleId, setWorkingScheduleId] = useState('');
  const [status, setStatus] = useState('RUNNING');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(defaultEmployeeId || '');
      // jobPosition auto-filled via handleEmployeeChange when user picks an employee
      if (salaryStructures && salaryStructures.length > 0) {
        setSalaryStructureId(salaryStructures[0]?.id ?? '');
        setWage(String(salaryStructures[0]?.baseSalary ?? 85000));
      }
      if (schedules && schedules.length > 0) {
        setWorkingScheduleId(schedules[0]?.id ?? '');
      }
      const today = new Date().toISOString().split('T')[0] ?? '';
      setStartDate(today);
      setEndDate('');
      setContractType('Full-Time');
      setStatus('RUNNING');
      setFormError(null);
    }
  }, [isOpen, defaultEmployeeId, salaryStructures, schedules]);

  const handleEmployeeChange = (id: string, emp: Employee | null) => {
    setEmployeeId(id);
    if (emp?.jobPosition) {
      setJobPosition(emp.jobPosition);
    }
  };

  const handleStructureChange = (id: string) => {
    setSalaryStructureId(id);
    const struct = salaryStructures?.find((s) => s.id === id);
    if (struct && struct.baseSalary) {
      setWage(String(struct.baseSalary));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    const wageAmount = parseFloat(wage);
    if (isNaN(wageAmount) || wageAmount <= 0) {
      setFormError('Please provide a valid baseline wage.');
      return;
    }
    if (!startDate) {
      setFormError('Contract start date is required.');
      return;
    }

    createMutation.mutate(
      {
        employeeId,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        wage: wageAmount,
        jobPosition: jobPosition.trim() || 'Staff',
        contractType,
        workingScheduleId: workingScheduleId || undefined,
        salaryStructureId: salaryStructureId || undefined,
        status,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to create contract. Ensure employee has no active running contract.');
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
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                New Employment Contract
              </h3>
              <p className="text-xs text-text-muted m-0">
                Formalize employment terms, compensation rate, and duration
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

            {/* Employee Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Employee Profile *
              </label>
              <EmployeeSearchSelect
                id="contract-employee"
                value={employeeId}
                onChange={handleEmployeeChange}
                required
              />
            </div>

            {/* Contract Type & Job Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Contract Classification *
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Full-Time">Full-Time (Open Ended)</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Fixed-Term Contract</option>
                  <option value="Internship">Internship Agreement</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Job Position *
                </label>
                <input
                  type="text"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Working Schedule & Salary Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Clock size={12} className="text-primary" />
                  Working Schedule *
                </label>
                <select
                  value={workingScheduleId}
                  onChange={(e) => setWorkingScheduleId(e.target.value)}
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer"
                  required
                >
                  {schedules?.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.hoursPerWeek}h/wk)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Salary Structure Template
                </label>
                <select
                  value={salaryStructureId}
                  onChange={(e) => handleStructureChange(e.target.value)}
                  className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Default Company Structure</option>
                  {salaryStructures?.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (Base: ₹{st.baseSalary?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Base Wage */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Monthly Base Wage (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary"
                required
              />
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Start Date *
                </label>
                <DatePicker
                  id="contract-start-date"
                  value={startDate}
                  onChange={setStartDate}
                  maxDate={endDate || undefined}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  End Date (Optional)
                </label>
                <DatePicker
                  id="contract-end-date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || undefined}
                  placeholder="Open-ended (no end)"
                />
              </div>
            </div>

            {/* Initial Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Contract Status
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('RUNNING')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'RUNNING'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-border bg-surface text-text-muted hover:bg-elevated'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Running (Active)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'DRAFT'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-border bg-surface text-text-muted hover:bg-elevated'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Draft</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-elevated/50 border border-border rounded-xl flex items-start gap-2 text-[11px] text-text-muted leading-relaxed">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                Contract numbers are generated automatically (e.g. CON/2026/0001). Each employee may have only one active RUNNING contract at a time.
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
              isLoading={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating Contract...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
