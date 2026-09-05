import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const companyRouter = Router();

companyRouter.use(authenticateJWT);

companyRouter.get("/", async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            employees: true,
            departments: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.json(companies);
  } catch (err) {
    next(err);
  }
});

companyRouter.get("/:id", async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        departments: true,
        _count: {
          select: {
            employees: true,
            contracts: true,
            payruns: true,
          },
        },
      },
    });
    if (!company) {
      return res.status(404).json({ error: true, message: "Company not found" });
    }
    return res.json(company);
  } catch (err) {
    next(err);
  }
});

companyRouter.post("/", requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const { name, currency, timezone } = req.body;
    if (!name) {
      return res.status(400).json({ error: true, message: "Company name is required" });
    }

    const company = await prisma.company.create({
      data: {
        name,
        currency: currency || "USD",
        timezone: timezone || "UTC",
      },
    });

    return res.status(201).json(company);
  } catch (err) {
    next(err);
  }
});

companyRouter.patch("/:id", requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const { name, currency, timezone, isActive } = req.body;
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        name,
        currency,
        timezone,
        isActive,
      },
    });
    return res.json(company);
  } catch (err) {
    next(err);
  }
});
