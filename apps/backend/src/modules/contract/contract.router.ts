import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const contractRouter = Router();

contractRouter.use(authenticateJWT);

// GET /api/contracts
contractRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, employeeId, departmentId, status } = req.query;
    const where: any = {};

    if (companyId) where.companyId = String(companyId);
    if (employeeId) where.employeeId = String(employeeId);
    if (departmentId) where.departmentId = String(departmentId);
    if (status) where.status = String(status);

    // If regular EMPLOYEE, can only view own contracts
    if (req.user?.roles.includes("EMPLOYEE") && !req.user.roles.includes("ADMIN") && !req.user.roles.includes("HR_MANAGER") && !req.user.roles.includes("PAYROLL_USER") && req.user.employeeId) {
      where.employeeId = req.user.employeeId;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        department: { select: { id: true, name: true } },
        salaryStructure: { select: { id: true, name: true, code: true } },
        workingSchedule: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(contracts);
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts - create contract
contractRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const {
      companyId,
      employeeId,
      departmentId,
      startDate,
      endDate,
      wage,
      jobPosition,
      contractType,
      workingScheduleId,
      salaryStructureId,
      status,
    } = req.body;

    let targetCompanyId = companyId || req.user?.companyId;
    let targetDepartmentId = departmentId;
    let targetScheduleId = workingScheduleId;
    let targetStructureId = salaryStructureId;

    if (employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { companyId: true, departmentId: true },
      });
      if (emp) {
        if (!targetCompanyId) targetCompanyId = emp.companyId;
        if (!targetDepartmentId) targetDepartmentId = emp.departmentId;
      }
    }

    if (!targetCompanyId) {
      const comp = await prisma.company.findFirst();
      if (comp) targetCompanyId = comp.id;
    }
    if (!targetDepartmentId) {
      const dept = await prisma.department.findFirst();
      if (dept) targetDepartmentId = dept.id;
    }
    if (!targetScheduleId) {
      const sched = await prisma.workingSchedule.findFirst();
      if (sched) targetScheduleId = sched.id;
    }
    if (!targetStructureId) {
      const struct = await prisma.salaryStructure.findFirst();
      if (struct) targetStructureId = struct.id;
    }

    if (!targetCompanyId || !employeeId || !targetDepartmentId || !startDate || !wage || !targetScheduleId || !targetStructureId) {
      return res.status(400).json({ error: true, message: "Missing required contract fields: employee, startDate, wage" });
    }

    const contractStatus = status || "RUNNING";

    // Business rule: Only one RUNNING contract per employee at a time
    if (contractStatus === "RUNNING") {
      const existingRunning = await prisma.contract.findFirst({
        where: {
          employeeId,
          status: "RUNNING",
        },
      });

      if (existingRunning) {
        return res.status(400).json({
          error: true,
          message: `Employee already has an active RUNNING contract (${existingRunning.contractNumber}). Please terminate or expire the existing contract first.`,
        });
      }
    }

    // Auto-generate contract number CON/YYYY/XXXX
    const currentYear = new Date(startDate).getFullYear();
    const countThisYear = await prisma.contract.count({
      where: {
        companyId,
        contractNumber: { startsWith: `CON/${currentYear}/` },
      },
    });
    const seq = String(countThisYear + 1).padStart(4, "0");
    const contractNumber = req.body.contractNumber || `CON/${currentYear}/${seq}`;

    const contract = await prisma.contract.create({
      data: {
        companyId: targetCompanyId,
        employeeId,
        departmentId: targetDepartmentId,
        contractNumber,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        wage: Number(wage),
        jobPosition: jobPosition || "Staff",
        contractType: contractType || "Full-Time",
        workingScheduleId: targetScheduleId,
        salaryStructureId: targetStructureId,
        status: contractStatus,
      },
      include: {
        employee: true,
        department: true,
        salaryStructure: true,
        workingSchedule: true,
      },
    });

    return res.status(201).json(contract);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/:id
contractRouter.get("/:id", async (req, res, next) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id as string },
      include: {
        employee: true,
        department: true,
        company: true,
        salaryStructure: {
          include: {
            rules: { orderBy: { sequence: "asc" } },
          },
        },
        workingSchedule: {
          include: {
            days: { orderBy: { dayOfWeek: "asc" } },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: true, message: "Contract not found" });
    }

    // Role check: employee can only see their own contract
    if (
      req.user?.roles.includes("EMPLOYEE") &&
      !req.user.roles.includes("ADMIN") &&
      !req.user.roles.includes("HR_MANAGER") &&
      !req.user.roles.includes("PAYROLL_USER") &&
      req.user.employeeId !== contract.employeeId
    ) {
      return res.status(403).json({ error: true, message: "Forbidden: You can only view your own contract" });
    }

    return res.json(contract);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/contracts/:id
contractRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const {
      departmentId,
      startDate,
      endDate,
      wage,
      jobPosition,
      contractType,
      workingScheduleId,
      salaryStructureId,
      status,
    } = req.body;

    const current = await prisma.contract.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: true, message: "Contract not found" });
    }

    if (status === "RUNNING" && current.status !== "RUNNING") {
      const activeOther = await prisma.contract.findFirst({
        where: {
          employeeId: current.employeeId,
          status: "RUNNING",
          id: { not: id },
        },
      });
      if (activeOther) {
        return res.status(400).json({
          error: true,
          message: `Employee already has a RUNNING contract (${activeOther.contractNumber}).`,
        });
      }
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        departmentId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        wage: wage !== undefined ? Number(wage) : undefined,
        jobPosition,
        contractType,
        workingScheduleId,
        salaryStructureId,
        status,
      },
      include: {
        employee: true,
        department: true,
        salaryStructure: true,
        workingSchedule: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});
