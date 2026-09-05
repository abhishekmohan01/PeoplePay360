import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  usePayrun,
  useComputePayrun,
  useValidatePayrun,
  useMarkPayrunPaid,
} from './usePayruns';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Calculator,
  CheckCircle2,
  DollarSign,
  Send,
  AlertTriangle,
  ArrowLeft,
  FileText,
  X,
} from 'lucide-react';
import type { PayslipSummary } from '../../api/payroll';

export const PayrunDetailPage: React.FC = () => {
  const { payrunId } = useParams<{ payrunId: string }>();
  const navigate = useNavigate();

  const { data: payrun, isLoading } = usePayrun(payrunId!);
  const computeMutation = useComputePayrun();
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPayrunPaid();

  const [selectedPayslip, setSelectedPayslip] = useState<PayslipSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canAccessPayroll = useAuthStore((state) => state.canAccessPayroll)();

  if (isLoading) {
    return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading payrun details...</div>;
  }

  if (!payrun) {
    return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Payrun batch not found</div>;
  }

  const handleCompute = () => {
    setFeedback(null);
    computeMutation.mutate(payrun.id, {
      onSuccess: () => setFeedback('✓ All payslips successfully computed!'),
      onError: (err: any) => setFeedback(`Compute error: ${err.message}`),
    });
  };

  const handleValidate = () => {
    setFeedback(null);
    validateMutation.mutate(payrun.id, {
      onSuccess: () => setFeedback('✓ Payrun batch validated! Ready for payment processing.'),
      onError: (err: any) => setFeedback(`Validation error: ${err.message}`),
    });
  };

  const handleMarkPaid = () => {
    setFeedback(null);
    markPaidMutation.mutate(payrun.id, {
      onSuccess: () => setFeedback('✓ Payrun marked as PAID! Records archived.'),
      onError: (err: any) => setFeedback(`Payment error: ${err.message}`),
    });
  };

  const status = payrun.status;

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full p-4 mt-4">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/payroll/payruns')}
          className="font-[Caveat] text-lg text-accent hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Payruns
        </button>
      </div>

      {/* Header & Status Lifecycle Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-[Caveat] font-bold m-0 text-text-primary">
              Payrun / {payrun.name}
            </h1>
            <StatusBadge status={payrun.status} />
          </div>
          <p className="text-muted m-0 mt-1 font-sans text-xs">
            Period: <span className="font-semibold text-text-primary">{payrun.periodStart}</span> to{' '}
            <span className="font-semibold text-text-primary">{payrun.periodEnd}</span> • Structure:{' '}
            <span className="font-semibold text-text-primary">{payrun.salaryStructureName}</span>
          </p>
        </div>

        {/* Action Buttons Bar */}
        {canAccessPayroll && (
          <div className="flex items-center gap-2">
            {status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={handleCompute}
                disabled={computeMutation.isPending}
                className="flex items-center gap-2 cursor-pointer font-[Caveat] text-xl"
              >
                <Calculator size={18} />
                <span>{computeMutation.isPending ? 'Computing...' : 'Compute Payslips'}</span>
              </Button>
            )}

            {status === 'COMPUTED' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCompute}
                  disabled={computeMutation.isPending}
                  className="cursor-pointer text-xs"
                >
                  Recompute
                </Button>
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={validateMutation.isPending}
                  className="flex items-center gap-2 cursor-pointer font-[Caveat] text-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 size={18} />
                  <span>{validateMutation.isPending ? 'Validating...' : 'Validate Payrun'}</span>
                </Button>
              </>
            )}

            {status === 'VALIDATED' && (
              <>
                <Button
                  variant="primary"
                  onClick={handleMarkPaid}
                  disabled={markPaidMutation.isPending}
                  className="flex items-center gap-2 cursor-pointer font-[Caveat] text-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <DollarSign size={18} />
                  <span>{markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFeedback('✓ Payslip email notification dispatched to all employees!')}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Send size={14} />
                  <span>Send Payslips</span>
                </Button>
              </>
            )}

            {status === 'PAID' && (
              <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold font-sans">
                ✓ Dispatched & Paid
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className="mb-6 p-3 bg-accent/15 border border-accent/40 rounded-xl text-accent font-sans text-xs font-medium animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-3">
          <span className="text-muted text-xs block font-sans">Employees in Batch</span>
          <span className="text-2xl font-[Caveat] font-bold text-text-primary">
            {payrun.payslips?.length || payrun.employeeCount || 0}
          </span>
        </Card>
        <Card className="p-3">
          <span className="text-muted text-xs block font-sans">Total Gross Salary</span>
          <span className="text-2xl font-[Caveat] font-bold text-text-primary">
            ₹
            {(
              payrun.payslips?.reduce((sum, p) => sum + p.grossSalary, 0) || 0
            ).toLocaleString()}
          </span>
        </Card>
        <Card className="p-3">
          <span className="text-muted text-xs block font-sans">Total Net Payable</span>
          <span className="text-2xl font-[Caveat] font-bold text-emerald-400">
            ₹
            {(
              payrun.payslips?.reduce((sum, p) => sum + p.netSalary, 0) || 0
            ).toLocaleString()}
          </span>
        </Card>
        <Card className="p-3">
          <span className="text-muted text-xs block font-sans">Calculation Warnings</span>
          <span
            className={`text-2xl font-[Caveat] font-bold ${
              payrun.warningCount > 0 ? 'text-amber-400' : 'text-muted'
            }`}
          >
            {payrun.warningCount}
          </span>
        </Card>
      </div>

      {/* Generated Payslips Table */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-2xl font-[Caveat] font-bold text-text-primary m-0">
          Generated Payslips
        </h3>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left border-collapse text-sm font-sans">
          <thead>
            <tr className="bg-elevated/40">
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[25%]">
                Employee
              </th>
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[18%]">
                Department
              </th>
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[14%] text-right">
                Basic Wage
              </th>
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[14%] text-right">
                Gross
              </th>
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%] text-right">
                Net Salary
              </th>
              <th className="p-3 font-[Caveat] font-bold text-muted text-lg border-b border-border/50 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {payrun.payslips && payrun.payslips.length > 0 ? (
              payrun.payslips.map((ps) => (
                <tr
                  key={ps.id}
                  className="border-b border-border hover:bg-elevated/30 transition-colors"
                >
                  <td className="p-3 font-[Caveat] text-lg font-bold border-r border-border/50">
                    <div>{ps.employeeName}</div>
                    <span className="text-[10px] text-muted font-sans uppercase">
                      {ps.employeeCode || ps.jobPosition}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-text-secondary border-r border-border/50">
                    {ps.departmentName}
                  </td>
                  <td className="p-3 font-[Caveat] text-base text-right border-r border-border/50">
                    ₹{ps.basicSalary.toLocaleString()}
                  </td>
                  <td className="p-3 font-[Caveat] text-base text-right border-r border-border/50 font-medium">
                    ₹{ps.grossSalary.toLocaleString()}
                  </td>
                  <td className="p-3 font-[Caveat] text-lg font-bold text-emerald-400 text-right border-r border-border/50">
                    ₹{ps.netSalary.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPayslip(ps)}
                      className="px-2.5 py-1 text-xs font-sans rounded-md border border-border bg-surface hover:bg-elevated text-accent font-semibold transition-colors cursor-pointer"
                    >
                      View Breakdown
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted font-[Caveat] text-lg">
                  No payslips generated yet. Click "Compute Payslips" above to process this batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Line Items Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface border-2 border-border/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-border pb-3 mb-4">
              <div>
                <h3 className="font-[Caveat] text-3xl font-bold text-text-primary m-0">
                  Payslip Breakdown
                </h3>
                <p className="font-sans text-xs text-muted m-0 mt-0.5">
                  {selectedPayslip.employeeName} • {selectedPayslip.departmentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-muted hover:text-text-primary cursor-pointer text-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-6 font-sans text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted">Basic Salary</span>
                <span className="font-bold text-text-primary">
                  ₹{selectedPayslip.basicSalary.toLocaleString()}
                </span>
              </div>

              {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
                selectedPayslip.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex justify-between py-1.5 border-b border-border/30 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          line.category === 'ALLOWANCE'
                            ? 'bg-emerald-500'
                            : line.category === 'DEDUCTION'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span>{line.name}</span>
                      <span className="text-[10px] text-muted">({line.code})</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        line.category === 'DEDUCTION' ? 'text-red-400' : 'text-text-primary'
                      }`}
                    >
                      {line.category === 'DEDUCTION' ? '-' : '+'}₹
                      {Math.abs(line.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-muted py-2">
                  No individual line items computed yet.
                </div>
              )}

              <div className="flex justify-between py-2 border-t-2 border-border font-bold text-base mt-2">
                <span>Net Payable</span>
                <span className="text-emerald-400 text-lg">
                  ₹{selectedPayslip.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <FileText size={14} />
                <span>Print PDF</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPayslip(null)}
                className="cursor-pointer text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
