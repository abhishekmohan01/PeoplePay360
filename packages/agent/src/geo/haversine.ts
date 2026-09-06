import type { GeoCoordinate, PunchClassification } from "../types";

// Default HQ coordinates (overridable via env or company settings)
export const DEFAULT_COMPANY_HQ: GeoCoordinate = {
  latitude: Number(process.env.COMPANY_HQ_LAT) || 28.5355,
  longitude: Number(process.env.COMPANY_HQ_LNG) || 77.3910,
};

// Maximum allowed radius for an "OFFICE" check-in (in meters)
export const OFFICE_RADIUS_METERS = 500;

// Anomaly threshold for remote punch (in kilometers)
export const WFH_ANOMALY_DISTANCE_KM = 2500;

/**
 * Calculates Great-Circle distance using Haversine formula
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): { meters: number; kilometers: number } {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = Math.round(R * c);
  const kilometers = Math.round((meters / 1000) * 100) / 100;

  return { meters, kilometers };
}

/**
 * Extracts GPS coordinates formatted by the AttendanceWidget from the notes string
 * Format example: "[WFH - Sent to HR for Review] Remote check-in [GPS: 28.5355, 77.3910]"
 */
export function extractGpsFromNotes(notes: string | null | undefined): GeoCoordinate | null {
  if (!notes) return null;
  const match = notes.match(/\[GPS:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\]/i);
  if (!match || !match[1] || !match[2]) return null;

  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);

  if (isNaN(latitude) || isNaN(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Classifies an attendance punch based on coordinates, work mode, and distance from HQ
 */
export function classifyPunch(
  coords: GeoCoordinate | null,
  isWfh: boolean,
  hqCoords: GeoCoordinate = DEFAULT_COMPANY_HQ
): {
  classification: PunchClassification;
  reason: string;
  distanceMeters: number | null;
  distanceKm: number | null;
} {
  if (!coords) {
    return {
      classification: "MISSING_GPS",
      reason: isWfh
        ? "Remote punch logged without device GPS coordinates."
        : "Standard office punch without GPS verification.",
      distanceMeters: null,
      distanceKm: null,
    };
  }

  const { meters, kilometers } = calculateHaversineDistance(coords, hqCoords);

  if (!isWfh) {
    // Punched as Office
    if (meters <= OFFICE_RADIUS_METERS) {
      return {
        classification: "VERIFIED_OFFICE",
        reason: `Within approved office perimeter (${meters}m from HQ).`,
        distanceMeters: meters,
        distanceKm: kilometers,
      };
    } else {
      return {
        classification: "SUSPICIOUS_OFFICE_OUT_OF_BOUNDS",
        reason: `Marked as "Office" but device was ${kilometers}km away from company headquarters.`,
        distanceMeters: meters,
        distanceKm: kilometers,
      };
    }
  } else {
    // Punched as WFH / Remote
    if (kilometers > WFH_ANOMALY_DISTANCE_KM) {
      return {
        classification: "SUSPICIOUS_WFH_ANOMALY",
        reason: `Extreme distance detected: Checked in ${kilometers}km away from base region. Possible spoof or unauthorized travel.`,
        distanceMeters: meters,
        distanceKm: kilometers,
      };
    } else {
      return {
        classification: "VERIFIED_WFH",
        reason: `Legitimate remote punch verified (${kilometers}km from office base).`,
        distanceMeters: meters,
        distanceKm: kilometers,
      };
    }
  }
}
