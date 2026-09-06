export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export type PunchClassification =
  | "VERIFIED_OFFICE"
  | "VERIFIED_WFH"
  | "SUSPICIOUS_OFFICE_OUT_OF_BOUNDS"
  | "SUSPICIOUS_WFH_ANOMALY"
  | "MISSING_GPS";

export interface AttendanceAuditItem {
  recordId: string;
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  notes: string | null;
  isWfh: boolean;
  coordinates: GeoCoordinate | null;
  distanceFromHqMeters: number | null;
  distanceFromHqKm: number | null;
  classification: PunchClassification;
  classificationReason: string;
  hasPendingWarning: boolean;
  warningId?: string;
}

export interface AttendanceAuditSummary {
  date: string;
  totalPunches: number;
  verifiedOffice: number;
  verifiedWfh: number;
  suspiciousPunches: number;
  missingGps: number;
  pendingWfhWarnings: number;
  items: AttendanceAuditItem[];
}

export interface BatchResolveResult {
  resolvedCount: number;
  resolvedRecordIds: string[];
  clearedWarningIds: string[];
  message: string;
}

export interface PayrollPreflightCheck {
  period: string;
  readinessScore: number; // 0 to 100
  status: "READY" | "WARNING" | "BLOCKED";
  summary: {
    totalActiveEmployees: number;
    unresolvedAttendanceGaps: number;
    unapprovedWfhWarnings: number;
    expiringContractsCount: number;
    pendingTimeOffRequests: number;
  };
  blockers: string[];
  warnings: string[];
  recommendedActions: string[];
}

export interface AttendancePulse {
  activePunchesCount: number;
  officeCount: number;
  wfhCount: number;
  overduePunchesCount: number; // clocked in > 9h without check out
  activeEmployees: {
    employeeId: string;
    name: string;
    checkIn: string;
    isWfh: boolean;
    durationMinutes: number;
    coordinates: GeoCoordinate | null;
  }[];
}

export interface AgentStepLog {
  timestamp: string;
  step: string;
  toolCalled?: string;
  details?: string;
}

export interface AgentActionProposal {
  actionId: string;
  actionType: "BATCH_RESOLVE_WFH_WARNINGS" | "AUTO_CLOSE_STALE_PUNCHES";
  title: string;
  description: string;
  targetCount: number;
  payload: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface AgentResponse {
  answer: string;
  steps: AgentStepLog[];
  toolResults?: Record<string, any>;
  actionProposal?: AgentActionProposal | null;
  executedAction?: {
    actionType: string;
    result: any;
  } | null;
}

export interface MapPin {
  id: string;
  employeeName: string;
  latitude: number;
  longitude: number;
  checkInTime: string;
  workMode: "OFFICE" | "WFH";
  classification: PunchClassification;
  pinColor: string; // Hex color code (e.g. #10B981 for verified, #EF4444 for anomaly)
  distanceFromHqKm: number | null;
  label: string;
}

export interface AttendanceMapData {
  date: string;
  companyHq: GeoCoordinate;
  totalPins: number;
  verifiedCount: number;
  anomalyCount: number;
  pins: MapPin[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
}
