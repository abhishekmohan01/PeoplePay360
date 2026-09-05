import { apiClient } from '../client';

export interface Schedule {
  id: string;
  name: string;
  type: 'Fixed' | 'Flexible' | 'Shift' | string;
  hoursPerWeek: number;
  assignedEmployees: number;
  status: 'Active' | 'Archived';
  timezone?: string;
}

function normalizeSchedule(s: any): Schedule {
  const totalHours = Array.isArray(s.days)
    ? s.days.reduce((sum: number, d: any) => sum + Number(d.hoursPerDay || 0), 0)
    : 40;

  return {
    id: s.id,
    name: s.name,
    type: totalHours >= 40 ? 'Fixed' : 'Flexible',
    hoursPerWeek: totalHours || 40,
    assignedEmployees: s._count?.contracts ?? 0,
    status: s.isActive === false ? 'Archived' : 'Active',
    timezone: s.timezone,
  };
}

export async function getSchedules(): Promise<Schedule[]> {
  const data = await apiClient.get<any[]>('/working-schedules');
  return data.map(normalizeSchedule);
}
