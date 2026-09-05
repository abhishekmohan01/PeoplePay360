import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTimeOffRequests, useTimeOffAllocations, useApproveTimeOff, useRefuseTimeOff } from './useTimeOff';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CalendarRange, Umbrella, Stethoscope, Users, Layers, Clock } from 'lucide-react';

export const TimeOffPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;
  const [myTeamFilter, setMyTeamFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ALLOCATIONS'>('REQUESTS');

  const canApproveTimeOff = useAuthStore((state) => state.canApproveTimeOff)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  const queryParams = {
    employeeId: employeeIdParam,
    myTeam: myTeamFilter || undefined,
  };

  const { data: requests, isLoading: isLoadingRequests } = useTimeOffRequests(
    employeeIdParam || myTeamFilter ? queryParams : undefined
  );
  const { data: allocations, isLoading: isLoadingAllocations } = useTimeOffAllocations(
    employeeIdParam ? { employeeId: employeeIdParam } : undefined
  );

  const approveMutation = useApproveTimeOff();
  const refuseMutation = useRefuseTimeOff();

  const pendingCount = requests?.filter((r) => r.status === 'Pending').length || 0;

  // Calculate allocations summary
  const totalAllocated = allocations?.reduce((sum, a) => sum + a.allocated, 0) || 14;
  const totalRemaining = allocations?.reduce((sum, a) => sum + a.remaining, 0) || 10;

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader 
        title={isEmployeeOnly ? "My Time Off" : "Time Off"} 
        subtitle={isEmployeeOnly ? "Review your leave allocations and submitted requests" : "Manage leave requests, balances, and team approvals"}
        actions={<Button variant="primary">Request Time Off</Button>}
      />

      {/* Sub-Tabs Switcher (Requests vs Allocations) */}
      <div className="flex items-center justify-between border-b border-border mb-6">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`pb-3 font-[Caveat] text-2xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'REQUESTS'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-text-primary'
            }`}
          >
            <Clock size={20} />
            <span>Time Off Requests</span>
            {pendingCount > 0 && (
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-accent text-white font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALLOCATIONS')}
            className={`pb-3 font-[Caveat] text-2xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ALLOCATIONS'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-text-primary'
            }`}
          >
            <Layers size={20} />
            <span>Leave Allocations</span>
          </button>
        </div>

        {/* Manager Filter bar */}
        {canApproveTimeOff && activeTab === 'REQUESTS' && (
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => setMyTeamFilter(!myTeamFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-sans text-xs font-semibold transition-all cursor-pointer ${
                myTeamFilter
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-elevated/60 text-text-secondary border-border hover:bg-elevated'
              }`}
            >
              <Users size={14} />
              <span>My Direct Team</span>
            </button>

            {employeeIdParam && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="px-3 py-1.5 rounded-lg border border-accent/60 bg-accent/15 text-accent font-sans text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Employee Filter</span>
                <span>✕ Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-primary">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Umbrella size={20} />
            <span className="font-semibold text-sm">Total Allocated</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold">{totalAllocated}</span>
            <span className="text-sm text-muted mb-1 font-sans">days across types</span>
          </div>
        </Card>
        
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-success">
            <Stethoscope size={20} />
            <span className="font-semibold text-sm">Available Balance</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold text-success">{totalRemaining}</span>
            <span className="text-sm text-muted mb-1 font-sans">days remaining</span>
          </div>
        </Card>
        
        <Card className="flex flex-col gap-2 border-l-4 border-l-info">
          <div className="flex items-center gap-2 text-info">
            <CalendarRange size={20} />
            <span className="font-semibold text-sm">Pending Approval</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-[Caveat] font-bold">{pendingCount}</span>
            <span className="text-sm text-muted mb-1 font-sans">requests</span>
          </div>
        </Card>
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div>
          <h3 className="text-2xl font-[Caveat] font-bold mb-4 border-b border-border pb-2 text-text-primary">
            {isEmployeeOnly ? "My Leave Requests" : "Requests Awaiting Review"}
          </h3>

          {isLoadingRequests ? (
            <div className="text-center p-8 text-muted font-[Caveat] text-xl">Loading requests...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              {requests?.map((req) => (
                <Card key={req.id} className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="m-0 text-base font-bold text-text-primary font-sans">{req.employeeName}</h4>
                      <span className="text-xs text-muted block mt-0.5">{req.type}</span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  
                  <div className="text-sm border-t border-border/50 pt-2 mt-1 flex justify-between items-center">
                    <span className="font-[Caveat] text-xl font-bold text-primary">{req.days} Days</span>
                    <span className="text-xs text-muted font-sans">({req.startDate} to {req.endDate})</span>
                  </div>

                  {/* Only Approvers can Approve/Refuse */}
                  {canApproveTimeOff && req.status === 'Pending' && (
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/40">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={refuseMutation.isPending}
                        onClick={() => refuseMutation.mutate(req.id)}
                      >
                        Reject
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(req.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALLOCATIONS */}
      {activeTab === 'ALLOCATIONS' && (
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
            <h3 className="text-2xl font-[Caveat] font-bold text-text-primary m-0">
              Leave Allocations & Quotas
            </h3>
            {canApproveTimeOff && (
              <Button variant="secondary" size="sm">
                + New Allocation
              </Button>
            )}
          </div>

          {isLoadingAllocations ? (
            <div className="text-center p-8 text-muted font-[Caveat] text-xl">Loading allocations...</div>
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-elevated/40">
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[25%]">Employee</th>
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">Time Off Type</th>
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[12%]">Allocated</th>
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[12%]">Taken</th>
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">Remaining</th>
                    <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-border/50">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations?.map((alloc) => (
                    <tr key={alloc.id} className="border-b border-border hover:bg-elevated/30 transition-colors font-sans">
                      <td className="p-4 font-[Caveat] text-lg border-r border-border/50 font-bold">{alloc.employeeName}</td>
                      <td className="p-4 border-r border-border/50">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alloc.displayColor }} />
                          <span className="font-medium text-text-primary">{alloc.timeOffTypeName}</span>
                        </span>
                      </td>
                      <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{alloc.allocated} {alloc.unit.toLowerCase()}</td>
                      <td className="p-4 font-[Caveat] text-lg border-r border-border/50 text-muted">{alloc.taken}</td>
                      <td className="p-4 font-[Caveat] text-xl border-r border-border/50 font-bold text-emerald-400">
                        {alloc.remaining} {alloc.unit.toLowerCase()}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={alloc.status === 'CONFIRMED' ? 'Approved' : alloc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
