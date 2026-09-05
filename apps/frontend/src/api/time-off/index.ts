import { apiClient } from '../client';

export interface TimeOffRequest {
  id: string;
  employeeId?: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  duration?: number;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  reason?: string | null;
  timeOffType?: { id: string; name: string; displayColor?: string; unit?: string };
  employee?: { firstName: string; lastName: string; employeeCode?: string };
}

function mapStatus(status: string): string {
  const s = (status || '').toUpperCase();
  if (s === 'APPROVED') return 'Approved';
  if (s === 'REFUSED' || s === 'REJECTED') return 'Rejected';
  if (s === 'CANCELLED') return 'Cancelled';
  return 'Pending';
}

function normalizeRequest(r: any): TimeOffRequest {
  const employeeName = r.employee
    ? `${r.employee.firstName} ${r.employee.lastName}`.trim()
    : (r.employeeName || 'Unknown');
  
  const typeName = r.timeOffType?.name || r.type || 'Time Off';
  const startDate = r.startDate ? r.startDate.split('T')[0] : '';
  const endDate = r.endDate ? r.endDate.split('T')[0] : '';
  const days = Number(r.duration ?? r.days ?? 1);

  return {
    ...r,
    employeeName,
    type: typeName,
    startDate,
    endDate,
    days,
    status: mapStatus(r.status),
  };
}

export async function getTimeOffRequests(params?: {
  myTeam?: boolean;
  employeeId?: string;
  status?: string;
}): Promise<TimeOffRequest[]> {
  const query = new URLSearchParams();
  if (params?.myTeam) query.set('myTeam', 'true');
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const data = await apiClient.get<any[]>(`/time-off/requests${qs ? `?${qs}` : ''}`);
  return data.map(normalizeRequest);
}

export async function approveTimeOff(id: string): Promise<any> {
  return apiClient.post(`/time-off/requests/${id}/approve`);
}

export async function refuseTimeOff(id: string): Promise<any> {
  return apiClient.post(`/time-off/requests/${id}/refuse`);
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  timeOffTypeName: string;
  allocated: number;
  taken: number;
  remaining: number;
  validityStart: string;
  validityEnd: string | null;
  status: string;
  description?: string;
  displayColor?: string;
  unit: string;
}

export async function getTimeOffAllocations(params?: {
  employeeId?: string;
  timeOffTypeId?: string;
  status?: string;
}): Promise<TimeOffAllocation[]> {
  const query = new URLSearchParams();
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  if (params?.timeOffTypeId) query.set('timeOffTypeId', params.timeOffTypeId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const data = await apiClient.get<any[]>(`/time-off/allocations${qs ? `?${qs}` : ''}`);
  return data.map((a: any) => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employee ? `${a.employee.firstName} ${a.employee.lastName}`.trim() : 'Unknown',
    timeOffTypeName: a.timeOffType?.name || 'Leave',
    allocated: Number(a.allocated || 0),
    taken: Number(a.taken || 0),
    remaining: Number(a.remaining || 0),
    validityStart: a.validityStart ? a.validityStart.split('T')[0] : '',
    validityEnd: a.validityEnd ? a.validityEnd.split('T')[0] : null,
    status: a.status,
    description: a.description,
    displayColor: a.timeOffType?.displayColor || '#3B82F6',
    unit: a.timeOffType?.unit || 'DAYS',
  }));
}
