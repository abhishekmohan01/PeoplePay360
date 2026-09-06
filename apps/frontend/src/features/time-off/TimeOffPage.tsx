import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTimeOffRequests, useTimeOffAllocations, useApproveTimeOff, useRefuseTimeOff } from './useTimeOff';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TimeOffRequestModal } from './TimeOffRequestModal';
import { TimeOffAllocationModal } from './TimeOffAllocationModal';
import { CalendarRange, Umbrella, Stethoscope, Users, Layers, Clock, Plus, X, Check, Ban, AlertCircle } from 'lucide-react';

export const TimeOffPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;
  const [myTeamFilter, setMyTeamFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ALLOCATIONS'>('REQUESTS');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const canApproveTimeOff = useAuthStore((state) => state.canApproveTimeOff)();
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();

  // If regular employee, strictly scope to their own employeeId
  const effectiveEmployeeId = isEmployeeOnly ? (user?.employeeId || undefined) : employeeIdParam;

  const queryParams = {
    employeeId: effectiveEmployeeId,
    myTeam: myTeamFilter || undefined,
  };

  const { data: requests, isLoading: isLoadingRequests } = useTimeOffRequests(
    effectiveEmployeeId || myTeamFilter ? queryParams : undefined
  );
  const { data: allocations, isLoading: isLoadingAllocations } = useTimeOffAllocations(
    effectiveEmployeeId ? { employeeId: effectiveEmployeeId } : undefined
  );

  const approveMutation = useApproveTimeOff();
  const refuseMutation = useRefuseTimeOff();

  const pendingCount = requests?.filter((r) => r.status === 'Pending').length || 0;

  // Calculate allocations summary accurately from loaded allocations
  const totalAllocated = allocations ? allocations.reduce((sum, a) => sum + (Number(a.allocated) || 0), 0) : 0;
  const totalRemaining = allocations ? allocations.reduce((sum, a) => sum + (Number(a.remaining) || 0), 0) : 0;

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;


  const filteredRequests = requests?.filter((req) => {
    if (statusFilter === 'Pending') return (req.status || '').toLowerCase() === 'pending';
    return true;
  });

  const totalRequests = filteredRequests?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalRequests / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRequests = filteredRequests?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      <PageHeader 
        title={isEmployeeOnly ? "My Time Off & Leaves" : "Leave Management & Allocations"} 
        subtitle={isEmployeeOnly ? "Review your leave allowances, submit time-off requests, and view balances" : "Review team leave requests, monitor balances, and allocate quotas"}
        actions={
          <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
            <Plus size={16} />
            <span>Request Time Off</span>
          </Button>
        }
      />

      {/* Modern Segmented Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3 mb-6">
        <div className="flex bg-surface border border-border rounded-lg p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            }`}
          >
            <Clock size={14} />
            <span>Time Off Requests</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'REQUESTS' ? 'bg-white/20 text-white' : 'bg-primary text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('ALLOCATIONS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ALLOCATIONS'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            }`}
          >
            <Layers size={14} />
            <span>Leave Allocations</span>
          </button>
        </div>

        {/* Manager Filter bar */}
        {canApproveTimeOff && activeTab === 'REQUESTS' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMyTeamFilter(!myTeamFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                myTeamFilter
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface text-text-secondary border-border hover:bg-elevated'
              }`}
            >
              <Users size={14} />
              <span>My Direct Team</span>
            </button>

            {employeeIdParam && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer"
              >
                <span>Filtered</span>
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards (Fully Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab('ALLOCATIONS')}
          role="button"
          tabIndex={0}
          title="Click to view quota allocations breakdown"
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Quota</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Umbrella size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">{totalAllocated}</span>
            <span className="text-xs text-text-muted">days across types ➔</span>
          </div>
        </div>
        
        <div 
          onClick={() => setActiveTab('ALLOCATIONS')}
          role="button"
          tabIndex={0}
          title="Click to inspect remaining leave balances"
          className="bg-surface border border-border hover:border-emerald-500/40 rounded-xl p-5 shadow-sm flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Available Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-emerald-500">{totalRemaining}</span>
            <span className="text-xs text-text-muted">days remaining ➔</span>
          </div>
        </div>
        
        <div 
          onClick={() => {
            setActiveTab('REQUESTS');
            setStatusFilter(statusFilter === 'Pending' ? 'ALL' : 'Pending');
          }}
          role="button"
          tabIndex={0}
          title={statusFilter === 'Pending' ? 'Click to show all requests' : 'Click to filter by Pending Review only'}
          className={`bg-surface border rounded-xl p-5 shadow-sm flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.01] select-none group ${
            statusFilter === 'Pending'
              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
              : 'border-border hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending Review</span>
              {statusFilter === 'Pending' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  Filtered
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarRange size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-amber-500">{pendingCount}</span>
            <span className="text-xs text-text-muted">
              {statusFilter === 'Pending' ? 'click to show all' : 'awaiting decision ➔'}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-heading font-semibold text-text-primary m-0">
              {isEmployeeOnly ? "My Leave Requests" : "Requests Awaiting Review"}
            </h3>
          </div>

          {isLoadingRequests ? (
            <div className="p-12 text-center text-text-muted text-sm font-medium">Loading leave requests...</div>
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <>
              {/* Scroll container */}
              <div style={{
                maxHeight: '520px',
                overflowY: 'auto',
                paddingRight: '4px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border) transparent',
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedRequests!.map((req) => (
                    <div key={req.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="m-0 text-sm font-semibold text-text-primary">{req.employeeName}</h4>
                          <span className="text-xs text-text-muted block mt-0.5">{req.type}</span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      
                      <div className="text-xs border-t border-border pt-2.5 mt-1 flex justify-between items-center text-text-secondary">
                        <span className="font-semibold text-primary text-sm">{req.days} Days</span>
                        <span>{req.startDate} ➔ {req.endDate}</span>
                      </div>

                      {/* Approver actions */}
                      {canApproveTimeOff && req.status === 'Pending' && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <button 
                            type="button"
                            disabled={refuseMutation.isPending || approveMutation.isPending}
                            onClick={() => refuseMutation.mutate(req.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/15 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {refuseMutation.isPending && refuseMutation.variables === req.id ? (
                              <>
                                <span className="btn-spinner" />
                                <span>Rejecting...</span>
                              </>
                            ) : (
                              <>
                                <Ban size={13} />
                                <span>Reject</span>
                              </>
                            )}
                          </button>
                          <button 
                            type="button"
                            disabled={approveMutation.isPending || refuseMutation.isPending}
                            onClick={() => approveMutation.mutate(req.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {approveMutation.isPending && approveMutation.variables === req.id ? (
                              <>
                                <span className="btn-spinner" />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <Check size={13} />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination toolbar */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  padding: '8px 4px',
                  borderTop: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalRequests)} of {totalRequests} requests
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: safePage <= 1 ? 0.4 : 1,
                      }}
                    >← Prev</button>
                    <span style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'var(--elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}>{safePage} / {totalPages}</span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                        opacity: safePage >= totalPages ? 0.4 : 1,
                      }}
                    >Next →</button>
                  </div>
                </div>
              )}
            </>
          ) : (

            <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Umbrella size={24} />
              </div>
              <div>
                <h4 className="text-base font-heading font-semibold text-text-primary m-0">
                  {statusFilter === 'Pending' ? 'No Requests Awaiting Review' : 'No Leave Requests Found'}
                </h4>
                <p className="text-xs text-text-muted max-w-sm m-0 mt-1">
                  {statusFilter === 'Pending' 
                    ? 'All requests have been reviewed or no pending leaves are queued.' 
                    : 'No time off requests are currently logged in the system.'}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsRequestModalOpen(true)} className="mt-2">
                <Plus size={15} />
                <span>Submit New Request</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALLOCATIONS */}
      {activeTab === 'ALLOCATIONS' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-heading font-semibold text-text-primary m-0">
              {isEmployeeOnly ? "My Leave Quotas & Balances" : "Leave Quotas & Balances"}
            </h3>
            {canApproveTimeOff && (
              <Button variant="secondary" size="sm" onClick={() => setIsAllocationModalOpen(true)}>
                <Plus size={14} />
                <span>New Allocation</span>
              </Button>
            )}
          </div>

          {isLoadingAllocations ? (
            <div className="p-12 text-center text-text-muted text-sm font-medium">Loading allocations...</div>
          ) : allocations && allocations.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="table-enterprise">
                <thead>
                  <tr>
                    {!isEmployeeOnly && <th>Employee</th>}
                    <th>Time Off Type</th>
                    <th>Allocated</th>
                    <th>Taken</th>
                    <th>Remaining Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => (
                    <tr key={alloc.id}>
                      {!isEmployeeOnly && (
                        <td className="font-semibold text-text-primary">{alloc.employeeName}</td>
                      )}
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: alloc.displayColor || 'var(--primary)' }} />
                          <span className="font-medium text-text-primary text-sm">{alloc.timeOffTypeName}</span>
                        </span>
                      </td>
                      <td className="text-text-secondary text-sm">{alloc.allocated} {alloc.unit.toLowerCase()}</td>
                      <td className="text-text-muted text-sm">{alloc.taken} {alloc.unit.toLowerCase()}</td>
                      <td className="font-semibold text-emerald-500 text-sm">
                        {alloc.remaining} {alloc.unit.toLowerCase()}
                      </td>
                      <td>
                        <StatusBadge status={alloc.status === 'CONFIRMED' ? 'Approved' : alloc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Layers size={24} />
              </div>
              <div>
                <h4 className="text-base font-heading font-semibold text-text-primary m-0">
                  No Leave Allocations Found
                </h4>
                <p className="text-xs text-text-muted max-w-sm m-0 mt-1">
                  {isEmployeeOnly
                    ? "You do not have any confirmed leave allocations assigned yet. Please check with your HR manager."
                    : "Allocate quotas (e.g. 14 Annual Vacation days) so employees can apply for leaves."}
                </p>
              </div>
              {canApproveTimeOff && (
                <Button variant="secondary" size="sm" onClick={() => setIsAllocationModalOpen(true)} className="mt-2">
                  <Plus size={15} />
                  <span>Grant Leave Allocation</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TimeOffRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        defaultEmployeeId={effectiveEmployeeId}
      />

      <TimeOffAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        defaultEmployeeId={effectiveEmployeeId}
      />

    </div>
  );
};
