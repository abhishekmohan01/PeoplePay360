import { useState } from 'react';
import { usePayslips, usePayslip } from './usePayroll';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { downloadPayslipPdf, viewPayslipPdf } from '../../api/payroll';
import { FileText, Download, Eye, Wallet, Calendar, ShieldCheck, X } from 'lucide-react';

export const MyPayslipsPage = () => {
  const { data: payslips, isLoading } = usePayslips();
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);

  const { data: selectedPayslip } = usePayslip(selectedPayslipId || '');

  // Calculate summary metrics
  const totalCount = payslips?.length || 0;
  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;
  const totalNetEarned = payslips?.reduce((sum, p) => sum + p.netSalary, 0) || 0;

  return (
    <div className="flex flex-col h-full font-primary max-w-6xl mx-auto w-full mt-4 animate-fadeIn">
      <PageHeader 
        title="My Payslips" 
        subtitle="Review, inspect, and download your monthly salary statements"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex flex-col gap-3 p-6 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Wallet size={20} />
            <span className="font-semibold text-xs uppercase tracking-wider text-text-muted">Latest Net Salary</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-primary">
              ₹{latestPayslip ? latestPayslip.netSalary.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-medium text-text-muted">
              {latestPayslip?.periodStart ? `(${latestPayslip.periodStart})` : ''}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-6 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500">
            <FileText size={20} />
            <span className="font-semibold text-xs uppercase tracking-wider text-text-muted">Total Statements</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary">{totalCount}</span>
            <span className="text-xs font-medium text-text-muted">issued payslips</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-6 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500">
            <ShieldCheck size={20} />
            <span className="font-semibold text-xs uppercase tracking-wider text-text-muted">Total Earnings</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              ₹{totalNetEarned.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-text-muted">net cumulative</span>
          </div>
        </Card>
      </div>

      <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-3 flex items-center gap-2">
        <Calendar size={18} className="text-primary" />
        <span>Salary Statements History</span>
      </h3>

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-sm font-medium">Loading your payslip history...</div>
      ) : payslips && payslips.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-elevated/40 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                <th className="p-4 w-[20%]">Period</th>
                <th className="p-4 w-[15%]">Basic Pay</th>
                <th className="p-4 w-[15%]">Gross Salary</th>
                <th className="p-4 w-[15%]">Deductions</th>
                <th className="p-4 w-[15%]">Net Salary</th>
                <th className="p-4 w-[10%]">Status</th>
                <th className="p-4 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-elevated/30 transition-colors">
                  <td className="p-4 font-semibold text-text-primary">
                    {payslip.periodStart && payslip.periodEnd 
                      ? `${payslip.periodStart} to ${payslip.periodEnd}` 
                      : `Payslip #${payslip.id.slice(0, 8)}`}
                  </td>
                  <td className="p-4 font-mono text-xs text-text-secondary">₹{payslip.basicSalary.toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs text-text-secondary">₹{payslip.grossSalary.toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs text-rose-500">-₹{payslip.totalDeductions.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-primary text-sm">₹{payslip.netSalary.toLocaleString()}</td>
                  <td className="p-4">
                    <StatusBadge status={payslip.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedPayslipId(payslip.id)}
                        title="View Breakdown"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => downloadPayslipPdf(payslip.id, `Payslip_${payslip.periodStart || payslip.id}.pdf`)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Reliable Empty State Message */
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border rounded-xl shadow-sm my-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h4 className="text-lg font-bold text-text-primary mb-1">No Payslips Issued Yet</h4>
          <p className="text-xs text-text-muted max-w-md m-0 mb-4 font-medium leading-relaxed">
            Your monthly salary statements will appear here once processed and generated by HR &amp; Payroll.
          </p>
          <span className="px-3 py-1 bg-elevated border border-border text-text-muted text-xs font-semibold rounded-full">
            Status: Up to date
          </span>
        </Card>
      )}

      {/* Payslip Detail Breakdown Modal */}
      {selectedPayslipId && selectedPayslip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-primary">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-border relative animate-fadeIn">
            
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <FileText size={18} />
                <span>Salary Breakdown</span>
              </div>
              <button 
                onClick={() => setSelectedPayslipId(null)} 
                className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-elevated/40 p-3 rounded-lg border border-border/60 text-xs">
                <div>
                  <span className="text-text-muted">Employee: </span>
                  <strong className="text-text-primary">{selectedPayslip.employeeName}</strong>
                </div>
                <StatusBadge status={selectedPayslip.status} />
              </div>

              {/* Breakdown lines */}
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-elevated/60 border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                      <th className="p-3">Component / Rule</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
                      selectedPayslip.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="p-3 font-semibold text-text-primary">{line.name}</td>
                          <td className="p-3 text-text-muted">{line.category}</td>
                          <td className={`p-3 text-right font-mono font-semibold ${line.category === 'DEDUCTION' ? 'text-rose-500' : 'text-text-primary'}`}>
                            {line.category === 'DEDUCTION' ? `-₹${Math.abs(line.amount).toLocaleString()}` : `₹${line.amount.toLocaleString()}`}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-text-muted">Standard calculation summary</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Net */}
              <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <span className="font-bold text-sm text-text-primary">Net Salary Payable</span>
                <span className="font-mono font-bold text-xl text-primary">₹{selectedPayslip.netSalary.toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={() => viewPayslipPdf(selectedPayslip.id)}>
                  <Eye size={14} /> View Document
                </Button>
                <Button variant="primary" onClick={() => downloadPayslipPdf(selectedPayslip.id)}>
                  <Download size={14} /> Download PDF
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
