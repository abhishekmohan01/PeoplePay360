import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const employeeRouter = Router();

employeeRouter.use(authenticateJWT);

// GET /api/employees - list employees with search and filters
employeeRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, departmentId, status, search } = req.query;
    const where: any = {};

    if (companyId) where.companyId = String(companyId);
    if (departmentId) where.departmentId = String(departmentId);
    if (status) where.status = String(status);

    if (search) {
      const q = String(search);
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { employeeCode: { contains: q, mode: "insensitive" } },
        { workEmail: { contains: q, mode: "insensitive" } },
        { jobPosition: { contains: q, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        contracts: {
          where: { status: "RUNNING" },
          take: 1,
          select: { id: true, contractNumber: true, wage: true, status: true },
        },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            timeOffRequests: true,
            payslips: true,
          },
        },
      },
      orderBy: { employeeCode: "asc" },
    });

    return res.json(employees);
  } catch (err) {
    next(err);
  }
});

// POST /api/employees - create employee
employeeRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const {
      companyId,
      departmentId,
      managerId,
      employeeCode,
      firstName,
      lastName,
      workEmail,
      workPhone,
      jobPosition,
      employeeType,
      status,
      bankAccountNumber,
      bankName,
      bankIdentifierCode,
    } = req.body;

    if (!companyId || !departmentId || !employeeCode || !firstName || !lastName || !jobPosition || !employeeType) {
      return res.status(400).json({ error: true, message: "Missing required employee fields" });
    }

    const existingCode = await prisma.employee.findUnique({
      where: { companyId_employeeCode: { companyId, employeeCode } },
    });
    if (existingCode) {
      return res.status(400).json({ error: true, message: "Employee code already exists in this company" });
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        departmentId,
        managerId: managerId || null,
        employeeCode,
        firstName,
        lastName,
        workEmail,
        workPhone,
        jobPosition,
        employeeType,
        status: status || "ACTIVE",
        bankAccountNumber,
        bankName,
        bankIdentifierCode,
      },
      include: {
        department: true,
        manager: true,
      },
    });

    return res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/:id - full employee detail with smart button counts
employeeRouter.get("/:id", async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id as string },
      include: {
        company: true,
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: true },
        },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: true },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          include: {
            salaryStructure: { select: { id: true, name: true, code: true } },
            workingSchedule: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            timeOffRequests: true,
            timeOffAllocations: true,
            payslips: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: true, message: "Employee not found" });
    }

    return res.json(employee);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/employees/:id - update employee
employeeRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const {
      departmentId,
      managerId,
      firstName,
      lastName,
      workEmail,
      workPhone,
      jobPosition,
      employeeType,
      status,
      bankAccountNumber,
      bankName,
      bankIdentifierCode,
    } = req.body;

    const updated = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: {
        departmentId,
        managerId: managerId !== undefined ? managerId : undefined,
        firstName,
        lastName,
        workEmail,
        workPhone,
        jobPosition,
        employeeType,
        status,
        bankAccountNumber,
        bankName,
        bankIdentifierCode,
      },
      include: {
        department: true,
        manager: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Smart button related data routes
employeeRouter.get("/:id/contracts", async (req, res, next) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: { employeeId: req.params.id as string },
      include: {
        workingSchedule: true,
        salaryStructure: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(contracts);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/attendance", async (req, res, next) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: { employeeId: req.params.id as string },
      orderBy: { checkIn: "desc" },
      take: 50,
    });
    return res.json(attendances);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/time-off", async (req, res, next) => {
  try {
    const requests = await prisma.timeOffRequest.findMany({
      where: { employeeId: req.params.id as string },
      include: { timeOffType: true },
      orderBy: { startDate: "desc" },
    });
    return res.json(requests);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/allocations", async (req, res, next) => {
  try {
    const allocations = await prisma.timeOffAllocation.findMany({
      where: { employeeId: req.params.id as string },
      include: { timeOffType: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(allocations);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id/payslips", async (req, res, next) => {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employeeId: req.params.id as string },
      include: { payrun: true, salaryStructure: true },
      orderBy: { periodStart: "desc" },
    });
    return res.json(payslips);
  } catch (err) {
    next(err);
  }
});
