import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const departmentRouter = Router();

departmentRouter.use(authenticateJWT);

departmentRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, isActive, includeCounts } = req.query;
    const where: any = {};
    if (companyId) where.companyId = String(companyId);
    if (isActive !== undefined) where.isActive = isActive === "true";

    const departments = await prisma.department.findMany({
      where,
      include: {
        ...(includeCounts === "true"
          ? {
              _count: {
                select: { employees: true, contracts: true },
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return res.json(departments);
  } catch (err) {
    next(err);
  }
});

departmentRouter.get("/:id", async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id as string },
      include: {
        company: true,
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            jobPosition: true,
            status: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: true, message: "Department not found" });
    }

    return res.json(department);
  } catch (err) {
    next(err);
  }
});

departmentRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const { companyId, name, code, isActive } = req.body;
    if (!companyId || !name || !code) {
      return res.status(400).json({ error: true, message: "companyId, name, and code are required" });
    }

    const existing = await prisma.department.findUnique({
      where: { companyId_code: { companyId, code } },
    });
    if (existing) {
      return res.status(400).json({ error: true, message: "Department code already exists in this company" });
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        name,
        code,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json(department);
  } catch (err) {
    next(err);
  }
});

departmentRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const { name, code, isActive } = req.body;
    const department = await prisma.department.update({
      where: { id: req.params.id as string },
      data: { name, code, isActive },
    });
    return res.json(department);
  } catch (err) {
    next(err);
  }
});
