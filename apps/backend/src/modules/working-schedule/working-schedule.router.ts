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
    if (companyId) where.companyId = String(companyId);
    if (isActive !== undefined) where.isActive = isActive === "true";

    const schedules = await prisma.workingSchedule.findMany({
      where,
      include: {
        days: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { contracts: true } },
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
    const { companyId, name, timezone, days } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ error: true, message: "companyId and name are required" });
    }

    const daysList: any[] = Array.isArray(days) ? days : [];
    const totalHours = daysList.reduce((sum, d) => sum + (Number(d.hours) || 0), 0);
    const totalDays = daysList.length;

    const schedule = await prisma.workingSchedule.create({
      data: {
        companyId,
        name,
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
      },
    });

    return res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
});

workingScheduleRouter.patch("/:id", requireRoles("HR_MANAGER"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { name, timezone, isActive, days } = req.body;

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
            name,
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
        data: { name, timezone, isActive },
      });
    }

    const updated = await prisma.workingSchedule.findUnique({
      where: { id },
      include: { days: { orderBy: { dayOfWeek: "asc" } } },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});
