import { useTimeOffRequests } from './useTimeOff';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CalendarRange, Umbrella, Stethoscope } from 'lucide-react';

export const TimeOffPage = () => {
  const { data: requests, isLoading } = useTimeOffRequests();

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Time Off" 
        subtitle="Manage leave requests and balances"
        actions={<Button variant="primary">Request Time Off</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Umbrella size={20} />
            <span className="font-semibold text-sm">Annual Leave</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold">14</span>
            <span className="text-sm text-muted mb-1">days remaining</span>
          </div>
        </Card>
        
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-warning">
            <Stethoscope size={20} />
            <span className="font-semibold text-sm">Sick Leave</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold">5</span>
            <span className="text-sm text-muted mb-1">days remaining</span>
          </div>
        </Card>
        
        <Card className="flex flex-col gap-2 border-l-4 border-l-info">
          <div className="flex items-center gap-2 text-info">
            <CalendarRange size={20} />
            <span className="font-semibold text-sm">Pending Approval</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold">1</span>
            <span className="text-sm text-muted mb-1">request</span>
          </div>
        </Card>
      </div>

      <h3 className="text-xl font-[Caveat] font-bold mb-4 border-b border-border pb-2">Recent Requests</h3>

      {isLoading ? (
        <div className="text-center p-8 text-muted font-[Caveat]">Loading requests...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests?.map(req => (
            <Card key={req.id} className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="m-0 text-lg">{req.employeeName}</h4>
                  <span className="text-sm text-muted">{req.type}</span>
                </div>
                <StatusBadge status={req.status} />
              </div>
              
              <div className="text-sm border-t border-border/50 pt-2 mt-1">
                <span className="font-[Caveat] text-lg text-primary mr-2">{req.days} Days</span>
                <span className="text-muted">({req.startDate} to {req.endDate})</span>
              </div>
              
              {req.status === 'Pending' && (
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="destructive" size="sm">Reject</Button>
                  <Button variant="primary" size="sm">Approve</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
