import { prisma } from "db/client";
import { extractGpsFromNotes, classifyPunch, DEFAULT_COMPANY_HQ } from "../geo/haversine";
import type {
  AttendanceAuditItem,
  AttendanceAuditSummary,
  BatchResolveResult,
  AttendancePulse,
  GeoCoordinate,
  MapPin,
  AttendanceMapData,
} from "../types";

/**
 * Helper to get day boundaries
 */
function getDayRange(dateString?: string): { startOfDay: Date; endOfDay: Date; dateFormatted: string } {
  const target = dateString ? new Date(dateString) : new Date();
  const year = target.getFullYear();
  const month = target.getMonth();
  const day = target.getDate();

  const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
  const dateFormatted = startOfDay.toISOString().split("T")[0] || "today";

  return { startOfDay, endOfDay, dateFormatted };
}

/**
 * Audits all attendance check-ins and GPS coordinates for a given day
 */
export async function auditWfhAndGeolocation(params?: {
  date?: string;
  companyId?: string;
  hqCoordinates?: GeoCoordinate;
}): Promise<AttendanceAuditSummary> {
  const { startOfDay, endOfDay, dateFormatted } = getDayRange(params?.date);
  const hqCoords = params?.hqCoordinates || DEFAULT_COMPANY_HQ;

  // 1. Fetch attendance records in target date range
  const whereAttendance: any = {
    checkIn: { gte: startOfDay, lte: endOfDay },
  };
  if (params?.companyId) {
    whereAttendance.employee = { companyId: params.companyId };
  }

  const records = await prisma.attendance.findMany({
    where: whereAttendance,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyId: true,
        },
      },
    },
    orderBy: { checkIn: "asc" },
  });

  // 2. Fetch pending WFH / Remote attendance warnings
  const whereWarning: any = {
    type: "OTHER",
    message: { contains: "Remote Attendance" },
    createdAt: { gte: startOfDay, lte: endOfDay },
  };
  if (params?.companyId) {
    whereWarning.companyId = params.companyId;
  }

  const warnings = await prisma.payrollWarning.findMany({
    where: whereWarning,
  });

  const warningMap = new Map<string, string>();
  for (const w of warnings) {
    if (w.employeeId) {
      warningMap.set(w.employeeId, w.id);
    }
  }

  // 3. Process & Classify each record
  const items: AttendanceAuditItem[] = [];
  let verifiedOffice = 0;
  let verifiedWfh = 0;
  let suspiciousPunches = 0;
  let missingGps = 0;

  for (const record of records) {
    const isWfh = Boolean(
      record.notes?.includes("WFH") ||
        record.notes?.includes("Remote") ||
        record.notes?.includes("Sent to HR for Review")
    );

    const coords = extractGpsFromNotes(record.notes);
    const classificationResult = classifyPunch(coords, isWfh, hqCoords);

    if (classificationResult.classification === "VERIFIED_OFFICE") verifiedOffice++;
    else if (classificationResult.classification === "VERIFIED_WFH") verifiedWfh++;
    else if (classificationResult.classification === "MISSING_GPS") missingGps++;
    else suspiciousPunches++;

    const warningId = record.employeeId ? warningMap.get(record.employeeId) : undefined;

    items.push({
      recordId: record.id,
      employeeId: record.employeeId,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      checkInTime: record.checkIn.toISOString(),
      checkOutTime: record.checkOut ? record.checkOut.toISOString() : null,
      status: record.status,
      notes: record.notes,
      isWfh,
      coordinates: coords,
      distanceFromHqMeters: classificationResult.distanceMeters,
      distanceFromHqKm: classificationResult.distanceKm,
      classification: classificationResult.classification,
      classificationReason: classificationResult.reason,
      hasPendingWarning: Boolean(warningId),
      warningId,
    });
  }

  return {
    date: dateFormatted,
    totalPunches: items.length,
    verifiedOffice,
    verifiedWfh,
    suspiciousPunches,
    missingGps,
    pendingWfhWarnings: warnings.length,
    items,
  };
}

/**
 * Batch resolves all verified WFH warnings and appends AI verification to notes
 */
export async function batchResolveWfhWarnings(params?: {
  date?: string;
  companyId?: string;
  recordIds?: string[];
}): Promise<BatchResolveResult> {
  const audit = await auditWfhAndGeolocation({
    date: params?.date,
    companyId: params?.companyId,
  });

  // Filter records to resolve: verified WFH with pending warnings (or explicitly provided IDs)
  const targetItems = audit.items.filter((item) => {
    if (params?.recordIds && params.recordIds.length > 0) {
      return params.recordIds.includes(item.recordId);
    }
    return item.classification === "VERIFIED_WFH" && item.hasPendingWarning;
  });

  const warningIdsToClear = targetItems
    .map((item) => item.warningId)
    .filter((id): id is string => Boolean(id));

  // 1. Delete the PayrollWarning records
  if (warningIdsToClear.length > 0) {
    await prisma.payrollWarning.deleteMany({
      where: {
        id: { in: warningIdsToClear },
      },
    });
  }

  // 2. Mark attendance notes as verified
  const resolvedRecordIds: string[] = [];
  for (const item of targetItems) {
    const existingNotes = item.notes || "";
    if (!existingNotes.includes("[WFH Verified by AI Copilot]")) {
      const updatedNotes = `${existingNotes} [WFH Verified by AI Copilot]`.trim();
      await prisma.attendance.update({
        where: { id: item.recordId },
        data: {
          notes: updatedNotes,
          status: "PRESENT",
        },
      });
      resolvedRecordIds.push(item.recordId);
    }
  }

  return {
    resolvedCount: resolvedRecordIds.length,
    resolvedRecordIds,
    clearedWarningIds: warningIdsToClear,
    message: `Successfully verified ${resolvedRecordIds.length} remote check-in(s) and cleared ${warningIdsToClear.length} HR warning notification(s).`,
  };
}

/**
 * Real-time active headcount and punch pulse
 */
export async function getLiveAttendancePulse(params?: { companyId?: string }): Promise<AttendancePulse> {
  const now = new Date();
  const where: any = { checkOut: null };
  if (params?.companyId) {
    where.employee = { companyId: params.companyId };
  }

  const activeRecords = await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { checkIn: "asc" },
  });

  let officeCount = 0;
  let wfhCount = 0;
  let overduePunchesCount = 0;

  const activeEmployees = activeRecords.map((r) => {
    const isWfh = Boolean(r.notes?.includes("WFH") || r.notes?.includes("Remote"));
    if (isWfh) wfhCount++;
    else officeCount++;

    const elapsedMs = now.getTime() - new Date(r.checkIn).getTime();
    const durationMinutes = Math.floor(elapsedMs / (1000 * 60));

    // Overdue: more than 9 hours elapsed without checkout
    if (durationMinutes > 540) {
      overduePunchesCount++;
    }

    return {
      employeeId: r.employeeId,
      name: `${r.employee.firstName} ${r.employee.lastName}`,
      checkIn: r.checkIn.toISOString(),
      isWfh,
      durationMinutes,
      coordinates: extractGpsFromNotes(r.notes),
    };
  });

  return {
    activePunchesCount: activeRecords.length,
    officeCount,
    wfhCount,
    overduePunchesCount,
    activeEmployees,
  };
}

/**
 * Exports punches as map pins with coordinates and color coding for visual radar
 */
export async function getAttendanceMapData(params?: {
  date?: string;
  companyId?: string;
  hqCoordinates?: GeoCoordinate;
}): Promise<AttendanceMapData> {
  const hqCoords = params?.hqCoordinates || DEFAULT_COMPANY_HQ;
  const audit = await auditWfhAndGeolocation(params);

  const pins: MapPin[] = [];
  let verifiedCount = 0;
  let anomalyCount = 0;

  let minLat = hqCoords.latitude;
  let maxLat = hqCoords.latitude;
  let minLng = hqCoords.longitude;
  let maxLng = hqCoords.longitude;

  for (const item of audit.items) {
    if (!item.coordinates) continue;

    const lat = item.coordinates.latitude;
    const lng = item.coordinates.longitude;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);

    let pinColor = "#6B7280"; // default gray
    if (item.classification === "VERIFIED_OFFICE") {
      pinColor = "#10B981"; // Emerald green
      verifiedCount++;
    } else if (item.classification === "VERIFIED_WFH") {
      pinColor = "#3B82F6"; // Vibrant blue
      verifiedCount++;
    } else if (item.classification === "SUSPICIOUS_OFFICE_OUT_OF_BOUNDS") {
      pinColor = "#EF4444"; // Red
      anomalyCount++;
    } else if (item.classification === "SUSPICIOUS_WFH_ANOMALY") {
      pinColor = "#F59E0B"; // Amber
      anomalyCount++;
    }

    pins.push({
      id: item.recordId,
      employeeName: item.employeeName,
      latitude: lat,
      longitude: lng,
      checkInTime: item.checkInTime,
      workMode: item.isWfh ? "WFH" : "OFFICE",
      classification: item.classification,
      pinColor,
      distanceFromHqKm: item.distanceFromHqKm,
      label: `${item.employeeName} (${item.isWfh ? "WFH" : "Office"}): ${item.distanceFromHqKm ?? 0}km from HQ`,
    });
  }

  return {
    date: audit.date,
    companyHq: hqCoords,
    totalPins: pins.length,
    verifiedCount,
    anomalyCount,
    pins,
    bounds: pins.length > 0 ? { minLat, maxLat, minLng, maxLng } : null,
  };
}
