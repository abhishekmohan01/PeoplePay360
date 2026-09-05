export interface DashboardFilters {
  period: string;
  department: string;
  employeeType: string;
  company: string;
}

export interface KpiMetrics {
  totalNetSalaryPaid: string;
  netSalaryTrend: string;
  payslipsGenerated: {
    total: number;
    paid: number;
    pending: number;
  };
  avgSalaryPerEmployee: string;
  approvedTimeOffDays: number;
  attendanceHealth: number;
}

export interface DeptSalary {
  department: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface PayslipStatus {
  paid: number;
  done: number;
  pending: number;
  warning: number;
}

export interface PayrollAlert {
  id: string;
  message: string;
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  overtime: number;
  missingCheckouts: number;
  manualEdits: number;
  coverage: number;
}

export interface TimeOffRow {
  type: string;
  approvedDays: number;
  pending: number;
  remainingBalance: string;
}

export interface DeptRow {
  department: string;
  headcount: number;
  monthlySalary: string;
}

export interface ComprehensiveDashboardData {
  kpis: KpiMetrics;
  salaryByDept: DeptSalary[];
  monthlyTrend: MonthlyTrend[];
  payslipStatus: PayslipStatus;
  alerts: PayrollAlert[];
  attendance: AttendanceStats;
  timeOff: TimeOffRow[];
  departments: DeptRow[];
}

const mockData: ComprehensiveDashboardData = {
  kpis: {
    totalNetSalaryPaid: '18.4L',
    netSalaryTrend: '+8.5%',
    payslipsGenerated: {
      total: 148,
      paid: 142,
      pending: 6
    },
    avgSalaryPerEmployee: '12,432',
    approvedTimeOffDays: 34,
    attendanceHealth: 94
  },
  salaryByDept: [
    { department: 'HR', amount: 110000 },
    { department: 'Sales', amount: 182000 },
    { department: 'Support', amount: 90000 },
    { department: 'Finance', amount: 130000 },
    { department: 'IT', amount: 190000 }
  ],
  monthlyTrend: [
    { month: 'Apr', amount: 120000 },
    { month: 'May', amount: 125000 },
    { month: 'Jun', amount: 110000 },
    { month: 'Jul', amount: 135000 },
    { month: 'Aug', amount: 105000 },
    { month: 'Sep', amount: 115000 }
  ],
  payslipStatus: {
    paid: 60,
    done: 20,
    pending: 15,
    warning: 5
  },
  alerts: [
    { id: '1', message: '2 employees missing bank account' },
    { id: '2', message: '1 duplicate payslip warning' },
    { id: '3', message: '4 drafts still not validated' },
    { id: '4', message: '2 contracts expiring this month' }
  ],
  attendance: {
    present: 90,
    late: 18,
    absent: 9,
    overtime: 2,
    missingCheckouts: 5,
    manualEdits: 7,
    coverage: 94
  },
  timeOff: [
    { type: 'Paid Time Off', approvedDays: 24, pending: 3, remainingBalance: '118 Days' },
    { type: 'Sick Leave', approvedDays: 6, pending: 1, remainingBalance: 'N/A' },
    { type: 'Comp Off', approvedDays: 4, pending: 2, remainingBalance: '11 Days' }
  ],
  departments: [
    { department: 'IT', headcount: 18, monthlySalary: '₹ 4.2L' },
    { department: 'Sales', headcount: 22, monthlySalary: '₹ 5.8L' },
    { department: 'HR', headcount: 5, monthlySalary: '₹ 1.3L' },
    { department: 'Support', headcount: 14, monthlySalary: '₹ 3.1L' }
  ]
};

export async function getComprehensiveDashboardData(filters?: DashboardFilters): Promise<ComprehensiveDashboardData> {
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockData;
}
