import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { computePayslip } from "../../lib/computePayslip";
import { generatePayslipPdf } from "../../lib/pdfGenerator";

export const payslipRouter = Router();

payslipRouter.use(authenticateJWT);

// GET /api/payslips - list payslips
payslipRouter.get("/", async (req, res, next) => {
  try {
    const { payrunId, employeeId, status } = req.query;
    const where: any = {};

    if (payrunId) where.payrunId = String(payrunId);
    if (employeeId) where.employeeId = String(employeeId);
    if (status) where.status = String(status);

    // If regular EMPLOYEE, can only view own payslips
    if (
      req.user?.roles.includes("EMPLOYEE") &&
      !req.user.roles.includes("ADMIN") &&
      !req.user.roles.includes("PAYROLL_USER") &&
      !req.user.roles.includes("HR_MANAGER") &&
      req.user.employeeId
    ) {
      where.employeeId = req.user.employeeId;
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            jobPosition: true,
            department: { select: { name: true } },
          },
        },
        salaryStructure: { select: { id: true, name: true, code: true } },
        payrun: { select: { id: true, name: true, status: true } },
        warnings: true,
      },
      orderBy: { periodStart: "desc" },
    });

    return res.json(payslips);
  } catch (err) {
    next(err);
  }
});

// GET /api/payslips/:id - full payslip details with lines and warnings
payslipRouter.get("/:id", async (req, res, next) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id as string },
      include: {
        employee: {
          include: {
            department: true,
            company: true,
          },
        },
        contract: true,
        salaryStructure: true,
        payrun: true,
        lines: { orderBy: { sequence: "asc" } },
        warnings: true,
      },
    });

    if (!payslip) {
      return res.status(404).json({ error: true, message: "Payslip not found" });
    }

    // Role check: employee can only see their own payslip
    if (
      req.user?.roles.length === 1 &&
      req.user.roles.includes("EMPLOYEE") &&
      req.user.employeeId !== payslip.employeeId
    ) {
      return res.status(403).json({ error: true, message: "Forbidden: You can only view your own payslips" });
    }

    return res.json(payslip);
  } catch (err) {
    next(err);
  }
});

// POST /api/payslips/:id/compute - recompute single payslip
payslipRouter.post("/:id/compute", requireRoles("PAYROLL_USER", "HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await computePayslip(id);

    const updated = await prisma.payslip.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { sequence: "asc" } },
        warnings: true,
      },
    });

    return res.json({
      success: true,
      summary: result,
      payslip: updated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payslips/:id/mark-paid
payslipRouter.post("/:id/mark-paid", requireRoles("PAYROLL_USER", "HR_MANAGER"), async (req, res, next) => {
  try {
    const updated = await prisma.payslip.update({
      where: { id: req.params.id as string },
      data: { status: "PAID" },
    });
    return res.json({ success: true, payslip: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/payslips/:id/pdf - generate and stream PDF
payslipRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!payslip) {
      return res.status(404).json({ error: true, message: "Payslip not found" });
    }

    if (
      req.user?.roles.length === 1 &&
      req.user.roles.includes("EMPLOYEE") &&
      req.user.employeeId !== payslip.employeeId
    ) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    const pdfBuffer = await generatePayslipPdf(id);

    const fileName = `Payslip_${payslip.employee.employeeCode}_${new Date(payslip.periodStart).toISOString().slice(0, 7)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
