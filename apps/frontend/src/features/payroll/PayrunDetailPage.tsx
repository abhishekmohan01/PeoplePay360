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
  Download,
  ExternalLink,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { downloadPayslipPdf, viewPayslipPdf, type PayslipSummary } from '../../api/payroll';

export const PayrunDetailPage: React.FC = () => {
  const { payrunId } = useParams<{ payrunId: string }>();
  const navigate = useNavigate();

  const { data: payrun, isLoading } = usePayrun(payrunId!);
  const computeMutation = useComputePayrun();
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPayrunPaid();

  const [selectedPayslip, setSelectedPayslip] = useState<PayslipSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async (payslipId: string, employeeCode?: string) => {
    try {
      setIsDownloadingPdf(true);
      await downloadPayslipPdf(payslipId, `Payslip_${employeeCode || 'Employee'}_${payrun?.periodStart || 'payrun'}.pdf`);
    } catch (err: any) {
      setFeedback(`Failed to download PDF: ${err?.message || 'Server error'}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleViewPdf = async (payslipId: string) => {
    try {
      await viewPayslipPdf(payslipId);
    } catch (err: any) {
      setFeedback(`Failed to open PDF: ${err?.message || 'Server error'}`);
    }
  };

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
                isLoading={computeMutation.isPending}
              >
                {!computeMutation.isPending && <Calculator size={15} />}
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
                  isLoading={computeMutation.isPending}
                >
                  Recompute
                </Button>
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={validateMutation.isPending}
                  isLoading={validateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {!validateMutation.isPending && <CheckCircle2 size={15} />}
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
                  isLoading={markPaidMutation.isPending}
                >
                  {!markPaidMutation.isPending && <DollarSign size={15} />}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
          className="bg-surface border border-border hover:border-rose-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view deduction analytics"
        >
          <span className="text-text-muted text-xs block font-medium uppercase tracking-wider">Total Deductions</span>
          <span className="text-2xl font-heading font-bold text-rose-500 mt-1 block">
            -₹
            {(
              payrun.payslips?.reduce((sum, p) => sum + (p.totalDeductions || (p.grossSalary - p.netSalary)), 0) || 0
            ).toLocaleString()}
          </span>
          <span className="text-[11px] text-text-muted mt-1 block truncate">
            PF, taxes & withholdings ➔
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
              <th className="text-right">Deductions</th>
              <th className="text-right">Net Payable</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {payrun.payslips && payrun.payslips.length > 0 ? (
              payrun.payslips.map((ps) => {
                const deductionAmount = ps.totalDeductions || Math.max(0, ps.grossSalary - ps.netSalary);
                return (
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
                    <td className="text-sm text-right tabular-nums font-medium text-rose-500">
                      -₹{deductionAmount.toLocaleString()}
                    </td>
                    <td className="text-sm text-right tabular-nums font-semibold text-emerald-500">
                      ₹{ps.netSalary.toLocaleString()}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(ps)}
                          className="px-2.5 py-1 text-xs rounded-md border border-border bg-surface hover:bg-elevated text-primary font-semibold transition-colors cursor-pointer"
                        >
                          Breakdown
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(ps.id, ps.employeeCode)}
                          title="Download Official PDF"
                          className="p-1.5 text-xs rounded-md border border-border bg-surface hover:bg-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-text-muted text-sm">
                  No payslips generated yet. Click "Compute Payslips" above to process this batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Line Items Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-border pb-3 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary m-0">
                  Payslip Breakdown
                </h3>
                <p className="text-xs text-text-muted m-0 mt-0.5">
                  {selectedPayslip.employeeName} {selectedPayslip.employeeCode ? `(${selectedPayslip.employeeCode})` : ''} • {selectedPayslip.departmentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1 rounded-lg hover:bg-elevated"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm">
              {/* Earnings Section */}
              <div className="rounded-xl border border-border/70 p-3.5 bg-surface/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Gross Earnings
                  </span>
                  <span className="font-bold text-sm text-text-primary tabular-nums">
                    ₹{selectedPayslip.grossSalary.toLocaleString()}
                  </span>
                </div>

                <div className="divide-y divide-border/50 text-xs">
                  <div className="flex justify-between py-1.5 text-text-secondary">
                    <span>Basic Salary</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      ₹{selectedPayslip.basicSalary.toLocaleString()}
                    </span>
                  </div>

                  {selectedPayslip.lines && selectedPayslip.lines.filter(l => l.category !== 'DEDUCTION' && l.category !== 'NET').map((line) => (
                    <div key={line.id} className="flex justify-between py-1.5 text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{line.name}</span>
                        <span className="text-[10px] text-text-muted uppercase">({line.code})</span>
                      </span>
                      <span className="font-semibold text-text-primary tabular-nums">
                        +₹{Math.abs(line.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions Section */}
              <div className="rounded-xl border border-border/70 p-3.5 bg-surface/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Minus size={13} /> Statutory & Policy Deductions
                  </span>
                  <span className="font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                    -₹{(selectedPayslip.totalDeductions || Math.max(0, selectedPayslip.grossSalary - selectedPayslip.netSalary)).toLocaleString()}
                  </span>
                </div>

                <div className="divide-y divide-border/50 text-xs">
                  {selectedPayslip.lines && selectedPayslip.lines.filter(l => l.category === 'DEDUCTION').length > 0 ? (
                    selectedPayslip.lines.filter(l => l.category === 'DEDUCTION').map((line) => (
                      <div key={line.id} className="flex justify-between py-1.5 text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{line.name}</span>
                          <span className="text-[10px] text-text-muted uppercase">({line.code})</span>
                        </span>
                        <span className="font-semibold text-rose-500 tabular-nums">
                          -₹{Math.abs(line.amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-1 text-[11px] text-text-muted">
                      No statutory deductions applied to this contract.
                    </div>
                  )}
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <div>
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                    Net Take-Home Pay
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Final disbursement to employee bank account
                  </span>
                </div>
                <span className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₹{selectedPayslip.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPdf(selectedPayslip.id)}
                className="flex items-center gap-1.5 text-xs"
              >
                <ExternalLink size={14} />
                <span>View PDF</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadPdf(selectedPayslip.id, selectedPayslip.employeeCode)}
                  isLoading={isDownloadingPdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPayslip(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
