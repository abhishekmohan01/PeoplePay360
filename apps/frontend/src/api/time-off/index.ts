export interface TimeOffRequest {
  id: string;
  employeeName: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const mockRequests: TimeOffRequest[] = [
  {
    id: 'to-1',
    employeeName: 'Anita Oliver',
    type: 'Annual Leave',
    startDate: '2023-11-01',
    endDate: '2023-11-05',
    days: 5,
    status: 'Approved'
  },
  {
    id: 'to-2',
    employeeName: 'Audrey Peterson',
    type: 'Sick Leave',
    startDate: '2023-10-20',
    endDate: '2023-10-21',
    days: 2,
    status: 'Pending'
  }
];

export async function getTimeOffRequests(): Promise<TimeOffRequest[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
}
