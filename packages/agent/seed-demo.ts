import { prisma } from "db/client";
import { DEFAULT_COMPANY_HQ } from "./src/geo/haversine";

async function seedDemoData() {
  console.log("==========================================");
  console.log("📍 Seeding Realistic Geolocation Demo Data");
  console.log("==========================================\n");

  // 1. Fetch active employees
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    take: 5,
    select: { id: true, firstName: true, lastName: true, companyId: true },
  });

  if (employees.length < 3) {
    console.log("⚠️ Need at least 3 active employees in database to seed demo records.");
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const todayStart = new Date(year, month, day, 0, 0, 0);
  const todayEnd = new Date(year, month, day, 23, 59, 59);

  // 2. Clean existing records for today for these demo employees
  const employeeIds = employees.map((e) => e.id);
  await prisma.attendance.deleteMany({
    where: {
      employeeId: { in: employeeIds },
      checkIn: { gte: todayStart, lte: todayEnd },
    },
  });

  await prisma.payrollWarning.deleteMany({
    where: {
      employeeId: { in: employeeIds },
      type: "OTHER",
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });

  console.log(`Cleaned existing punches for today. Generating 4 realistic scenarios...\n`);

  // Scenario 1: Alice - Verified Office (<100m from HQ)
  const emp1 = employees[0]!;
  const punch1Time = new Date(year, month, day, 9, 2);
  const hqLat = DEFAULT_COMPANY_HQ.latitude;
  const hqLng = DEFAULT_COMPANY_HQ.longitude;
  const officeCoords = `${(hqLat + 0.0004).toFixed(4)}, ${(hqLng + 0.0003).toFixed(4)}`;

  await prisma.attendance.create({
    data: {
      employeeId: emp1.id,
      checkIn: punch1Time,
      status: "PRESENT",
      workedHours: 0,
      overtime: 0,
      notes: `Office check-in via TopNav widget [GPS: ${officeCoords}]`,
    },
  });
  console.log(`✅ [Scenario 1] ${emp1.firstName} ${emp1.lastName}: Clocked in OFFICE at HQ [GPS: ${officeCoords}]`);

  // Scenario 2: Bob - Legitimate WFH (8.2 km from HQ) with HR Review Warning
  const emp2 = employees[1]!;
  const punch2Time = new Date(year, month, day, 9, 15);
  const wfhCoords1 = `${(hqLat + 0.05).toFixed(4)}, ${(hqLng - 0.04).toFixed(4)}`;

  await prisma.attendance.create({
    data: {
      employeeId: emp2.id,
      checkIn: punch2Time,
      status: "PRESENT",
      workedHours: 0,
      overtime: 0,
      notes: `[WFH - Sent to HR for Review] WFH remote check-in via TopNav widget [GPS: ${wfhCoords1}]`,
    },
  });

  if (emp2.companyId) {
    await prisma.payrollWarning.create({
      data: {
        companyId: emp2.companyId,
        employeeId: emp2.id,
        type: "OTHER",
        severity: "INFO",
        message: `Remote Attendance: ${emp2.firstName} ${emp2.lastName} checked in via WFH on ${now.toLocaleDateString()} - review required.`,
      },
    });
  }
  console.log(`🏠 [Scenario 2] ${emp2.firstName} ${emp2.lastName}: Clocked in WFH (~8km away) [GPS: ${wfhCoords1}] + Created HR Warning`);

  // Scenario 3: Charlie - Legitimate WFH (22 km away) with HR Review Warning
  const emp3 = employees[2]!;
  const punch3Time = new Date(year, month, day, 9, 28);
  const wfhCoords2 = `${(hqLat - 0.15).toFixed(4)}, ${(hqLng + 0.12).toFixed(4)}`;

  await prisma.attendance.create({
    data: {
      employeeId: emp3.id,
      checkIn: punch3Time,
      status: "PRESENT",
      workedHours: 0,
      overtime: 0,
      notes: `[WFH - Sent to HR for Review] WFH remote check-in via TopNav widget [GPS: ${wfhCoords2}]`,
    },
  });

  if (emp3.companyId) {
    await prisma.payrollWarning.create({
      data: {
        companyId: emp3.companyId,
        employeeId: emp3.id,
        type: "OTHER",
        severity: "INFO",
        message: `Remote Attendance: ${emp3.firstName} ${emp3.lastName} checked in via WFH on ${now.toLocaleDateString()} - review required.`,
      },
    });
  }
  console.log(`🏠 [Scenario 3] ${emp3.firstName} ${emp3.lastName}: Clocked in WFH (~22km away) [GPS: ${wfhCoords2}] + Created HR Warning`);

  // Scenario 4: David - Suspicious Out-of-Bounds Office Punch (850km away in Mumbai!)
  if (employees.length >= 4) {
    const emp4 = employees[3]!;
    const punch4Time = new Date(year, month, day, 9, 5);
    const suspiciousCoords = "19.0760, 72.8777"; // Mumbai

    await prisma.attendance.create({
      data: {
        employeeId: emp4.id,
        checkIn: punch4Time,
        status: "PRESENT",
        workedHours: 0,
        overtime: 0,
        notes: `Office check-in via TopNav widget [GPS: ${suspiciousCoords}]`,
      },
    });

    if (emp4.companyId) {
      await prisma.payrollWarning.create({
        data: {
          companyId: emp4.companyId,
          employeeId: emp4.id,
          type: "OTHER",
          severity: "WARNING",
          message: `Suspicious Location: ${emp4.firstName} ${emp4.lastName} marked "Office" punch 1150km away from headquarters.`,
        },
      });
    }
    console.log(`🚨 [Scenario 4] ${emp4.firstName} ${emp4.lastName}: Marked OFFICE but located 1150km away! [GPS: ${suspiciousCoords}]`);
  }

  console.log("\n==========================================");
  console.log("🎉 DEMO ATTENDANCE DATA SEEDED SUCCESSFULLY!");
  console.log("==========================================\n");
  console.log("Now try running:");
  console.log("  bun run test-runner.ts");
  console.log("The agent will automatically audit these records, flag the anomaly, and offer one-click batch approval!");
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
