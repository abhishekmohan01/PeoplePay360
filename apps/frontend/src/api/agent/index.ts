import { apiClient } from '../client';

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

export interface MapPin {
  id: string;
  employeeName: string;
  latitude: number;
  longitude: number;
  checkInTime: string;
  workMode: "OFFICE" | "WFH";
  classification: string;
  pinColor: string;
  distanceFromHqKm: number | null;
  label: string;
}

export interface AttendanceMapData {
  date: string;
  companyHq: { latitude: number; longitude: number };
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

export interface AgentResponse {
  answer: string;
  steps: AgentStepLog[];
  toolResults?: {
    auditWfhAndGeolocation?: any;
    batchResolveWfhWarnings?: any;
    getLiveAttendancePulse?: any;
    runPayrollPreflight?: any;
    getAttendanceMapData?: AttendanceMapData;
  };
  actionProposal?: AgentActionProposal | null;
  executedAction?: {
    actionType: string;
    result: any;
  } | null;
}

export async function askAgent(prompt: string, date?: string): Promise<AgentResponse> {
  const res = await apiClient.post<{ success: boolean; data: AgentResponse }>('/agent/chat', {
    prompt,
    date,
  });
  return res.data;
}

export async function executeAgentAction(action: AgentActionProposal): Promise<any> {
  const res = await apiClient.post<{ success: boolean; data: any }>('/agent/execute-action', {
    action,
  });
  return res.data;
}

export async function getAgentTools(): Promise<any[]> {
  const res = await apiClient.get<{ success: boolean; tools: any[] }>('/agent/tools');
  return res.tools || [];
}
