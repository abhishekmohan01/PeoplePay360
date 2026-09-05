import { useSalaryStructures, usePayrollRules } from './usePayrollConfig';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Calculator, FileText, Lock } from 'lucide-react';

export const PayrollConfigPage = () => {
  const { data: structures, isLoading: isLoadingStructs } = useSalaryStructures();
  const { data: rules, isLoading: isLoadingRules } = usePayrollRules();
  const canEdit = useAuthStore((state) => state.canEditPayrollConfig)();

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader 
        title="Payroll Configuration" 
        subtitle={canEdit ? "Manage salary structures, allowances, and tax computation rules" : "Salary structures and rules (Read-Only access for HR Payroll User)"}
      />

      {!canEdit && (
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-400 font-sans text-xs">
          <Lock size={16} />
          <span>You have Read-Only view permissions for Salary Structures & Rules as per HR Payroll User policy.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Salary Structures */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              <h3 className="text-2xl font-[Caveat] font-bold m-0">Salary Structures</h3>
            </div>
            {canEdit ? (
              <Button variant="secondary" size="sm">New Structure</Button>
            ) : (
              <span className="text-xs font-sans px-2.5 py-1 rounded-md bg-elevated text-muted border border-border">Read-Only</span>
            )}
          </div>

          {isLoadingStructs ? (
            <div className="text-center p-4 text-muted font-[Caveat] text-lg">Loading structures...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {structures?.map((struct) => (
                <Card key={struct.id} className="hover:border-primary transition-colors cursor-pointer font-sans">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-base font-bold text-text-primary m-0 font-sans">{struct.name}</h4>
                    <StatusBadge status={struct.status} />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Type: {struct.type}</span>
                    <span className="font-medium text-text-primary">
                      Base: ${struct.baseSalary.toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Rules & Allowances */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="text-warning" size={24} />
              <h3 className="text-2xl font-[Caveat] font-bold m-0">Allowances & Rules</h3>
            </div>
            {canEdit ? (
              <Button variant="secondary" size="sm">Add Rule</Button>
            ) : (
              <span className="text-xs font-sans px-2.5 py-1 rounded-md bg-elevated text-muted border border-border">Read-Only</span>
            )}
          </div>

          {isLoadingRules ? (
            <div className="text-center p-4 text-muted font-[Caveat]">Loading rules...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {rules?.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-surface">
                  <div className="flex flex-col">
                    <span className="font-medium">{rule.name}</span>
                    <span className="text-xs text-muted font-[Caveat] text-base">{rule.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{rule.amount}</span>
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
    </div>
  );
};
