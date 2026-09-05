import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const salaryStructureRouter = Router();

salaryStructureRouter.use(authenticateJWT);
salaryStructureRouter.use(requireRoles("PAYROLL_USER", "HR_MANAGER"));

// GET /api/salary-structures
salaryStructureRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, isActive } = req.query;
    const where: any = {};
    if (companyId) where.companyId = String(companyId);
    if (isActive !== undefined) where.isActive = isActive === "true";

    const structures = await prisma.salaryStructure.findMany({
      where,
      include: {
        _count: {
          select: {
            rules: true,
            contracts: true,
            payruns: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return res.json(structures);
  } catch (err) {
    next(err);
  }
});

// GET /api/salary-structures/:id
salaryStructureRouter.get("/:id", async (req, res, next) => {
  try {
    const structure = await prisma.salaryStructure.findUnique({
      where: { id: req.params.id },
      include: {
        rules: { orderBy: { sequence: "asc" } },
        _count: { select: { contracts: true, payruns: true } },
      },
    });

    if (!structure) {
      return res.status(404).json({ error: true, message: "Salary structure not found" });
    }

    return res.json(structure);
  } catch (err) {
    next(err);
  }
});

// POST /api/salary-structures
salaryStructureRouter.post("/", async (req, res, next) => {
  try {
    let { companyId, name, code, description, isActive } = req.body;

    if (!companyId) {
      const comp = await prisma.company.findFirst();
      companyId = comp?.id;
    }

    if (!name) {
      return res.status(400).json({ error: true, message: "name is required" });
    }

    if (!code) {
      code = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        companyId,
        name,
        code,
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json(structure);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/salary-structures/:id
salaryStructureRouter.patch("/:id", async (req, res, next) => {
  try {
    const { name, code, description, isActive } = req.body;
    const updated = await prisma.salaryStructure.update({
      where: { id: req.params.id },
      data: { name, code, description, isActive },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});
