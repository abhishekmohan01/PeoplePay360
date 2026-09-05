import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "db/client";
import { signJwt } from "../../lib/jwt";
import { authenticateJWT } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
        employee: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: true, message: "Invalid email or account is inactive" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: true, message: "Invalid credentials" });
    }

    const roleCodes = user.roles.map((r) => r.role.code);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      companyId: user.employee?.companyId || null,
      roles: roleCodes,
    };

    const token = signJwt(tokenPayload);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        companyId: user.employee?.companyId || null,
        employeeName: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : null,
        roles: roleCodes,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticateJWT, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        roles: { include: { role: true } },
        employee: {
          include: {
            company: true,
            department: true,
          },
        },
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
      companyId: user.employee?.companyId || null,
      employee: user.employee,
      roles: user.roles.map((r) => r.role.code),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  return res.json({ success: true, message: "Logged out successfully" });
});
