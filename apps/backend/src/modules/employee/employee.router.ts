import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const employeeRouter = Router();

employeeRouter.use(authenticateJWT);

// GET /api/employees - list employees with search and filters
employeeRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, departmentId, status, search, limit, offset, includeCounts } = req.query;
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
        ...(includeCounts === "true"
          ? {
              _count: {
                select: {
                  contracts: true,
                  attendances: true,
                  timeOffRequests: true,
                },
              },
            }
          : {}),
      },
      orderBy: { employeeCode: "asc" },
      take: limit !== undefined ? Math.min(Number(limit), 500) : 100,
      skip: offset !== undefined ? Math.max(0, Number(offset)) : 0,
    });

    const isRegularEmployee =
      req.user?.roles.includes("EMPLOYEE") &&
      !req.user.roles.includes("ADMIN") &&
      !req.user.roles.includes("HR_MANAGER") &&
      !req.user.roles.includes("PAYROLL_USER");

    const sanitized = employees.map((emp) => {
      if (isRegularEmployee && emp.id !== req.user?.employeeId) {
        const { contracts, bankAccountNumber, bankName, taxIdentifier, ...publicFields } = emp as any;
        return publicFields;
      }
      return emp;
    });

    return res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

// POST /api/employees - create employee
employeeRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    let {
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

    if (!departmentId || !firstName || !lastName || !jobPosition) {
      return res.status(400).json({ error: true, message: "Missing required employee fields: firstName, lastName, jobPosition, and departmentId" });
    }

    // Auto-resolve companyId from department if not directly provided
    if (!companyId && departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (dept) companyId = dept.companyId;
    }
    if (!companyId) {
      const firstComp = await prisma.company.findFirst();
      if (firstComp) companyId = firstComp.id;
    }

    if (!companyId) {
      return res.status(400).json({ error: true, message: "Unable to associate employee with a company" });
    }

    // Auto-generate employeeCode if omitted
    let targetCode = (employeeCode || '').trim();
    if (!targetCode) {
      const count = await prisma.employee.count({ where: { companyId } });
      targetCode = `EMP-${String(count + 1).padStart(3, '0')}`;
    }

    // Normalize employeeType
    let normalizedType = (employeeType || 'FULL_TIME').toString().toUpperCase().replace(/\s+/g, '_');
    if (!['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].includes(normalizedType)) {
      normalizedType = 'FULL_TIME';
    }

    // Normalize status
    let normalizedStatus = (status || 'ACTIVE').toString().toUpperCase();
    if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(normalizedStatus)) {
      normalizedStatus = 'ACTIVE';
    }

    const existingCode = await prisma.employee.findUnique({
      where: { companyId_employeeCode: { companyId, employeeCode: targetCode } },
    });
    if (existingCode) {
      return res.status(400).json({ error: true, message: `Employee code '${targetCode}' already exists in this company` });
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        departmentId,
        managerId: managerId || null,
        employeeCode: targetCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        workEmail: workEmail?.trim() || null,
        workPhone: workPhone?.trim() || null,
        jobPosition: jobPosition.trim(),
        employeeType: normalizedType as any,
        status: normalizedStatus as any,
        bankAccountNumber: bankAccountNumber?.trim() || null,
        bankName: bankName?.trim() || null,
        bankIdentifierCode: bankIdentifierCode?.trim() || null,
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
    const id = req.params.id as string;
    if (!id || id === 'new') {
      return res.status(404).json({ error: true, message: "Employee not found" });
    }
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
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roles: {
              include: {
                role: true,
              },
            },
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

    const isRegularEmployee =
      req.user?.roles.includes("EMPLOYEE") &&
      !req.user.roles.includes("ADMIN") &&
      !req.user.roles.includes("HR_MANAGER") &&
      !req.user.roles.includes("PAYROLL_USER");

    if (isRegularEmployee && employee.id !== req.user?.employeeId) {
      // Strip sensitive PII, financial details, and admin contracts for colleagues
      const {
        bankAccountNumber,
        bankName,
        taxIdentifier,
        privateEmail,
        privatePhone,
        contracts,
        user,
        _count,
        ...publicProfile
      } = employee as any;

      return res.json({
        ...publicProfile,
        isPublicViewOnly: true,
      });
    }

    return res.json(employee);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/employees/:id - update employee
employeeRouter.patch("/:id", requireRoles("HR_MANAGER", "ADMIN"), async (req, res, next) => {
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

    let normalizedType: any = undefined;
    if (employeeType) {
      normalizedType = employeeType.toString().toUpperCase().replace(/\s+/g, '_');
      if (!['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].includes(normalizedType)) {
        normalizedType = 'FULL_TIME';
      }
    }

    let normalizedStatus: any = undefined;
    if (status) {
      normalizedStatus = status.toString().toUpperCase();
      if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(normalizedStatus)) {
        normalizedStatus = 'ACTIVE';
      }
    }

    const updateData: any = {};
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (managerId !== undefined) updateData.managerId = managerId || null;
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (workEmail !== undefined) updateData.workEmail = workEmail?.trim() || null;
    if (workPhone !== undefined) updateData.workPhone = workPhone?.trim() || null;
    if (jobPosition !== undefined) updateData.jobPosition = jobPosition.trim();
    if (normalizedType !== undefined) updateData.employeeType = normalizedType;
    if (normalizedStatus !== undefined) updateData.status = normalizedStatus;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber?.trim() || null;
    if (bankName !== undefined) updateData.bankName = bankName?.trim() || null;
    if (bankIdentifierCode !== undefined) updateData.bankIdentifierCode = bankIdentifierCode?.trim() || null;

    const updated = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        department: true,
        company: true,
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
