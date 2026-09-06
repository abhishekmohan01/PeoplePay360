import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContracts } from './useContracts';
import { ContractCreateModal } from './ContractCreateModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { useAuthStore } from '../../stores/auth.store';
import { Plus, X, FileText, Calendar, ShieldCheck } from 'lucide-react';

export const ContractListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;

  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();
  const canCreate = useAuthStore((state) => state.canManageHR)();

  const { data: contracts, isLoading, isError } = useContracts(employeeIdParam);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Pagination state (25 per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, employeeIdParam]);

  const isContractActive = (status?: string) => {
    const s = (status || '').trim().toUpperCase();
    return s === 'ACTIVE' || s === 'RUNNING';
  };

  const totalContracts = contracts?.length || 0;
  const activeContracts = contracts?.filter(c => isContractActive(c.status)).length || 0;
  const totalPayrollBase = contracts?.reduce((sum, c) => sum + (Number(c.salary || c.wage) || 0), 0) || 0;

  const filtered = useMemo(() => {
    return contracts?.filter(c => {
      const matchesSearch = 
        (c.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.contractNumber || c.id || '').toLowerCase().includes(search.toLowerCase());
      
      if (statusFilter === 'ACTIVE') return matchesSearch && isContractActive(c.status);
      if (statusFilter === 'DRAFT') return matchesSearch && !isContractActive(c.status);
      return matchesSearch;
    }) || [];
  }, [contracts, search, statusFilter]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 font-primary animate-fadeIn">
      <PageHeader 
        title={isEmployeeOnly ? "My Contracts" : "Employment Contracts"} 
        subtitle={
          isEmployeeOnly 
            ? "Review your assigned employment contract terms, wage structure, and schedules" 
            : "Manage employment terms, compensation packages, and contract durations"
        }
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>New Contract</span>
            </Button>
          ) : undefined
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => { setStatusFilter('ALL'); setSearch(''); setSearchParams({}); }}
          role="button"
          tabIndex={0}
          title="Total assigned contracts"
          className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center gap-3 select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              {isEmployeeOnly ? "My Contracts" : "Total Contracts"}
            </span>
            <span className="text-xl font-heading font-bold text-text-primary">{totalContracts}</span>
          </div>
        </div>

        <div 
          className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center gap-3 select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Active Contracts</span>
            <span className="text-xl font-heading font-bold text-emerald-500">{activeContracts}</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center gap-3 select-none col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              {isEmployeeOnly ? "Assigned Base Wage" : "Monthly Base Payroll"}
            </span>
            <span className="text-xl font-heading font-bold text-text-primary truncate">
              ₹{totalPayrollBase.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEmployeeOnly ? "Search my contracts..." : "Search contracts or employees..."}
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer"
            >
              <span>Status: {statusFilter}</span>
              <X size={13} />
            </button>
          )}

          {!isEmployeeOnly && employeeIdParam && (
            <button 
              type="button"
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer"
            >
              <span>Filtered by Employee</span>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-text-muted text-sm font-medium">
          Loading contracts...
        </div>
      )}

      {isError && (
        <div className="p-12 text-center text-rose-500 text-sm font-medium">
          Failed to load contracts. Please try again.
        </div>
      )}

      {filtered && filtered.length > 0 ? (
        <>
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Wage / Base Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-primary" />
                        <span className="font-mono text-xs font-semibold text-text-primary bg-elevated px-2 py-0.5 rounded border border-border">
                          {contract.contractNumber || contract.id}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium text-text-primary">{contract.employeeName}</td>
                    <td className="text-text-secondary text-sm">{contract.startDate}</td>
                    <td className="text-text-muted text-sm">{contract.endDate || '— Permanent'}</td>
                    <td className="font-semibold text-text-primary text-sm">
                      ₹{contract.salary.toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={contract.status === 'RUNNING' ? 'Active' : contract.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="contracts"
          />
        </>
      ) : (
        !isLoading && (
          /* Reliable Empty State Message */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border rounded-xl shadow-sm my-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h4 className="text-lg font-bold text-text-primary mb-1">
              {isEmployeeOnly ? "No Contracts Assigned Yet" : "No Contracts Found"}
            </h4>
            <p className="text-xs text-text-muted max-w-md m-0 mb-4 font-medium leading-relaxed">
              {isEmployeeOnly 
                ? "You currently do not have any active or historical employment contracts assigned to your employee record."
                : "No matching contract records match your search parameters."}
            </p>
            {isEmployeeOnly && (
              <span className="px-3 py-1 bg-elevated border border-border text-text-muted text-xs font-semibold rounded-full">
                Status: Pending HR Assignment
              </span>
            )}
          </div>
        )
      )}

      {canCreate && (
        <ContractCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultEmployeeId={employeeIdParam}
        />
      )}
    </div>
  );
};
