import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const timeOffRouter = Router();

timeOffRouter.use(authenticateJWT);

// ==========================================
// 1. Time Off Types
// ==========================================

// GET /api/time-off/types
timeOffRouter.get("/types", async (req, res, next) => {
  try {
    const { companyId, isActive } = req.query;
    const where: any = {};
    const targetCompanyId = companyId ? String(companyId) : req.user?.companyId;
    if (targetCompanyId) where.companyId = targetCompanyId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    // Self-healing update: ensure Sick Leave aligns with context.md (requiresAllocation: false)
    await prisma.timeOffType.updateMany({
      where: { name: "Sick Leave", requiresAllocation: true },
      data: { requiresAllocation: false },
    });

    const types = await prisma.timeOffType.findMany({
      where,
      include: {
        _count: { select: { requests: true, allocations: true } },
      },
      orderBy: { name: "asc" },
    });

    return res.json(types);
  } catch (err) {
    next(err);
  }
});

// POST /api/time-off/types
timeOffRouter.post("/types", requireRoles("TIME_OFF_ADMIN", "HR_MANAGER"), async (req, res, next) => {
  try {
    const {
      companyId,
      name,
      unit,
      requiresAllocation,
      approvalRequired,
      payrollWorkEntry,
      displayColor,
      configurationNotes,
    } = req.body;

    const targetCompanyId = companyId || req.user?.companyId;

    if (!targetCompanyId || !name || !unit) {
      return res.status(400).json({ error: true, message: "companyId, name, and unit are required" });
    }

    const created = await prisma.timeOffType.create({
      data: {
        companyId: targetCompanyId,
        name: name.trim(),
        unit,
        requiresAllocation: requiresAllocation !== undefined ? requiresAllocation : true,
        approvalRequired: approvalRequired !== undefined ? approvalRequired : true,
        payrollWorkEntry: payrollWorkEntry !== undefined ? payrollWorkEntry : false,
        displayColor: displayColor || "#3B82F6",
        configurationNotes,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/time-off/types/:id
timeOffRouter.patch("/types/:id", requireRoles("TIME_OFF_ADMIN", "HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { name, unit, requiresAllocation, approvalRequired, payrollWorkEntry, displayColor, configurationNotes, isActive } = req.body;

    const updated = await prisma.timeOffType.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        unit,
        requiresAllocation,
        approvalRequired,
        payrollWorkEntry,
        displayColor,
        configurationNotes,
        isActive,
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. Time Off Allocations
// ==========================================

// GET /api/time-off/allocations
timeOffRouter.get("/allocations", async (req, res, next) => {
  try {
    const { employeeId, timeOffTypeId, status } = req.query;
    const where: any = {};

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));

    if (!isPrivileged) {
      // Non-privileged users (e.g. regular EMPLOYEE) can strictly only see their own allocations
      if (req.user?.employeeId) {
        where.employeeId = req.user.employeeId;
      } else {
        return res.json([]);
      }
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (timeOffTypeId) where.timeOffTypeId = String(timeOffTypeId);
    if (status) where.status = String(status);

    const allocations = await prisma.timeOffAllocation.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        timeOffType: true,
        approver: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(allocations);
  } catch (err) {
    next(err);
  }
});

// POST /api/time-off/allocations
timeOffRouter.post("/allocations", requireRoles("TIME_OFF_ADMIN", "HR_MANAGER"), async (req, res, next) => {
  try {
    const { employeeId, timeOffTypeId, allocated, validityStart, validityEnd, description } = req.body;

    if (!employeeId || !timeOffTypeId || !allocated || !validityStart) {
      return res.status(400).json({ error: true, message: "Missing required allocation fields" });
    }

    const allocAmount = Number(allocated);
    const allocation = await prisma.timeOffAllocation.create({
      data: {
        employeeId,
        timeOffTypeId,
        allocated: allocAmount,
        taken: 0,
        remaining: allocAmount,
        validityStart: new Date(validityStart),
        validityEnd: validityEnd ? new Date(validityEnd) : null,
        description,
        status: "CONFIRMED",
        approverId: req.user?.id,
      },
      include: {
        employee: true,
        timeOffType: true,
      },
    });

    return res.status(201).json(allocation);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/time-off/allocations/:id/status
timeOffRouter.patch("/allocations/:id/status", requireRoles("TIME_OFF_ADMIN", "HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const allocation = await prisma.timeOffAllocation.update({
      where: { id },
      data: {
        status,
        approverId: req.user?.id,
      },
      include: { employee: true, timeOffType: true },
    });

    return res.json(allocation);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. Time Off Requests
// ==========================================

// GET /api/time-off/requests
timeOffRouter.get("/requests", async (req, res, next) => {
  try {
    const { employeeId, status, myTeam } = req.query;
    const where: any = {};

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));

    if (!isPrivileged) {
      if (myTeam === "true" && req.user?.employeeId) {
        // Manager viewing team requests
        where.employee = { managerId: req.user.employeeId };
      } else if (req.user?.employeeId) {
        // Employee viewing their own requests
        where.employeeId = req.user.employeeId;
      } else {
        return res.json([]);
      }
    } else {
      if (employeeId) where.employeeId = String(employeeId);
      if (myTeam === "true" && req.user?.employeeId) {
        where.employee = { managerId: req.user.employeeId };
      }
    }

    if (status) where.status = String(status);

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            managerId: true,
          },
        },
        timeOffType: true,
        allocation: true,
        approver: { select: { id: true, email: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return res.json(requests);
  } catch (err) {
    next(err);
  }
});

// POST /api/time-off/requests - submit time off request
timeOffRouter.post("/requests", async (req, res, next) => {
  try {
    const { employeeId, timeOffTypeId, startDate, endDate, duration, reason } = req.body;

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));

    // Regular employee can strictly only submit leave requests for themselves
    let targetEmployeeId = req.user?.employeeId;
    if (isPrivileged && employeeId) {
      targetEmployeeId = employeeId;
    }

    if (!targetEmployeeId || !timeOffTypeId || !startDate || !endDate || duration === undefined) {
      return res.status(400).json({ error: true, message: "Missing required request fields" });
    }

    const type = await prisma.timeOffType.findUnique({ where: { id: timeOffTypeId } });
    if (!type) {
      return res.status(404).json({ error: true, message: "Time off type not found" });
    }

    const dur = Number(duration);
    if (isNaN(dur) || dur <= 0) {
      return res.status(400).json({ error: true, message: "Duration must be greater than 0" });
    }

    // If type requires allocation, check available balance
    let allocationId: string | null = null;
    if (type.requiresAllocation) {
      const activeAlloc = await prisma.timeOffAllocation.findFirst({
        where: {
          employeeId: targetEmployeeId,
          timeOffTypeId,
          status: "CONFIRMED",
          remaining: { gte: dur },
        },
        orderBy: { validityStart: "asc" },
      });

      if (!activeAlloc) {
        return res.status(400).json({
          error: true,
          message: `Insufficient leave balance for ${type.name}. Requested: ${dur}, but no active allocation with sufficient remaining days found.`,
        });
      }
      allocationId = activeAlloc.id;
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId: targetEmployeeId,
        timeOffTypeId,
        allocationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: dur,
        status: "SUBMITTED",
        reason,
      },
      include: {
        employee: true,
        timeOffType: true,
      },
    });

    return res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// POST /api/time-off/requests/:id/approve - approve leave request
timeOffRouter.post("/requests/:id/approve", async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const request = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { timeOffType: true, allocation: true, employee: true },
    });

    if (!request) {
      return res.status(404).json({ error: true, message: "Leave request not found" });
    }

    if (request.status === "APPROVED") {
      return res.status(400).json({ error: true, message: "Request is already approved" });
    }

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));
    const isManager = req.user?.employeeId && request.employee?.managerId === req.user.employeeId;

    if (!isPrivileged && !isManager) {
      return res.status(403).json({ error: true, message: "Forbidden: Not authorized to approve this leave request" });
    }

    const dur = Number(request.duration);

    await prisma.$transaction(async (tx) => {
      // If requires allocation, deduct from allocation balance
      if (request.timeOffType.requiresAllocation) {
        let alloc = request.allocation;
        if (!alloc) {
          alloc = await tx.timeOffAllocation.findFirst({
            where: {
              employeeId: request.employeeId,
              timeOffTypeId: request.timeOffTypeId,
              status: "CONFIRMED",
              remaining: { gte: dur },
            },
          });
        }

        if (!alloc || Number(alloc.remaining) < dur) {
          throw new Error("Insufficient remaining leave balance to approve this request");
        }

        const newRemaining = Number(alloc.remaining) - dur;
        const newTaken = Number(alloc.taken) + dur;

        await tx.timeOffAllocation.update({
          where: { id: alloc.id },
          data: {
            remaining: newRemaining,
            taken: newTaken,
          },
        });

        await tx.timeOffRequest.update({
          where: { id },
          data: {
            allocationId: alloc.id,
            allocationUsed: dur,
            status: "APPROVED",
            approverId: req.user?.id,
          },
        });
      } else {
        await tx.timeOffRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            approverId: req.user?.id,
          },
        });
      }
    });

    const updated = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { employee: true, timeOffType: true, allocation: true },
    });

    return res.json({ success: true, request: updated });
  } catch (err: any) {
    next(err);
  }
});

// POST /api/time-off/requests/:id/refuse - refuse leave request
timeOffRouter.post("/requests/:id/refuse", async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const request = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!request) {
      return res.status(404).json({ error: true, message: "Leave request not found" });
    }

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));
    const isManager = req.user?.employeeId && request.employee?.managerId === req.user.employeeId;

    if (!isPrivileged && !isManager) {
      return res.status(403).json({ error: true, message: "Forbidden: Not authorized to refuse this leave request" });
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status: "REFUSED",
        approverId: req.user?.id,
      },
      include: { employee: true, timeOffType: true },
    });

    return res.json({ success: true, request: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/time-off/requests/:id/cancel - cancel leave request
timeOffRouter.post("/requests/:id/cancel", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const request = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { timeOffType: true, allocation: true },
    });

    if (!request) {
      return res.status(404).json({ error: true, message: "Request not found" });
    }

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ['ADMIN', 'HR_MANAGER', 'TIME_OFF_ADMIN'].includes(r));
    const isOwner = req.user?.employeeId && request.employeeId === req.user.employeeId;

    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ error: true, message: "Forbidden: You can only cancel your own leave requests" });
    }

    // Restore allocation if it was approved and deducted
    if (request.status === "APPROVED" && request.allocationId && request.timeOffType.requiresAllocation) {
      const dur = Number(request.allocationUsed);
      await prisma.$transaction(async (tx) => {
        const alloc = await tx.timeOffAllocation.findUnique({ where: { id: request.allocationId! } });
        if (alloc) {
          await tx.timeOffAllocation.update({
            where: { id: alloc.id },
            data: {
              remaining: Number(alloc.remaining) + dur,
              taken: Math.max(0, Number(alloc.taken) - dur),
            },
          });
        }
        await tx.timeOffRequest.update({
          where: { id },
          data: { status: "CANCELLED", allocationUsed: 0 },
        });
      });
    } else {
      await prisma.timeOffRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }

    return res.json({ success: true, message: "Request cancelled" });
  } catch (err) {
    next(err);
  }
});
