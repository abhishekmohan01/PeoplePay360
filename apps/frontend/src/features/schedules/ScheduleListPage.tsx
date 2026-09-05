import { useSchedules } from './useSchedules';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import './ScheduleListPage.css';

export const ScheduleListPage = () => {
  const { data: schedules, isLoading } = useSchedules();

  return (
    <div className="schedule-page">
      <PageHeader 
        title="Working Schedules" 
        subtitle="Configure work hours and shifts"
        actions={<Button variant="primary">New Schedule</Button>}
      />

      {isLoading && <div className="schedule-loading">Loading schedules...</div>}

      <div className="schedule-list">
        {schedules?.map(schedule => (
          <Card key={schedule.id} className="schedule-card">
            <div className="schedule-header">
              <h3>{schedule.name}</h3>
              <StatusBadge status={schedule.status} />
            </div>
            <div className="schedule-details">
              <div><span className="schedule-label">Type:</span> {schedule.type}</div>
              <div><span className="schedule-label">Hours/Week:</span> {schedule.hoursPerWeek}h</div>
              <div><span className="schedule-label">Assigned:</span> {schedule.assignedEmployees} employees</div>
            </div>
            <div className="schedule-actions">
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
