import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const userRouter = Router();

userRouter.use(authenticateJWT);

// GET /api/roles - list all roles
userRouter.get("/roles", async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { code: "asc" },
    });
    return res.json(roles);
  } catch (err) {
    next(err);
  }
});

// All user management routes below require ADMIN
userRouter.use(requireRoles("ADMIN"));

// GET /api/users - list users
userRouter.get("/", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            jobPosition: true,
            department: { select: { id: true, name: true } },
          },
        },
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      status: u.status,
      employeeId: u.employeeId,
      employee: u.employee,
      roles: u.roles.map((r) => r.role),
      createdAt: u.createdAt,
    }));

    return res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

// POST /api/users - create user
userRouter.post("/", async (req, res, next) => {
  try {
    const { email, password, employeeId, roleCodes } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: true, message: "Email is already registered" });
    }

    if (employeeId) {
      const existingEmpUser = await prisma.user.findUnique({ where: { employeeId } });
      if (existingEmpUser) {
        return res.status(400).json({ error: true, message: "Employee is already linked to another user account" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        employeeId: employeeId || null,
        status: "ACTIVE",
      },
    });

    // Assign roles
    if (Array.isArray(roleCodes) && roleCodes.length > 0) {
      const roles = await prisma.role.findMany({
        where: { code: { in: roleCodes } },
      });

      for (const role of roles) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    }

    const created = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employee: true,
        roles: { include: { role: true } },
      },
    });

    return res.status(201).json({
      id: created!.id,
      email: created!.email,
      status: created!.status,
      employeeId: created!.employeeId,
      employee: created!.employee,
      roles: created!.roles.map((r) => r.role),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
userRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        employee: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      status: user.status,
      employeeId: user.employeeId,
      employee: user.employee,
      roles: user.roles.map((r) => r.role),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - update user
userRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, email, password, employeeId } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (email) data.email = email;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (employeeId !== undefined) data.employeeId = employeeId || null;

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        employee: true,
        roles: { include: { role: true } },
      },
    });

    return res.json({
      id: updated.id,
      email: updated.email,
      status: updated.status,
      employeeId: updated.employeeId,
      employee: updated.employee,
      roles: updated.roles.map((r) => r.role),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/roles - assign/update roles
userRouter.patch("/:id/roles", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleCodes } = req.body;

    // Self-elevation restriction: users cannot alter their own roles
    if (req.user?.id === id) {
      return res.status(403).json({ error: true, message: "You cannot modify your own roles" });
    }

    if (!Array.isArray(roleCodes)) {
      return res.status(400).json({ error: true, message: "roleCodes must be an array of role codes" });
    }

    const roles = await prisma.role.findMany({
      where: { code: { in: roleCodes } },
    });

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      for (const role of roles) {
        await tx.userRole.create({
          data: { userId: id, roleId: role.id },
        });
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
      },
    });

    return res.json({
      id: updated!.id,
      roles: updated!.roles.map((r) => r.role),
    });
  } catch (err) {
    next(err);
  }
});
