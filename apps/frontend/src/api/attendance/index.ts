import { apiClient } from '../client';
import { format } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  employeeId?: string;
  employeeName: string;
  date: string;
  checkIn: string; // ISO string or formatted
  checkInTime?: string;
  checkOut: string | null; // ISO string or formatted
  checkOutTime?: string | null;
  status: string;
  duration: number | null; // in hours
  workedHours: number;
  overtime: number;
  departmentName?: string;
  managerName?: string;
  notes?: string | null;
  employee?: {
    id: string;
    employeeCode?: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string };
    manager?: { id: string; firstName: string; lastName: string } | null;
  };
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    EARLY_CHECKOUT: 'Early Checkout',
    MISSING_CHECKOUT: 'Missing Checkout',
    CORRECTED: 'Corrected',
  };
  return map[status] || status;
}

function normalizeRecord(r: any): AttendanceRecord {
  const employeeName = r.employee 
    ? `${r.employee.firstName} ${r.employee.lastName}`.trim() 
    : (r.employeeName || 'Unknown');
  
  let date = '';
  let checkInTime = '—';
  let checkOutTime = null;

  try {
    if (r.checkIn) {
      const d = new Date(r.checkIn);
      date = format(d, 'yyyy-MM-dd');
      checkInTime = format(d, 'hh:mm a');
    }
  } catch {
    date = r.date || '';
    checkInTime = r.checkIn || '—';
  }

  try {
    if (r.checkOut) {
      const d = new Date(r.checkOut);
      checkOutTime = format(d, 'hh:mm a');
    }
  } catch {
    checkOutTime = r.checkOut;
  }

  const workedHours = Number(r.workedHours ?? r.duration ?? 0);
  const overtime = Number(r.overtime ?? 0);

  return {
    ...r,
    employeeName,
    date,
    checkIn: checkInTime,
    checkInTime,
    checkOut: checkOutTime,
    checkOutTime,
    status: mapStatus(r.status),
    duration: workedHours,
    workedHours,
    overtime,
    departmentName: r.employee?.department?.name || 'General',
    managerName: r.employee?.manager ? `${r.employee.manager.firstName} ${r.employee.manager.lastName}` : 'None',
  };
}

export interface AttendanceStatusResponse {
  checkedIn: boolean;
  activeRecord?: any;
  elapsedMinutes?: number;
  message?: string;
}

export async function getAttendanceStatus(): Promise<AttendanceStatusResponse> {
  return apiClient.get<AttendanceStatusResponse>('/attendance/status');
}

export async function getAttendance(params?: {
  employeeId?: string;
  status?: string;
  departmentId?: string;
}): Promise<AttendanceRecord[]> {
  const query = new URLSearchParams();
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  if (params?.status) query.set('status', params.status);
  if (params?.departmentId) query.set('departmentId', params.departmentId);
  const qs = query.toString();
  const data = await apiClient.get<any[]>(`/attendance${qs ? `?${qs}` : ''}`);
  return data.map(normalizeRecord);
}

export async function getAttendanceRecord(id: string): Promise<AttendanceRecord> {
  const data = await apiClient.get<any>(`/attendance/${id}`);
  return normalizeRecord(data);
}

export async function checkIn(params?: {
  isWfh?: boolean;
  locationType?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}): Promise<any> {
  return apiClient.post('/attendance/check-in', params || {});
}

export async function checkOut(): Promise<any> {
  return apiClient.post('/attendance/check-out');
}
