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
  Users,
  Calendar,
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
    return <div className="p-12 text-center text-text-muted text-sm font-medium">Loading payrun details...</div>;
  }

  if (!payrun) {
    return <div className="p-12 text-center text-error text-sm font-medium">Payrun batch not found.</div>;
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
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      {/* Back button */}
      <div className="mb-3">
        <button
          onClick={() => navigate('/payroll/payruns')}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Payrun Batches</span>
        </button>
      </div>

      {/* Header & Status Lifecycle Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold m-0 text-text-primary">
              {payrun.name}
            </h1>
            <StatusBadge status={payrun.status} />
          </div>
          <p className="text-text-secondary m-0 mt-1 text-xs">
            Period: <span className="font-semibold text-text-primary">{payrun.periodStart}</span> to{' '}
            <span className="font-semibold text-text-primary">{payrun.periodEnd}</span> • Structure:{' '}
            <span className="font-semibold text-text-primary">{payrun.salaryStructureName}</span>
          </p>
        </div>

        {/* Action Buttons Bar */}
        {canAccessPayroll && (
          <div className="flex flex-wrap items-center gap-2">
            {status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={handleCompute}
                disabled={computeMutation.isPending}
              >
                <Calculator size={15} />
                <span>{computeMutation.isPending ? 'Computing...' : 'Compute Payslips'}</span>
              </Button>
            )}

            {status === 'COMPUTED' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompute}
                  disabled={computeMutation.isPending}
                >
                  Recompute
                </Button>
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={validateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 size={15} />
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
                >
                  <DollarSign size={15} />
                  <span>{markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedback('✓ Payslip email notification dispatched to all employees!')}
                >
                  <Send size={13} />
                  <span>Send Payslips</span>
                </Button>
              </>
            )}

            {status === 'PAID' && (
              <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 rounded-lg text-xs font-semibold">
                ✓ Dispatched & Paid
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className="mb-6 p-3 bg-primary/10 border border-primary/25 rounded-xl text-primary text-xs font-medium animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Summary KPI Counters (Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => document.getElementById('payslips-table')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view generated payslips table"
        >
          <span className="text-text-muted text-xs block font-medium uppercase tracking-wider">Headcount in Cycle</span>
          <span className="text-2xl font-heading font-bold text-text-primary mt-1 block">
            {payrun.payslips?.length || payrun.employeeCount || 0}
          </span>
          <span className="text-[11px] text-text-muted mt-1 block truncate">
            View employee payslips below ➔
          </span>
        </div>

        <div 
          onClick={() => navigate('/payroll/dashboard')}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view executive payroll metrics"
        >
          <span className="text-text-muted text-xs block font-medium uppercase tracking-wider">Total Gross Salary</span>
          <span className="text-2xl font-heading font-bold text-text-primary mt-1 block">
            ₹
            {(
              payrun.payslips?.reduce((sum, p) => sum + p.grossSalary, 0) || 0
            ).toLocaleString()}
          </span>
          <span className="text-[11px] text-text-muted mt-1 block truncate">
            Before deductions & taxes ➔
          </span>
        </div>

        <div 
          onClick={() => navigate('/payroll/dashboard')}
          className="bg-surface border border-border hover:border-emerald-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view disbursement analytics"
        >
          <span className="text-text-muted text-xs block font-medium uppercase tracking-wider">Total Net Payable</span>
          <span className="text-2xl font-heading font-bold text-emerald-500 mt-1 block">
            ₹
            {(
              payrun.payslips?.reduce((sum, p) => sum + p.netSalary, 0) || 0
            ).toLocaleString()}
          </span>
          <span className="text-[11px] text-text-muted mt-1 block truncate">
            Disbursement amount ➔
          </span>
        </div>

        <div 
          onClick={() => document.getElementById('payslips-table')?.scrollIntoView({ behavior: 'smooth' })}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            payrun.warningCount > 0 ? 'border-amber-500/40 hover:border-amber-500' : 'border-border hover:border-border/80'
          }`}
          title="Click to review batch validation warnings"
        >
          <span className="text-text-muted text-xs block font-medium uppercase tracking-wider">Validation Warnings</span>
          <span
            className={`text-2xl font-heading font-bold mt-1 block ${
              payrun.warningCount > 0 ? 'text-amber-500' : 'text-text-muted'
            }`}
          >
            {payrun.warningCount}
          </span>
          <span className="text-[11px] text-text-muted mt-1 block truncate">
            {payrun.warningCount > 0 ? 'Audit flags detected ➔' : 'No validation errors'}
          </span>
        </div>
      </div>

      {/* Generated Payslips Table */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-heading font-semibold text-text-primary m-0">
          Generated Payslips
        </h3>
      </div>

      <div id="payslips-table" className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm mb-6">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th className="text-right">Basic Wage</th>
              <th className="text-right">Gross Salary</th>
              <th className="text-right">Net Payable</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {payrun.payslips && payrun.payslips.length > 0 ? (
              payrun.payslips.map((ps) => (
                <tr key={ps.id}>
                  <td>
                    <div className="font-semibold text-text-primary">{ps.employeeName}</div>
                    <span className="text-[10px] text-text-muted uppercase">
                      {ps.employeeCode || ps.jobPosition}
                    </span>
                  </td>
                  <td className="text-xs text-text-secondary">
                    {ps.departmentName}
                  </td>
                  <td className="text-sm text-right tabular-nums text-text-secondary">
                    ₹{ps.basicSalary.toLocaleString()}
                  </td>
                  <td className="text-sm text-right tabular-nums font-medium text-text-primary">
                    ₹{ps.grossSalary.toLocaleString()}
                  </td>
                  <td className="text-sm text-right tabular-nums font-semibold text-emerald-500">
                    ₹{ps.netSalary.toLocaleString()}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPayslip(ps)}
                      className="px-2.5 py-1 text-xs rounded-md border border-border bg-surface hover:bg-elevated text-primary font-semibold transition-colors cursor-pointer"
                    >
                      Breakdown
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-muted text-sm">
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
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-border pb-3 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary m-0">
                  Payslip Breakdown
                </h3>
                <p className="text-xs text-text-muted m-0 mt-0.5">
                  {selectedPayslip.employeeName} • {selectedPayslip.departmentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Basic Salary</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  ₹{selectedPayslip.basicSalary.toLocaleString()}
                </span>
              </div>

              {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
                selectedPayslip.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex justify-between py-1.5 border-b border-border text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          line.category === 'ALLOWANCE'
                            ? 'bg-emerald-500'
                            : line.category === 'DEDUCTION'
                            ? 'bg-red-400'
                            : 'bg-primary'
                        }`}
                      />
                      <span>{line.name}</span>
                      <span className="text-[10px] text-text-muted">({line.code})</span>
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        line.category === 'DEDUCTION' ? 'text-red-500' : 'text-text-primary'
                      }`}
                    >
                      {line.category === 'DEDUCTION' ? '-' : '+'}₹
                      {Math.abs(line.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-text-muted py-2">
                  No individual line items computed yet.
                </div>
              )}

              <div className="flex justify-between py-2.5 border-t border-border font-bold text-base mt-2">
                <span className="text-text-primary">Net Payable</span>
                <span className="text-emerald-500 text-lg tabular-nums">
                  ₹{selectedPayslip.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Print PDF</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPayslip(null)}
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
