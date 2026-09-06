import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const attendanceRouter = Router();

attendanceRouter.use(authenticateJWT);

// ==========================================
// Quick Action Navbar Widget (Self Service)
// ==========================================

// GET /api/attendance/status - current user's check-in status
attendanceRouter.get("/status", async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.json({ checkedIn: false, message: "No employee linked to account" });
    }

    // Find the latest open attendance (checkIn exists, checkOut is null)
    const active = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
      orderBy: { checkIn: "desc" },
    });

    if (!active) {
      return res.json({ checkedIn: false, activeRecord: null });
    }

    const elapsedMs = Date.now() - new Date(active.checkIn).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    return res.json({
      checkedIn: true,
      activeRecord: active,
      elapsedMinutes,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-in - self check-in
attendanceRouter.post("/check-in", async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: true, message: "No employee linked to account" });
    }

    // Check if already checked in
    const active = await prisma.attendance.findFirst({
      where: { employeeId, checkOut: null },
    });
    if (active) {
      return res.status(400).json({ error: true, message: "Already checked in", activeRecord: active });
    }

    const { isWfh, locationType, latitude, longitude, notes } = req.body || {};
    const isRemote = Boolean(isWfh || locationType === "WFH");

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, companyId: true },
    });

    const now = new Date();
    let recordNotes = notes || (isRemote ? "Remote check-in via widget" : "Self check-in via widget");
    if (isRemote) {
      const geoText = (latitude && longitude) ? ` [GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}]` : "";
      recordNotes = `[WFH - Sent to HR for Review] ${recordNotes}${geoText}`;
    }

    const newRecord = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: now,
        status: "PRESENT",
        workedHours: 0,
        overtime: 0,
        notes: recordNotes,
      },
    });

    // Notify HR team via dashboard alert/warning
    if (isRemote && employee?.companyId) {
      await prisma.payrollWarning.create({
        data: {
          companyId: employee.companyId,
          employeeId: employee.id,
          type: "OTHER",
          severity: "INFO",
          message: `Remote Attendance: ${employee.firstName} ${employee.lastName} checked in via WFH on ${now.toLocaleDateString()} - review required.`,
        },
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      checkedIn: true,
      isWfh: isRemote,
      message: isRemote ? "WFH attendance marked and sent to HR for review" : "Checked in successfully",
      record: newRecord,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-out - self check-out
attendanceRouter.post("/check-out", async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: true, message: "No employee linked to account" });
    }

    const active = await prisma.attendance.findFirst({
      where: { employeeId, checkOut: null },
      orderBy: { checkIn: "desc" },
    });

    if (!active) {
      return res.status(400).json({ error: true, message: "No active check-in found" });
    }

    const checkOut = new Date();
    const durationHours = (checkOut.getTime() - new Date(active.checkIn).getTime()) / (1000 * 3600);
    const workedHours = Math.round(durationHours * 100) / 100;
    const overtime = workedHours > 8 ? Math.round((workedHours - 8) * 100) / 100 : 0;

    const updated = await prisma.attendance.update({
      where: { id: active.id },
      data: {
        checkOut,
        workedHours,
        overtime,
      },
    });

    return res.json({
      success: true,
      checkedIn: false,
      record: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// HR & Management Attendance Endpoints
// ==========================================

// GET /api/attendance - list attendance records (with pagination)
attendanceRouter.get("/", async (req, res, next) => {
  try {
    const { employeeId, departmentId, status, startDate, endDate, limit, offset } = req.query;
    const where: any = {};

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some((r: string) => ["ADMIN", "HR_MANAGER", "PAYROLL_USER"].includes(r));
    if (!isPrivileged && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }
    if (status) where.status = String(status);
    if (departmentId) {
      where.employee = { departmentId: String(departmentId) };
    }

    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = new Date(String(startDate));
      if (endDate) where.checkIn.lte = new Date(String(endDate));
    }

    const take = limit !== undefined ? Math.min(Number(limit), 500) : 100;
    const skip = offset !== undefined ? Math.max(0, Number(offset)) : 0;

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { checkIn: "desc" },
      take,
      skip,
    });

    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance - manual record creation
attendanceRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const { employeeId, checkIn, checkOut, workedHours, overtime, status, notes } = req.body;

    if (!employeeId || !checkIn) {
      return res.status(400).json({ error: true, message: "employeeId and checkIn are required" });
    }

    const inTime = new Date(checkIn);
    const outTime = checkOut ? new Date(checkOut) : null;
    let computedHours = workedHours !== undefined ? Number(workedHours) : 0;
    if (outTime && !workedHours) {
      computedHours = Math.round(((outTime.getTime() - inTime.getTime()) / (1000 * 3600)) * 100) / 100;
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: inTime,
        checkOut: outTime,
        workedHours: computedHours,
        overtime: overtime ? Number(overtime) : 0,
        status: status || "PRESENT",
        notes,
      },
      include: {
        employee: true,
      },
    });

    return res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/:id
attendanceRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.attendance.findUnique({
      where: { id: req.params.id as string },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
            manager: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!record) {
      return res.status(404).json({ error: true, message: "Attendance record not found" });
    }
    return res.json(record);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/attendance/:id - manual correction
attendanceRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { checkIn, checkOut, workedHours, overtime, status, notes } = req.body;

    const data: any = {
      status: status || "CORRECTED",
      notes: notes || "Manually corrected by authorized user",
    };
    if (checkIn) data.checkIn = new Date(checkIn);
    if (checkOut !== undefined) data.checkOut = checkOut ? new Date(checkOut) : null;
    if (workedHours !== undefined) data.workedHours = Number(workedHours);
    if (overtime !== undefined) data.overtime = Number(overtime);

    const updated = await prisma.attendance.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});
