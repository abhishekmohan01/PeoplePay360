import { useState } from 'react';
import { useSalaryStructures, usePayrollRules } from './usePayrollConfig';
import { SalaryStructureModal } from './SalaryStructureModal';
import { SalaryRuleModal } from './SalaryRuleModal';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Calculator, FileText, Lock, Plus, CheckCircle2, DollarSign, X, Shield, Info } from 'lucide-react';

export const PayrollConfigPage = () => {
  const { data: structures, isLoading: isLoadingStructs } = useSalaryStructures();
  const { data: rules, isLoading: isLoadingRules } = usePayrollRules();
  const canEdit = useAuthStore((state) => state.canEditPayrollConfig)();

  const [selectedStruct, setSelectedStruct] = useState<any | null>(null);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const totalStructures = structures?.length || 0;
  const totalRules = rules?.length || 0;
  const allowancesCount = rules?.filter(r => r.category === 'Allowance').length || 0;
  const deductionsCount = rules?.filter(r => r.category === 'Deduction').length || 0;

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      <PageHeader 
        title="Payroll Configuration" 
        subtitle={canEdit ? "Manage salary structure templates, deduction rules, and company compensation policies" : "Salary structures and rules (Read-Only access for HR Payroll User)"}
      />

      {!canEdit && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
          <Lock size={15} />
          <span>You have Read-Only view permissions for Salary Structures & Rules as per HR Payroll User policy.</span>
        </div>
      )}

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => document.getElementById('structures-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view salary structures"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Salary Structures</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalStructures} Templates
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            Monthly base wage blueprints ➔
          </div>
        </div>

        <div 
          onClick={() => document.getElementById('rules-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-surface border border-border hover:border-amber-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view compensation rules"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Rules</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calculator size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalRules} Rules
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {allowancesCount} Allowances • {deductionsCount} Deductions ➔
          </div>
        </div>

        <div 
          className="bg-surface border border-border rounded-xl p-4 shadow-xs select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Security Policy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-500">
            {canEdit ? 'Full Edit' : 'Read Only'}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {canEdit ? 'Admin privileges enabled' : 'Governed by role permissions'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Salary Structures */}
        <div id="structures-section" className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              <h3 className="text-base font-heading font-semibold text-text-primary m-0">Salary Structures</h3>
            </div>
            {canEdit ? (
              <Button variant="secondary" size="sm" onClick={() => setIsStructureModalOpen(true)}>
                <Plus size={14} />
                <span>New Structure</span>
              </Button>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-elevated text-text-muted border border-border">Read-Only</span>
            )}
          </div>

          {isLoadingStructs ? (
            <div className="p-8 text-center text-text-muted text-sm font-medium">Loading structures...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {structures?.map((struct) => (
                <div 
                  key={struct.id} 
                  onClick={() => setSelectedStruct(struct)}
                  className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-primary transition-all hover:scale-[1.01] cursor-pointer group select-none"
                  title="Click to view structure details"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors m-0">
                      {struct.name}
                    </h4>
                    <StatusBadge status={struct.status} />
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Type: <strong className="text-text-primary font-medium">{struct.type}</strong></span>
                    <span className="font-semibold text-primary tabular-nums">
                      Base: ₹{struct.baseSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border/40 pt-2">
                    <span>Click to view formula & rules</span>
                    <span className="text-primary font-medium">Inspect ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Rules & Allowances */}
        <div id="rules-section" className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="text-amber-500" size={20} />
              <h3 className="text-base font-heading font-semibold text-text-primary m-0">Allowances & Salary Rules</h3>
            </div>
            {canEdit ? (
              <Button variant="secondary" size="sm" onClick={() => setIsRuleModalOpen(true)}>
                <Plus size={14} />
                <span>Add Rule</span>
              </Button>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-elevated text-text-muted border border-border">Read-Only</span>
            )}
          </div>

          {isLoadingRules ? (
            <div className="p-8 text-center text-text-muted text-sm font-medium">Loading rules...</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {rules?.map(rule => (
                <div 
                  key={rule.id} 
                  onClick={() => setSelectedRule(rule)}
                  className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface shadow-xs hover:border-amber-500/50 hover:bg-elevated/40 transition-all cursor-pointer group select-none"
                  title="Click to view rule calculation"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-amber-500 transition-colors">
                      {rule.name}
                    </span>
                    <span className="text-xs text-text-muted font-mono uppercase">{rule.code}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary tabular-nums">{rule.amount}</span>
                    <StatusBadge status={rule.category} variant={
                      rule.category === 'Allowance' ? 'success' : 
                      rule.category === 'Deduction' ? 'error' : 'info'
                    } />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Structure Detail Inspection Modal */}
      {selectedStruct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStruct(null)}
        >
          <div 
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-border p-6 animate-in zoom-in-95 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-text-primary m-0">
                    {selectedStruct.name}
                  </h3>
                  <span className="text-xs text-text-muted">Salary Structure Definition</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStruct(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Template Type</span>
                <span className="font-semibold text-text-primary">{selectedStruct.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Baseline Monthly Salary</span>
                <span className="font-semibold text-primary text-sm tabular-nums">
                  ₹{selectedStruct.baseSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Lifecycle Status</span>
                <StatusBadge status={selectedStruct.status} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-elevated/50 border border-border text-[11px] text-text-muted flex items-start gap-2">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                This structure applies default rules, progressive allowances, and tax deductions during the payrun cycle.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setSelectedStruct(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Detail Inspection Modal */}
      {selectedRule && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRule(null)}
        >
          <div 
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-border p-6 animate-in zoom-in-95 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-text-primary m-0">
                    {selectedRule.name}
                  </h3>
                  <span className="text-xs font-mono text-text-muted uppercase">{selectedRule.code}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedRule(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Category</span>
                <StatusBadge status={selectedRule.category} variant={
                  selectedRule.category === 'Allowance' ? 'success' : 
                  selectedRule.category === 'Deduction' ? 'error' : 'info'
                } />
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Rate / Computation</span>
                <span className="font-semibold text-text-primary text-sm tabular-nums">
                  {selectedRule.amount}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-elevated/50 border border-border text-[11px] text-text-muted flex items-start gap-2">
              <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Calculated automatically per payslip based on active contracts and compliance standards.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setSelectedRule(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Modal */}
      <SalaryStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
      />

      {/* Rule Modal */}
      <SalaryRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />
    </div>
  );
};
