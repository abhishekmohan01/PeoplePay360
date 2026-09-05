export interface Schedule {
  id: string;
  name: string;
  type: 'Fixed' | 'Flexible' | 'Shift';
  hoursPerWeek: number;
  assignedEmployees: number;
  status: 'Active' | 'Archived';
}

const mockSchedules: Schedule[] = [
  {
    id: 'sch-1',
    name: 'Standard 40h',
    type: 'Fixed',
    hoursPerWeek: 40,
    assignedEmployees: 120,
    status: 'Active'
  },
  {
    id: 'sch-2',
    name: 'Part Time 20h',
    type: 'Flexible',
    hoursPerWeek: 20,
    assignedEmployees: 15,
    status: 'Active'
  }
];

export async function getSchedules(): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockSchedules;
}
