import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useCreateSalaryRule, useSalaryStructures } from './usePayrollConfig';
import { X, Calculator, AlertCircle, Layers } from 'lucide-react';

interface SalaryRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalaryRuleModal: React.FC<SalaryRuleModalProps> = ({ isOpen, onClose }) => {
  const { data: structures } = useSalaryStructures();
  const createMutation = useCreateSalaryRule();

  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'ALLOWANCE' | 'DEDUCTION'>('ALLOWANCE');
  const [computationType, setComputationType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('FIXED_AMOUNT');
  const [computationValue, setComputationValue] = useState('5000');
  const [sequence, setSequence] = useState('10');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (structures && structures.length > 0 && structures[0]) {
        setSalaryStructureId(structures[0].id);
      }
      setName('');
      setCode('');
      setCategory('ALLOWANCE');
      setComputationType('FIXED_AMOUNT');
      setComputationValue('5000');
      setSequence('10');
      setFormError(null);
    }
  }, [isOpen, structures]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === name.toUpperCase().replace(/[^A-Z0-9]/g, '_')) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
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
    if (!computationValue || isNaN(Number(computationValue))) {
      setFormError('Please provide a valid computation value.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        salaryStructureId,
        name: name.trim(),
        code: code.trim() || name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        category,
        computationType,
        computationValue: String(computationValue),
        sequence: Number(sequence) || 10,
      });
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
                onChange={(e) => setCategory(e.target.value as 'ALLOWANCE' | 'DEDUCTION')}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="ALLOWANCE">Allowance (+ Adds to Gross)</option>
                <option value="DEDUCTION">Deduction (- Subtracts from Net)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Calculation Type
              </label>
              <select
                value={computationType}
                onChange={(e) => setComputationType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="FIXED_AMOUNT">Fixed Amount (₹ / month)</option>
                <option value="PERCENTAGE">Percentage of Basic (%)</option>
              </select>
            </div>
          </div>

          {/* Value & Sequence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                {computationType === 'PERCENTAGE' ? 'Percentage Rate (%)' : 'Monthly Amount (₹)'} *
              </label>
              <input
                type="number"
                min="0"
                step={computationType === 'PERCENTAGE' ? '0.1' : '100'}
                value={computationValue}
                onChange={(e) => setComputationValue(e.target.value)}
                placeholder={computationType === 'PERCENTAGE' ? '12.5' : '5000'}
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
                max="100"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
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
              {createMutation.isPending ? 'Saving...' : 'Add Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
