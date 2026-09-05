import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useCreateSalaryRule, useSalaryStructures } from './usePayrollConfig';
import { X, Calculator, AlertCircle, Layers } from 'lucide-react';

import type { PayrollRule } from '../../api/payroll-config';

interface SalaryRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStructureId?: string;
  defaultCategory?: 'ALLOWANCE' | 'DEDUCTION' | 'BASIC' | 'GROSS' | 'NET';
  onCreated?: (newRule: PayrollRule) => void;
}

export const SalaryRuleModal: React.FC<SalaryRuleModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultStructureId,
  defaultCategory = 'ALLOWANCE',
  onCreated
}) => {
  const { data: structures } = useSalaryStructures();
  const createMutation = useCreateSalaryRule();

  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'ALLOWANCE' | 'DEDUCTION' | 'BASIC' | 'GROSS' | 'NET'>(defaultCategory);
  const [computationType, setComputationType] = useState<'FIXED_AMOUNT' | 'PERCENTAGE_OF_WAGE' | 'PYTHON_CODE'>('FIXED_AMOUNT');
  const [computationValue, setComputationValue] = useState('2000');
  const [sequence, setSequence] = useState('25');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultStructureId) {
        setSalaryStructureId(defaultStructureId);
      } else if (structures && structures.length > 0 && structures[0]) {
        setSalaryStructureId(structures[0].id);
      }
      setName('');
      setCode('');
      setCategory(defaultCategory);
      setComputationType('FIXED_AMOUNT');
      setComputationValue(defaultCategory === 'DEDUCTION' ? '500' : '2000');
      setSequence(defaultCategory === 'DEDUCTION' ? '80' : '25');
      setFormError(null);
    }
  }, [isOpen, structures, defaultStructureId, defaultCategory]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === name.toUpperCase().replace(/[^A-Z0-9]/g, '_')) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
    }
  };

  const handleComputationTypeChange = (type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_WAGE' | 'PYTHON_CODE') => {
    setComputationType(type);
    if (type === 'FIXED_AMOUNT') {
      setComputationValue('2000');
    } else if (type === 'PERCENTAGE_OF_WAGE') {
      setComputationValue('15');
    } else {
      setComputationValue('return basic * 0.10;');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a rule name.');
      return;
    }
    if (!salaryStructureId) {
      setFormError('Please select a salary structure.');
      return;
    }
    if (!computationValue.trim()) {
      setFormError('Please provide a valid computation value or formula.');
      return;
    }
    if (computationType !== 'PYTHON_CODE' && isNaN(Number(computationValue))) {
      setFormError('Please provide a valid numeric value.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        salaryStructureId,
        name: name.trim(),
        code: code.trim() || name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        category,
        computationType,
        computationValue: String(computationValue).trim(),
        sequence: Number(sequence) || 25,
      });
      if (onCreated && created) {
        onCreated(created);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create salary rule.');
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
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                Add Allowance / Salary Rule
              </h2>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Define automated calculation formula or fixed stipend
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

          {/* Salary Structure Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-primary" /> Assign to Salary Structure *
            </label>
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              required
            >
              {structures?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Rule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Travel Allowance"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Rule Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. TRAVEL_ALLOW"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all font-mono uppercase text-xs"
              />
            </div>
          </div>

          {/* Category & Computation Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="ALLOWANCE">Allowance (+ Adds to Gross)</option>
                <option value="DEDUCTION">Deduction (- Subtracts from Net)</option>
                <option value="BASIC">Basic Component</option>
                <option value="GROSS">Gross Target</option>
                <option value="NET">Net Salary Target</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Calculation Type
              </label>
              <select
                value={computationType}
                onChange={(e) => handleComputationTypeChange(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="FIXED_AMOUNT">Fixed Amount (₹ / month)</option>
                <option value="PERCENTAGE_OF_WAGE">Percentage of Base Wage (%)</option>
                <option value="PYTHON_CODE">Dynamic Formula (JS / Python Code)</option>
              </select>
            </div>
          </div>

          {/* Value or Formula & Sequence */}
          {computationType === 'PYTHON_CODE' ? (
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-semibold text-text-secondary">
                Formula Expression *
              </label>
              <textarea
                rows={3}
                value={computationValue}
                onChange={(e) => setComputationValue(e.target.value)}
                placeholder="return basic + (wage * 0.10);"
                className="w-full px-3 py-2 text-xs font-mono bg-elevated/50 border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
                required
              />
              <span className="text-[11px] text-text-muted">
                Available variables: <code className="text-primary font-mono">wage</code>, <code className="text-primary font-mono">basic</code>, <code className="text-primary font-mono">gross</code>, <code className="text-primary font-mono">deductions</code>, <code className="text-primary font-mono">overtime</code>, <code className="text-primary font-mono">workedDays</code>, <code className="text-primary font-mono">unpaidDays</code>
              </span>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 mt-2">
                  Evaluation Sequence (Lower runs first)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  {computationType === 'PERCENTAGE_OF_WAGE' ? 'Percentage Rate (%) *' : 'Monthly Amount (₹) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={computationType === 'PERCENTAGE_OF_WAGE' ? '0.1' : '100'}
                  value={computationValue}
                  onChange={(e) => setComputationValue(e.target.value)}
                  placeholder={computationType === 'PERCENTAGE_OF_WAGE' ? '15.0' : '2000'}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Evaluation Sequence
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          )}

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
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Add Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
