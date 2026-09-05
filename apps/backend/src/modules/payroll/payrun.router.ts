import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { computePayslip } from "../../lib/computePayslip";

export const payrunRouter = Router();

payrunRouter.use(authenticateJWT);
payrunRouter.use(requireRoles("PAYROLL_USER", "HR_MANAGER"));

// Step 1: GET /api/payruns/eligible-employees
payrunRouter.get("/eligible-employees", async (req, res, next) => {
  try {
    const { salaryStructureId, periodStart, periodEnd, companyId } = req.query;

    if (!salaryStructureId || !periodStart || !periodEnd) {
      return res.status(400).json({
        error: true,
        message: "salaryStructureId, periodStart, and periodEnd are required",
      });
    }

    const pStart = new Date(String(periodStart));
    const pEnd = new Date(String(periodEnd));

    // Find all employees with an active RUNNING contract for this salary structure
    const contracts = await prisma.contract.findMany({
      where: {
        salaryStructureId: String(salaryStructureId),
        status: "RUNNING",
        startDate: { lte: pEnd },
        OR: [{ endDate: null }, { endDate: { gte: pStart } }],
        ...(companyId ? { companyId: String(companyId) } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            jobPosition: true,
            bankAccountNumber: true,
            department: { select: { id: true, name: true } },
          },
        },
        workingSchedule: {
          select: { id: true, name: true, hoursPerWeek: true, daysPerWeek: true },
        },
      },
      orderBy: { employee: { employeeCode: "asc" } },
    });

    const eligible = contracts.map((c) => ({
      contractId: c.id,
      contractNumber: c.contractNumber,
      wage: c.wage,
      startDate: c.startDate,
      endDate: c.endDate,
      employee: c.employee,
      workingSchedule: c.workingSchedule,
    }));

    return res.json(eligible);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns - list payruns
payrunRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, status } = req.query;
    const where: any = {};
    if (companyId) where.companyId = String(companyId);
    if (status) where.status = String(status);

    const payruns = await prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            payslips: true,
            warnings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(payruns);
  } catch (err) {
    next(err);
  }
});

// Step 2: POST /api/payruns - create payrun with selected employees
payrunRouter.post("/", async (req, res, next) => {
  try {
    const { companyId, salaryStructureId, name, periodStart, periodEnd, employeeIds } = req.body;

    if (!companyId || !salaryStructureId || !name || !periodStart || !periodEnd) {
      return res.status(400).json({ error: true, message: "Missing required payrun parameters" });
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: true, message: "At least one employee must be selected" });
    }

    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);

    // Check duplicate payrun for company + structure + period
    const existing = await prisma.payrun.findUnique({
      where: {
        companyId_periodStart_periodEnd_salaryStructureId: {
          companyId,
          salaryStructureId,
          periodStart: pStart,
          periodEnd: pEnd,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: true,
        message: "A payrun for this company, salary structure, and date period already exists",
      });
    }

    // Find active running contracts for the selected employees
    const contracts = await prisma.contract.findMany({
      where: {
        employeeId: { in: employeeIds },
        salaryStructureId,
        status: "RUNNING",
      },
    });

    const contractMap = new Map(contracts.map((c) => [c.employeeId, c]));

    const result = await prisma.$transaction(async (tx) => {
      const payrun = await tx.payrun.create({
        data: {
          companyId,
          salaryStructureId,
          name,
          periodStart: pStart,
          periodEnd: pEnd,
          status: "DRAFT",
          employeeCount: employeeIds.length,
          warningCount: 0,
        },
      });

      for (const empId of employeeIds) {
        await tx.payrunEmployee.create({
          data: {
            payrunId: payrun.id,
            employeeId: empId,
          },
        });

        const contract = contractMap.get(empId);
        if (contract) {
          await tx.payslip.create({
            data: {
              payrunId: payrun.id,
              employeeId: empId,
              contractId: contract.id,
              salaryStructureId,
              periodStart: pStart,
              periodEnd: pEnd,
              basicSalary: 0,
              grossSalary: 0,
              totalDeductions: 0,
              netSalary: 0,
              status: "DRAFT",
            },
          });
        }
      }

      return payrun;
    });

    const created = await prisma.payrun.findUnique({
      where: { id: result.id },
      include: {
        salaryStructure: true,
        payslips: { include: { employee: true } },
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns/:id - full payrun detail with embedded payslips and warnings
payrunRouter.get("/:id", async (req, res, next) => {
  try {
    const payrun = await prisma.payrun.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        salaryStructure: {
          include: { rules: { orderBy: { sequence: "asc" } } },
        },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                bankAccountNumber: true,
                department: { select: { name: true } },
              },
            },
            warnings: true,
          },
          orderBy: { employee: { employeeCode: "asc" } },
        },
        warnings: {
          include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
        },
      },
    });

    if (!payrun) {
      return res.status(404).json({ error: true, message: "Payrun not found" });
    }

    return res.json(payrun);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/compute - compute all payslips in payrun
payrunRouter.post("/:id/compute", async (req, res, next) => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: { payslips: true },
    });

    if (!payrun) {
      return res.status(404).json({ error: true, message: "Payrun not found" });
    }

    if (payrun.status === "PAID") {
      return res.status(400).json({ error: true, message: "Cannot recompute a PAID payrun" });
    }

    let totalWarnings = 0;

    for (const payslip of payrun.payslips) {
      const result = await computePayslip(payslip.id);
      totalWarnings += result.warningCount;
    }

    const updated = await prisma.payrun.update({
      where: { id },
      data: {
        status: "COMPUTED",
        warningCount: totalWarnings,
        computedAt: new Date(),
      },
      include: {
        payslips: {
          include: {
            employee: true,
            lines: true,
            warnings: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: `Computed ${payrun.payslips.length} payslips with ${totalWarnings} warnings`,
      payrun: updated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/validate - validate and lock payrun
payrunRouter.post("/:id/validate", async (req, res, next) => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({ where: { id } });
    if (!payrun) {
      return res.status(404).json({ error: true, message: "Payrun not found" });
    }

    if (payrun.status === "PAID") {
      return res.status(400).json({ error: true, message: "Payrun is already PAID" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrunId: id },
        data: { status: "VALIDATED" },
      });

      return await tx.payrun.update({
        where: { id },
        data: {
          status: "VALIDATED",
          validatedAt: new Date(),
        },
      });
    });

    return res.json({ success: true, message: "Payrun validated successfully", payrun: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/mark-paid - finalize and mark PAID
payrunRouter.post("/:id/mark-paid", async (req, res, next) => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({ where: { id } });
    if (!payrun) {
      return res.status(404).json({ error: true, message: "Payrun not found" });
    }

    if (payrun.status === "PAID") {
      return res.status(400).json({ error: true, message: "Payrun is already marked as PAID" });
    }

    const paidAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrunId: id },
        data: { status: "PAID" },
      });

      return await tx.payrun.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt,
        },
      });
    });

    return res.json({ success: true, message: "Payrun finalized and marked as PAID", payrun: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/send-payslips - bulk send payslips confirmation
payrunRouter.post("/:id/send-payslips", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: { _count: { select: { payslips: true } } },
    });

    if (!payrun) {
      return res.status(404).json({ error: true, message: "Payrun not found" });
    }

    return res.json({
      success: true,
      message: `Payslips queued for delivery to ${payrun._count.payslips} employees`,
    });
  } catch (err) {
    next(err);
  }
});
