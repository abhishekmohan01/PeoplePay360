import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const salaryRuleRouter = Router();

salaryRuleRouter.use(authenticateJWT);
salaryRuleRouter.use(requireRoles("PAYROLL_USER", "HR_MANAGER"));

// GET /api/salary-rules
salaryRuleRouter.get("/", async (req, res, next) => {
  try {
    const { salaryStructureId } = req.query;
    const where: any = {};
    if (salaryStructureId) where.salaryStructureId = String(salaryStructureId);

    const rules = await prisma.salaryRule.findMany({
      where,
      orderBy: { sequence: "asc" },
    });

    return res.json(rules);
  } catch (err) {
    next(err);
  }
});

// POST /api/salary-rules
salaryRuleRouter.post("/", async (req, res, next) => {
  try {
    const {
      salaryStructureId,
      name,
      code,
      category,
      sequence,
      computationType,
      computationValue,
      isActive,
    } = req.body;

    if (!salaryStructureId || !name || !code || !category || sequence === undefined || !computationType || computationValue === undefined) {
      return res.status(400).json({ error: true, message: "Missing required salary rule fields" });
    }

    const rule = await prisma.salaryRule.create({
      data: {
        salaryStructureId,
        name,
        code,
        category,
        sequence: Number(sequence),
        computationType,
        computationValue: String(computationValue),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/salary-rules/:id
salaryRuleRouter.patch("/:id", async (req, res, next) => {
  try {
    const { name, code, category, sequence, computationType, computationValue, isActive } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (code) data.code = code;
    if (category) data.category = category;
    if (sequence !== undefined) data.sequence = Number(sequence);
    if (computationType) data.computationType = computationType;
    if (computationValue !== undefined) data.computationValue = String(computationValue);
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.salaryRule.update({
      where: { id: req.params.id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/salary-rules/:id
salaryRuleRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.salaryRule.delete({
      where: { id: req.params.id },
    });
    return res.json({ success: true, message: "Rule deleted" });
  } catch (err) {
    next(err);
  }
});
