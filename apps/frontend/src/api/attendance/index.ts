export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  duration: number | null; // in hours
}

const mockRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeName: 'Anita Oliver',
    date: '2023-10-15',
    checkIn: '08:50 AM',
    checkOut: '05:00 PM',
    status: 'Present',
    duration: 8
  },
  {
    id: 'att-2',
    employeeName: 'Audrey Peterson',
    date: '2023-10-15',
    checkIn: '09:15 AM',
    checkOut: null,
    status: 'Late',
    duration: null
  },
  {
    id: 'att-3',
    employeeName: 'Billy Kyle',
    date: '2023-10-15',
    checkIn: '-',
    checkOut: '-',
    status: 'Absent',
    duration: 0
  }
];

export async function getAttendance(): Promise<AttendanceRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRecords;
}

export async function getAttendanceRecord(id: string): Promise<AttendanceRecord> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const record = mockRecords.find(r => r.id === id);
  if (!record) throw new Error('Record not found');
  return record;
}

export async function checkIn(employeeId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
}

export async function checkOut(employeeId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
}
