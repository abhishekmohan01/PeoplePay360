import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const dashboardRouter = Router();

dashboardRouter.use(authenticateJWT);
dashboardRouter.use(requireRoles("PAYROLL_USER", "HR_MANAGER", "ADMIN"));

// Helper to parse date filters
function parsePeriod(periodStr?: string) {
  if (!periodStr) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }
  const parts = periodStr.split("-");
  const year = parseInt(parts[0] || "2026", 10);
  const month = parseInt(parts[1] || "1", 10) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

// GET /api/dashboard/summary - KPI Cards
dashboardRouter.get("/summary", async (req, res, next) => {
  try {
    const { period, companyId, departmentId } = req.query;
    const { start, end } = parsePeriod(period ? String(period) : undefined);

    const payslipFilter: any = {
      periodStart: { gte: start },
      periodEnd: { lte: end },
    };
    if (departmentId) payslipFilter.employee = { departmentId: String(departmentId) };
    if (companyId) payslipFilter.payrun = { companyId: String(companyId) };

    // 1. Payslips in period
    const payslips = await prisma.payslip.findMany({
      where: payslipFilter,
      select: {
        id: true,
        netSalary: true,
        grossSalary: true,
        status: true,
      },
    });

    const totalPayslips = payslips.length;
    const paidPayslips = payslips.filter((p) => p.status === "PAID");
    const pendingPayslips = payslips.filter((p) => p.status !== "PAID");

    const totalNetSalaryPaid = paidPayslips.reduce((sum, p) => sum + Number(p.netSalary), 0);
    const totalGross = payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0);
    const avgSalary = totalPayslips > 0 ? Math.round((totalGross / totalPayslips) * 100) / 100 : 0;

    // 2. Approved Time Off days in period
    const timeOffFilter: any = {
      status: "APPROVED",
      startDate: { lte: end },
      endDate: { gte: start },
    };
    if (departmentId) timeOffFilter.employee = { departmentId: String(departmentId) };

    const approvedLeaves = await prisma.timeOffRequest.findMany({
      where: timeOffFilter,
      select: { duration: true },
    });
    const totalApprovedLeaveDays = approvedLeaves.reduce((sum, l) => sum + Number(l.duration), 0);

    // 3. Attendance health % in period
    const attendanceFilter: any = {
      checkIn: { gte: start, lte: end },
    };
    if (departmentId) attendanceFilter.employee = { departmentId: String(departmentId) };

    const attendances = await prisma.attendance.findMany({
      where: attendanceFilter,
      select: { status: true },
    });
    const totalAttendance = attendances.length;
    const presentCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendanceHealthPct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

    // 4. Warnings count in period
    const warningCount = await prisma.payrollWarning.count({
      where: {
        isResolved: false,
        payrun: {
          periodStart: { gte: start },
          periodEnd: { lte: end },
        },
      },
    });

    return res.json({
      period: { start, end },
      kpis: {
        totalNetSalaryPaid,
        totalPayslips,
        paidPayslipsCount: paidPayslips.length,
        pendingPayslipsCount: pendingPayslips.length,
        avgSalary,
        totalApprovedLeaveDays,
        attendanceHealthPct,
        activeWarningsCount: warningCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/salary-by-department - Bar chart data
dashboardRouter.get("/salary-by-department", async (req, res, next) => {
  try {
    const { period, companyId } = req.query;
    const { start, end } = parsePeriod(period ? String(period) : undefined);

    const payslips = await prisma.payslip.findMany({
      where: {
        periodStart: { gte: start },
        periodEnd: { lte: end },
        ...(companyId ? { payrun: { companyId: String(companyId) } } : {}),
      },
      include: {
        employee: {
          select: {
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const deptMap: Record<string, { departmentName: string; code: string; totalNet: number; totalGross: number; count: number }> = {};

    for (const p of payslips) {
      const d = p.employee.department;
      if (!deptMap[d.id]) {
        deptMap[d.id] = { departmentName: d.name, code: d.code, totalNet: 0, totalGross: 0, count: 0 };
      }
      const entry = deptMap[d.id]!;
      entry.totalNet += Number(p.netSalary);
      entry.totalGross += Number(p.grossSalary);
      entry.count += 1;
    }

    return res.json(Object.values(deptMap));
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/net-salary-trend - Monthly historical trend (last 6 months)
dashboardRouter.get("/net-salary-trend", async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const payslips = await prisma.payslip.findMany({
      where: {
        periodStart: { gte: sixMonthsAgo },
        status: "PAID",
        ...(companyId ? { payrun: { companyId: String(companyId) } } : {}),
      },
      select: {
        periodStart: true,
        netSalary: true,
        grossSalary: true,
      },
    });

    const monthlyMap: Record<string, { month: string; netSalary: number; grossSalary: number; count: number }> = {};

    // Initialize 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("default", { month: "short", year: "numeric" });
      monthlyMap[key] = { month: monthLabel, netSalary: 0, grossSalary: 0, count: 0 };
    }

    for (const p of payslips) {
      const d = new Date(p.periodStart);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].netSalary += Number(p.netSalary);
        monthlyMap[key].grossSalary += Number(p.grossSalary);
        monthlyMap[key].count += 1;
      }
    }

    return res.json(Object.values(monthlyMap));
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/payslip-status - Status distribution
dashboardRouter.get("/payslip-status", async (req, res, next) => {
  try {
    const { period, companyId } = req.query;
    const { start, end } = parsePeriod(period ? String(period) : undefined);

    const payslips = await prisma.payslip.findMany({
      where: {
        periodStart: { gte: start },
        periodEnd: { lte: end },
        ...(companyId ? { payrun: { companyId: String(companyId) } } : {}),
      },
      select: { status: true, warningCount: true },
    });

    const distribution = {
      DRAFT: payslips.filter((p) => p.status === "DRAFT").length,
      COMPUTED: payslips.filter((p) => p.status === "COMPUTED").length,
      VALIDATED: payslips.filter((p) => p.status === "VALIDATED").length,
      PAID: payslips.filter((p) => p.status === "PAID").length,
      withWarnings: payslips.filter((p) => p.warningCount > 0).length,
    };

    return res.json(distribution);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/attendance-overview - Donut chart breakdown
dashboardRouter.get("/attendance-overview", async (req, res, next) => {
  try {
    const { period, companyId, departmentId } = req.query;
    const { start, end } = parsePeriod(period ? String(period) : undefined);

    const where: any = {
      checkIn: { gte: start, lte: end },
    };
    if (departmentId) where.employee = { departmentId: String(departmentId) };
    if (companyId) where.employee = { companyId: String(companyId) };

    const records = await prisma.attendance.findMany({
      where,
      select: { status: true },
    });

    const counts: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EARLY_CHECKOUT: 0,
      MISSING_CHECKOUT: 0,
      CORRECTED: 0,
    };

    for (const r of records) {
      if (counts[r.status] !== undefined) {
        counts[r.status]! += 1;
      }
    }

    return res.json(counts);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/department-overview - Department table
dashboardRouter.get("/department-overview", async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const departments = await prisma.department.findMany({
      where: {
        ...(companyId ? { companyId: String(companyId) } : {}),
        isActive: true,
      },
      include: {
        employees: {
          select: {
            id: true,
            status: true,
            contracts: {
              where: { status: "RUNNING" },
              select: { wage: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const summary = departments.map((d) => {
      const activeEmployees = d.employees.filter((e) => e.status === "ACTIVE");
      const totalMonthlyWage = activeEmployees.reduce((sum, e) => {
        const contract = e.contracts[0];
        return sum + (contract ? Number(contract.wage) : 0);
      }, 0);

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        headcount: activeEmployees.length,
        monthlyWageCost: totalMonthlyWage,
      };
    });

    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/warnings - Unresolved warnings for HR & Payroll
dashboardRouter.get("/warnings", async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const warnings = await prisma.payrollWarning.findMany({
      where: {
        isResolved: false,
        ...(companyId ? { companyId: String(companyId) } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(warnings);
  } catch (err) {
    next(err);
  }
});

