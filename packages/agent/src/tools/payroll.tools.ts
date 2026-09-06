import { prisma } from "db/client";
import type { PayrollPreflightCheck } from "../types";

/**
 * Runs a pre-flight readiness audit before generating payroll
 */
export async function runPayrollPreflight(params?: {
  companyId?: string;
  month?: number;
  year?: number;
}): Promise<PayrollPreflightCheck> {
  const now = new Date();
  const year = params?.year || now.getFullYear();
  const month = params?.month || now.getMonth() + 1;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const whereCompany = params?.companyId ? { companyId: params.companyId } : {};

  // 1. Total active employees
  const activeEmployees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      ...whereCompany,
    },
    select: { id: true, firstName: true, lastName: true },
  });

  // 2. Missing checkouts from prior days (open check-ins older than 24h or status MISSING_CHECKOUT)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const missingCheckouts = await prisma.attendance.findMany({
    where: {
      checkIn: { gte: startOfMonth, lt: todayStart },
      checkOut: null,
      ...(params?.companyId ? { employee: { companyId: params.companyId } } : {}),
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  // 3. Unresolved WFH/Attendance warnings
  const pendingWfhWarnings = await prisma.payrollWarning.findMany({
    where: {
      type: "OTHER",
      message: { contains: "Remote Attendance" },
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      ...whereCompany,
    },
  });

  // 4. Contracts expiring within 30 days
  const expiringContracts = await prisma.contract.findMany({
    where: {
      status: "RUNNING",
      endDate: {
        gte: todayStart,
        lte: next30Days,
      },
      ...whereCompany,
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  // 5. Pending Time-Off Requests requiring manager action
  const pendingLeaves = await prisma.timeOffRequest.findMany({
    where: {
      status: "SUBMITTED",
      startDate: { lte: endOfMonth },
      endDate: { gte: startOfMonth },
      ...(params?.companyId ? { employee: { companyId: params.companyId } } : {}),
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      timeOffType: { select: { name: true } },
    },
  });

  // Calculate score & blockers
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendedActions: string[] = [];

  let readinessScore = 100;

  if (missingCheckouts.length > 0) {
    readinessScore -= Math.min(30, missingCheckouts.length * 10);
    blockers.push(
      `${missingCheckouts.length} attendance record(s) with missing check-outs before today (${missingCheckouts
        .slice(0, 3)
        .map((m) => `${m.employee.firstName} on ${m.checkIn.toLocaleDateString()}`)
        .join(", ")}${missingCheckouts.length > 3 ? "..." : ""}).`
    );
    recommendedActions.push("Auto-close stale open attendance records with standard 8-hour duration.");
  }

  if (pendingWfhWarnings.length > 0) {
    readinessScore -= Math.min(20, pendingWfhWarnings.length * 5);
    warnings.push(`${pendingWfhWarnings.length} unapproved WFH attendance review warning(s) pending for HR.`);
    recommendedActions.push("Batch-approve verified remote check-ins using Agentic Geofence Audit.");
  }

  if (pendingLeaves.length > 0) {
    readinessScore -= Math.min(20, pendingLeaves.length * 5);
    warnings.push(
      `${pendingLeaves.length} time-off request(s) submitted but unapproved for this pay period.`
    );
    recommendedActions.push("Approve or refuse pending leave requests to guarantee accurate salary deductions.");
  }

  if (expiringContracts.length > 0) {
    warnings.push(
      `${expiringContracts.length} contract(s) expiring within the next 30 days (${expiringContracts
        .map((c) => `${c.employee.firstName} ${c.employee.lastName}`)
        .join(", ")}).`
    );
  }

  readinessScore = Math.max(0, Math.min(100, readinessScore));

  let status: "READY" | "WARNING" | "BLOCKED" = "READY";
  if (blockers.length > 0 || readinessScore < 70) status = "BLOCKED";
  else if (warnings.length > 0 || readinessScore < 95) status = "WARNING";

  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    readinessScore,
    status,
    summary: {
      totalActiveEmployees: activeEmployees.length,
      unresolvedAttendanceGaps: missingCheckouts.length,
      unapprovedWfhWarnings: pendingWfhWarnings.length,
      expiringContractsCount: expiringContracts.length,
      pendingTimeOffRequests: pendingLeaves.length,
    },
    blockers,
    warnings,
    recommendedActions,
  };
}
