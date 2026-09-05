import { usePayrollDashboard } from './usePayroll';
import { Card } from '../../components/ui/Card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export const PayrollDashboardPage = () => {
  const { data, isLoading } = usePayrollDashboard();

  if (isLoading || !data) {
    return <div className="p-8 text-center font-[Caveat] text-xl text-muted">Loading complex dashboard...</div>;
  }

  const { kpis, salaryByDept, monthlyTrend, payslipStatus, alerts, attendance, timeOff, departments } = data;

  return (
    <div className="flex flex-col gap-6 font-primary text-text-primary pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[Caveat] font-bold mb-1">Payroll Dashboard</h1>
        <p className="text-sm text-muted m-0">
          Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-muted font-medium">Period</label>
          <select className="border border-border bg-surface p-1.5 rounded-md text-sm"><option>Sep 2026</option></select>
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-muted font-medium">Department</label>
          <select className="border border-border bg-surface p-1.5 rounded-md text-sm"><option>All Departments</option></select>
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-muted font-medium">Employee Type</label>
          <select className="border border-border bg-surface p-1.5 rounded-md text-sm"><option>All Types</option></select>
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-muted font-medium">Company</label>
          <select className="border border-border bg-surface p-1.5 rounded-md text-sm"><option>ERP Pvt Ltd</option></select>
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs text-muted">Total Net Salary Paid</span>
          <div className="text-2xl font-[Caveat] font-bold mt-1 mb-1">₹ {kpis.totalNetSalaryPaid}</div>
          <span className="text-xs text-success">{kpis.netSalaryTrend} vs previous month</span>
        </Card>
        
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs text-muted">Payslips Generated</span>
          <div className="text-2xl font-[Caveat] font-bold mt-1 mb-1">{kpis.payslipsGenerated.total}</div>
          <span className="text-xs text-muted">{kpis.payslipsGenerated.paid} paid, {kpis.payslipsGenerated.pending} pending</span>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-b-4 border-b-success/40">
          <span className="text-xs text-muted">Avg Salary / Employee</span>
          <div className="text-2xl font-[Caveat] font-bold mt-1 mb-1">₹ {kpis.avgSalaryPerEmployee}</div>
          <span className="text-xs text-success">Based on current payrun</span>
        </Card>

        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs text-muted">Approved Time Off Days</span>
          <div className="text-2xl font-[Caveat] font-bold mt-1 mb-1">{kpis.approvedTimeOffDays} Days</div>
          <span className="text-xs text-muted">Across selected period</span>
        </Card>

        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs text-muted">Attendance Health</span>
          <div className="text-2xl font-[Caveat] font-bold mt-1 mb-1 text-primary">{kpis.attendanceHealth}%</div>
          <span className="text-xs text-muted">Present / reviewed records</span>
        </Card>
      </div>

      {/* Middle Section (Charts & Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <Card className="p-4 flex flex-col h-[280px]">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Salary Cost by Department</h3>
          <span className="text-xs text-muted mb-4">Source: Payslips + Employee Department</span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="department" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--elevated)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
              <Bar dataKey="amount" fill="#93c5fd" radius={[6, 6, 0, 0]}>
                {salaryByDept.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index === 1 || index === 4 ? '#bfdbfe' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line Chart */}
        <Card className="p-4 flex flex-col h-[280px]">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Monthly Net Salary Trend</h3>
          <span className="text-xs text-muted mb-4">Source: Historical Payslips / Payruns</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
              <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--surface)', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status & Alerts */}
        <Card className="p-4 flex flex-col h-[280px]">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Payslip Status & Payroll Alerts</h3>
          <span className="text-xs text-muted mb-4">Source: Payrun + Payslip validation</span>
          
          <div className="flex flex-col gap-2 mb-6">
            <span className="text-xs font-medium">Status split</span>
            <div className="w-full h-6 flex rounded-sm overflow-hidden border border-border/50">
              <div style={{ width: `${payslipStatus.paid}%` }} className="bg-green-300 h-full border-r border-border/20" title="Paid"></div>
              <div style={{ width: `${payslipStatus.done}%` }} className="bg-blue-300 h-full border-r border-border/20" title="Done"></div>
              <div style={{ width: `${payslipStatus.pending}%` }} className="bg-yellow-200 h-full border-r border-border/20" title="Pending"></div>
              <div style={{ width: `${payslipStatus.warning}%` }} className="bg-red-300 h-full" title="Warning"></div>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-xs mt-1">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-300 rounded-sm"></div> Paid</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-300 rounded-sm"></div> Done</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-200 rounded-sm"></div> Pending</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-300 rounded-sm"></div> Warning</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium">Current alerts</span>
            <ul className="m-0 p-0 pl-4 list-disc text-xs flex flex-col gap-1 text-muted">
              {alerts.map((alert, i) => (
                <li key={alert.id} className={i < 2 ? 'text-red-500' : ''}>{alert.message}</li>
              ))}
            </ul>
          </div>
        </Card>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Attendance */}
        <Card className="p-4 flex flex-col gap-1">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Attendance Overview</h3>
          <span className="text-xs text-muted mb-4">Source: Attendance</span>
          
          <div className="flex items-end justify-between h-20 mb-4 px-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 bg-blue-300 rounded-t-md" style={{ height: `${(attendance.present / 100) * 60}px` }}></div>
              <span className="text-xs text-muted">Present</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 bg-blue-300 rounded-t-md" style={{ height: `${(attendance.late / 100) * 60}px` }}></div>
              <span className="text-xs text-muted">Late</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 bg-blue-300 rounded-t-md" style={{ height: `${(attendance.absent / 100) * 60}px` }}></div>
              <span className="text-xs text-muted">Absent</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 bg-blue-300 rounded-t-md" style={{ height: `${(attendance.overtime / 100) * 60}px` }}></div>
              <span className="text-xs text-muted">Overtime</span>
            </div>
          </div>

          <div className="flex flex-col text-xs text-muted gap-1 border-t border-border pt-2">
            <div className="flex justify-between"><span>Missing checkouts:</span> <span>{attendance.missingCheckouts}</span></div>
            <div className="flex justify-between"><span>Manual attendance edits:</span> <span>{attendance.manualEdits}</span></div>
            <div className="flex justify-between"><span>Attendance coverage:</span> <span>{attendance.coverage}%</span></div>
          </div>
        </Card>

        {/* Time Off Overview */}
        <Card className="p-4 flex flex-col gap-1 lg:col-span-1">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Time Off Overview</h3>
          <span className="text-xs text-muted mb-3">Source: Time Off Requests + Allocations</span>
          
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-elevated text-muted">
                <th className="p-1 font-normal border border-border">Type</th>
                <th className="p-1 font-normal border border-border">Approved Days</th>
                <th className="p-1 font-normal border border-border">Pending</th>
                <th className="p-1 font-normal border border-border">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {timeOff.map((row, i) => (
                <tr key={i}>
                  <td className="p-1 border border-border">{row.type}</td>
                  <td className="p-1 border border-border">{row.approvedDays}</td>
                  <td className="p-1 border border-border">{row.pending}</td>
                  <td className="p-1 border border-border">{row.remainingBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Department Overview */}
        <Card className="p-4 flex flex-col gap-1 lg:col-span-1">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Department Overview</h3>
          <span className="text-xs text-muted mb-3">Source: Employee + Contract + Payslip Details</span>
          
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-elevated text-muted">
                <th className="p-1 font-normal border border-border">Department</th>
                <th className="p-1 font-normal border border-border">Headcount</th>
                <th className="p-1 font-normal border border-border">Monthly Salary</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((row, i) => (
                <tr key={i}>
                  <td className="p-1 border border-border">{row.department}</td>
                  <td className="p-1 border border-border">{row.headcount}</td>
                  <td className="p-1 border border-border">{row.monthlySalary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Models To Aggregate */}
        <Card className="p-4 flex flex-col gap-1 text-xs">
          <h3 className="text-lg font-[Caveat] font-bold m-0">Models to Aggregate</h3>
          <span className="text-muted mb-2">This is the actual challenge behind the dashboard.</span>
          <ul className="m-0 pl-4 list-disc text-muted flex flex-col gap-1">
            <li><strong>Emp / Departments</strong> — headcount, ownership, grouping</li>
            <li><strong>Contracts</strong> — active employees</li>
            <li><strong>Payslips / Payruns</strong> — totals, paid vs pending, trend data</li>
            <li><strong>Attendance</strong> — presence, absences, late entries, overtime</li>
            <li><strong>Time Off Requests / Allocations</strong> — leave taken and leave balances</li>
          </ul>
        </Card>

      </div>

    </div>
  );
};
