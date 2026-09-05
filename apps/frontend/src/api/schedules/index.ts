import { apiClient } from '../client';

export interface ScheduleDay {
  id?: string;
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
  hours: number;
}

export interface Schedule {
  id: string;
  name: string;
  type: 'Fixed' | 'Flexible' | string;
  hoursPerWeek: number;
  assignedEmployees: number;
  status: 'Active' | 'Archived';
  timezone?: string;
  days: ScheduleDay[];
}

/**
 * Convert a stored Prisma time value to HH:mm string.
 * The DB stores times as "1970-01-01T09:00:00.000Z" (Date at epoch).
 * Also handles already-formatted "HH:mm" or "HH:mm:ss" strings.
 */
function isoToTimeStr(value: string): string {
  if (!value) return '09:00';
  // Already formatted as HH:mm or HH:mm:ss
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  try {
    const d = new Date(value);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '09:00';
  }
}

function normalizeSchedule(s: any): Schedule {
  const parsedHours = s.hoursPerWeek != null ? Number(s.hoursPerWeek) : NaN;
  const hoursPerWeek: number =
    !isNaN(parsedHours) && parsedHours > 0
      ? parsedHours
      : Array.isArray(s.days) && s.days.length > 0
        ? s.days.reduce((sum: number, d: any) => sum + Number(d.hours || 0), 0)
        : 40;

  const days: ScheduleDay[] = Array.isArray(s.days)
    ? s.days.map((d: any) => ({
        id: d.id,
        dayOfWeek: Number(d.dayOfWeek),
        startTime: isoToTimeStr(String(d.startTime ?? '')),
        endTime: isoToTimeStr(String(d.endTime ?? '')),
        breakMinutes: Number(d.breakMinutes ?? 60),
        hours: Number(d.hours ?? 8),
      }))
    : [];

  return {
    id: s.id,
    name: s.name,
    type: hoursPerWeek >= 40 ? 'Fixed' : 'Flexible',
    hoursPerWeek,
    assignedEmployees: s._count?.contracts ?? 0,
    status: s.isActive === false ? 'Archived' : 'Active',
    timezone: s.timezone,
    days,
  };
}

export async function getSchedules(): Promise<Schedule[]> {
  const data = await apiClient.get<any[]>('/working-schedules');
  return data.map(normalizeSchedule);
}

export async function createSchedule(data: {
  name: string;
  timezone?: string;
  days?: { dayOfWeek: number; startTime: string; endTime: string; hours: number; breakMinutes: number }[];
}): Promise<Schedule> {
  const res = await apiClient.post<any>('/working-schedules', data);
  return normalizeSchedule(res);
}

export async function updateSchedule(
  id: string,
  data: {
    name?: string;
    timezone?: string;
    isActive?: boolean;
    days?: { dayOfWeek: number; startTime: string; endTime: string; hours: number; breakMinutes: number }[];
  }
): Promise<Schedule> {
  const res = await apiClient.patch<any>(`/working-schedules/${id}`, data);
  return normalizeSchedule(res);
}
