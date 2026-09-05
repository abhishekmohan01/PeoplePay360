import { Router } from "express";
import { prisma } from "db/client";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

export const workingScheduleRouter = Router();

workingScheduleRouter.use(authenticateJWT);

workingScheduleRouter.get("/", async (req, res, next) => {
  try {
    const { companyId, isActive } = req.query;
    const where: any = {};
    const targetCompanyId = companyId ? String(companyId) : req.user?.companyId;
    if (targetCompanyId) where.companyId = targetCompanyId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const schedules = await prisma.workingSchedule.findMany({
      where,
      include: {
        days: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { contracts: { where: { status: 'RUNNING', employee: { status: 'ACTIVE' } } } } },
      },
      orderBy: { name: "asc" },
    });

    return res.json(schedules);
  } catch (err) {
    next(err);
  }
});

workingScheduleRouter.get("/:id", async (req, res, next) => {
  try {
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id: req.params.id as string },
      include: {
        days: { orderBy: { dayOfWeek: "asc" } },
        contracts: {
          where: { status: 'RUNNING', employee: { status: 'ACTIVE' } },
          select: { id: true, contractNumber: true, employee: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: true, message: "Working schedule not found" });
    }

    return res.json(schedule);
  } catch (err) {
    next(err);
  }
});

workingScheduleRouter.post("/", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    let { companyId, name, timezone, days } = req.body;

    let targetCompanyId = companyId || req.user?.companyId;
    if (!targetCompanyId) {
      const comp = await prisma.company.findFirst();
      targetCompanyId = comp?.id;
    }

    if (!targetCompanyId || !name || !name.trim()) {
      return res.status(400).json({ error: true, message: "companyId and name are required" });
    }

    const trimmedName = name.trim();

    const daysList: any[] = Array.isArray(days) && days.length > 0 ? days : [
      { dayOfWeek: 1, startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, hours: 8 },
      { dayOfWeek: 2, startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, hours: 8 },
      { dayOfWeek: 3, startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, hours: 8 },
      { dayOfWeek: 4, startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, hours: 8 },
      { dayOfWeek: 5, startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, hours: 8 },
    ];
    const totalHours = daysList.reduce((sum, d) => sum + (Number(d.hours) || 0), 0);
    const totalDays = daysList.length;

    const schedule = await prisma.workingSchedule.create({
      data: {
        companyId: targetCompanyId,
        name: trimmedName,
        timezone: timezone || "UTC",
        daysPerWeek: totalDays,
        hoursPerWeek: totalHours,
        days: {
          create: daysList.map((d) => ({
            dayOfWeek: Number(d.dayOfWeek),
            startTime: new Date(`1970-01-01T${d.startTime || "09:00:00"}Z`),
            endTime: new Date(`1970-01-01T${d.endTime || "18:00:00"}Z`),
            breakMinutes: Number(d.breakMinutes || 0),
            hours: Number(d.hours || 8),
          })),
        },
      },
      include: {
        days: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { contracts: { where: { status: 'RUNNING', employee: { status: 'ACTIVE' } } } } },
      },
    });

    return res.status(201).json(schedule);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: true,
        message: `A schedule named "${req.body.name}" already exists for this company.`,
      });
    }
    next(err);
  }
});

workingScheduleRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { name, timezone, isActive, days } = req.body;

    const trimmedName = name ? name.trim() : undefined;

    if (Array.isArray(days)) {
      const totalHours = days.reduce((sum, d) => sum + (Number(d.hours) || 0), 0);
      const totalDays = days.length;

      await prisma.$transaction(async (tx) => {
        await tx.workingScheduleDay.deleteMany({ where: { workingScheduleId: id } });
        for (const d of days) {
          await tx.workingScheduleDay.create({
            data: {
              workingScheduleId: id,
              dayOfWeek: Number(d.dayOfWeek),
              startTime: new Date(`1970-01-01T${d.startTime || "09:00:00"}Z`),
              endTime: new Date(`1970-01-01T${d.endTime || "18:00:00"}Z`),
              breakMinutes: Number(d.breakMinutes || 0),
              hours: Number(d.hours || 8),
            },
          });
        }
        await tx.workingSchedule.update({
          where: { id },
          data: {
            name: trimmedName,
            timezone,
            isActive,
            daysPerWeek: totalDays,
            hoursPerWeek: totalHours,
          },
        });
      });
    } else {
      await prisma.workingSchedule.update({
        where: { id },
        data: { name: trimmedName, timezone, isActive },
      });
    }

    const updated = await prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        days: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { contracts: { where: { status: 'RUNNING', employee: { status: 'ACTIVE' } } } } },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: true,
        message: `A schedule named "${req.body.name}" already exists for this company.`,
      });
    }
    next(err);
  }
});
