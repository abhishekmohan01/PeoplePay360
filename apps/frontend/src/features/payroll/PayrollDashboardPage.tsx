import { useNavigate } from 'react-router-dom';
import { usePayrollDashboard } from './usePayroll';
import { Card } from '../../components/ui/Card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, FileCheck, Users, Calendar, Activity } from 'lucide-react';

export const PayrollDashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = usePayrollDashboard();

  if (isLoading || !data) {
    return <div className="p-12 text-center text-text-muted text-sm font-medium">Loading payroll analytics...</div>;
  }

  const { kpis, salaryByDept, monthlyTrend, payslipStatus, alerts, attendance, timeOff, departments } = data;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary m-0 mb-1">
            Payroll & Workforce Analytics
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary m-0">
            Real-time executive metrics for compensation, department allocations, and compliance health
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <select className="border border-border bg-surface text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:border-primary">
            <option>Period: Current Month</option>
          </select>
          <select className="border border-border bg-surface text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:border-primary">
            <option>All Departments</option>
          </select>
        </div>
      </div>

      {/* 5 Executive KPI Cards (Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => navigate('/payroll/payruns')}
          role="button"
          tabIndex={0}
          title="Click to view payrun batches"
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Net Disbursed</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
              ₹{kpis.totalNetSalaryPaid}
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-500">
            {kpis.netSalaryTrend} vs prior month ➔
          </span>
        </div>
        
        <div 
          onClick={() => navigate('/payroll/payruns')}
          role="button"
          tabIndex={0}
          title="Click to process payrun batches"
          className="bg-surface border border-border hover:border-emerald-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Payslips Batch</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
              {kpis.payslipsGenerated.total}
            </div>
          </div>
          <span className="text-[11px] text-text-secondary">
            {kpis.payslipsGenerated.paid} paid • {kpis.payslipsGenerated.pending} pending ➔
          </span>
        </div>

        <div 
          onClick={() => navigate('/contracts')}
          role="button"
          tabIndex={0}
          title="Click to view all compensation contracts"
          className="bg-surface border border-border hover:border-indigo-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Avg Monthly Wage</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
              ₹{kpis.avgSalaryPerEmployee}
            </div>
          </div>
          <span className="text-[11px] text-text-secondary">Across full-time staff ➔</span>
        </div>

        <div 
          onClick={() => navigate('/time-off')}
          role="button"
          tabIndex={0}
          title="Click to view time off requests"
          className="bg-surface border border-border hover:border-amber-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Time Off Taken</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
              {kpis.approvedTimeOffDays} Days
            </div>
          </div>
          <span className="text-[11px] text-text-secondary">Approved leaves this cycle ➔</span>
        </div>

        <div 
          onClick={() => navigate('/attendance')}
          role="button"
          tabIndex={0}
          title="Click to view attendance records"
          className="bg-surface border border-border hover:border-emerald-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Attendance Health</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-heading font-bold text-primary">
              {kpis.attendanceHealth}%
            </div>
          </div>
          <span className="text-[11px] text-text-secondary">Present & verified records ➔</span>
        </div>
      </div>

      {/* Middle Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Salary Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col h-[300px]">
          <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Salary Cost by Department</h3>
          <span className="text-xs text-text-muted mb-4">Aggregated from active contracts and department rolls</span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryByDept} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="department" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--elevated)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                {salaryByDept.map((_, index) => (
                   <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Net Salary Trend */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col h-[300px]">
          <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Monthly Compensation Trend</h3>
          <span className="text-xs text-text-muted mb-4">Historical disbursement progression</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--surface)', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payslip Status Split & Alerts */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Status Split & Alerts</h3>
            <span className="text-xs text-text-muted mb-4 block">Active cycle validation checks</span>
            
            <div className="flex flex-col gap-2 mb-4">
              <div className="w-full h-3 flex rounded-full overflow-hidden border border-border">
                <div style={{ width: `${payslipStatus.paid}%` }} className="bg-emerald-500 h-full" title="Paid"></div>
                <div style={{ width: `${payslipStatus.done}%` }} className="bg-primary h-full" title="Done"></div>
                <div style={{ width: `${payslipStatus.pending}%` }} className="bg-amber-400 h-full" title="Pending"></div>
                <div style={{ width: `${payslipStatus.warning}%` }} className="bg-red-400 h-full" title="Warning"></div>
              </div>
              <div className="flex flex-wrap justify-between text-[11px] text-text-secondary mt-1">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Paid ({payslipStatus.paid}%)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full"></div> Done ({payslipStatus.done}%)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full"></div> Pending ({payslipStatus.pending}%)</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <span className="text-xs font-semibold text-text-primary block mb-2">Compliance Warnings</span>
            <ul className="m-0 p-0 pl-4 list-disc text-xs flex flex-col gap-1 text-text-secondary">
              {alerts.map((alert, i) => (
                <li key={alert.id} className={i === 0 ? 'text-amber-500 font-medium' : ''}>
                  {alert.message}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Bottom Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Breakdown */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Punch Quality</h3>
            <span className="text-xs text-text-muted mb-3 block">Presence versus exceptions</span>
            
            <div className="flex justify-between items-end h-20 mb-4 px-4 bg-elevated/40 rounded-lg p-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 bg-emerald-500 rounded-t" style={{ height: `${(attendance.present / 100) * 50}px` }}></div>
                <span className="text-[10px] text-text-muted">Present</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 bg-amber-400 rounded-t" style={{ height: `${(attendance.late / 100) * 50}px` }}></div>
                <span className="text-[10px] text-text-muted">Late</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 bg-red-400 rounded-t" style={{ height: `${(attendance.absent / 100) * 50}px` }}></div>
                <span className="text-[10px] text-text-muted">Absent</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 bg-primary rounded-t" style={{ height: `${(attendance.overtime / 100) * 50}px` }}></div>
                <span className="text-[10px] text-text-muted">Overtime</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col text-xs text-text-secondary gap-1.5 border-t border-border pt-3">
            <div className="flex justify-between"><span>Missing checkouts:</span> <span className="font-semibold text-text-primary">{attendance.missingCheckouts}</span></div>
            <div className="flex justify-between"><span>Manual HR edits:</span> <span className="font-semibold text-text-primary">{attendance.manualEdits}</span></div>
            <div className="flex justify-between"><span>Attendance coverage:</span> <span className="font-semibold text-emerald-500">{attendance.coverage}%</span></div>
          </div>
        </div>

        {/* Time Off Balance Summary Table */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Leave Type Usage</h3>
          <span className="text-xs text-text-muted mb-3 block">Approved versus pending allocations</span>
          
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Type</th>
                <th>Approved</th>
                <th>Pending</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {timeOff.map((row, i) => (
                <tr key={i}>
                  <td className="font-medium text-text-primary">{row.type}</td>
                  <td className="text-text-secondary text-sm">{row.approvedDays}d</td>
                  <td className="text-amber-500 text-sm">{row.pending}d</td>
                  <td className="font-semibold text-emerald-500 text-sm">{row.remainingBalance}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Department Headcount & Cost */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-sm font-heading font-semibold text-text-primary m-0">Department Roll</h3>
          <span className="text-xs text-text-muted mb-3 block">Headcount & monthly run-rate</span>
          
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Department</th>
                <th>Headcount</th>
                <th>Monthly Run</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((row, i) => (
                <tr key={i}>
                  <td className="font-medium text-text-primary">{row.department}</td>
                  <td className="text-text-secondary text-sm">{row.headcount}</td>
                  <td className="font-semibold text-text-primary text-sm">{row.monthlySalary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
