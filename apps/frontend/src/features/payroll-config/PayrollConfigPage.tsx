import { useSalaryStructures, usePayrollRules } from './usePayrollConfig';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Settings, Calculator, FileText } from 'lucide-react';

export const PayrollConfigPage = () => {
  const { data: structures, isLoading: isLoadingStructs } = useSalaryStructures();
  const { data: rules, isLoading: isLoadingRules } = usePayrollRules();

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Payroll Configuration" 
        subtitle="Manage salary structures, allowances, and tax rules"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Salary Structures */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              <h3 className="text-2xl font-[Caveat] font-bold m-0">Salary Structures</h3>
            </div>
            <Button variant="secondary" size="sm">New Structure</Button>
          </div>

          {isLoadingStructs ? (
            <div className="text-center p-4 text-muted font-[Caveat]">Loading structures...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {structures?.map(struct => (
                <Card key={struct.id} className="hover:border-primary transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg m-0">{struct.name}</h4>
                    <StatusBadge status={struct.status} />
                  </div>
                  <div className="flex justify-between text-sm text-muted">
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
            <Button variant="secondary" size="sm">Add Rule</Button>
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
