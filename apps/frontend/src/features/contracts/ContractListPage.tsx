import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContracts } from './useContracts';
import { ContractCreateModal } from './ContractCreateModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, X, FileText } from 'lucide-react';

export const ContractListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;

  const { data: contracts, isLoading, isError } = useContracts(employeeIdParam);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isContractActive = (status?: string) => {
    const s = (status || '').trim().toUpperCase();
    return s === 'ACTIVE' || s === 'RUNNING';
  };

  const totalContracts = contracts?.length || 0;
  const activeContracts = contracts?.filter(c => isContractActive(c.status)).length || 0;
  const draftContracts = contracts?.filter(c => !isContractActive(c.status)).length || 0;
  const totalPayrollBase = contracts?.reduce((sum, c) => sum + (Number(c.salary || c.wage) || 0), 0) || 0;

  const filtered = contracts?.filter(c => {
    const matchesSearch = 
      (c.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contractNumber || c.id || '').toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'ACTIVE') return matchesSearch && isContractActive(c.status);
    if (statusFilter === 'DRAFT') return matchesSearch && !isContractActive(c.status);
    return matchesSearch;
  });

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
      <PageHeader 
        title="Employment Contracts" 
        subtitle="Manage employment terms, compensation packages, and contract durations"
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>New Contract</span>
          </Button>
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div 
          onClick={() => { setStatusFilter('ALL'); setSearch(''); setSearchParams({}); }}
          role="button"
          tabIndex={0}
          title="Click to view all contracts"
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Total Contracts</span>
            <span className="text-xl font-heading font-bold text-text-primary">{totalContracts}</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          role="button"
          tabIndex={0}
          title="Click to filter by Active contracts"
          className={`bg-surface border rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group ${
            statusFilter === 'ACTIVE' ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-border hover:border-emerald-500/40'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              {statusFilter === 'ACTIVE' ? 'Active (Filtered)' : 'Active Contracts'}
            </span>
            <span className="text-xl font-heading font-bold text-emerald-500">{activeContracts}</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/payroll/dashboard')}
          role="button"
          tabIndex={0}
          title="Click to view Payroll Analytics"
          className="bg-surface border border-border hover:border-indigo-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Monthly Base Payroll</span>
            <span className="text-xl font-heading font-bold text-text-primary truncate">
              ₹{totalPayrollBase.toLocaleString()}
            </span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/employees')}
          role="button"
          tabIndex={0}
          title="Click to view Employee Directory"
          className="bg-surface border border-border hover:border-amber-500/40 rounded-xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Workforce Directory</span>
            <span className="text-xs font-semibold text-text-secondary mt-1 block group-hover:text-primary">
              View staff ➔
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts or employees..."
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

          {employeeIdParam && (
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
          Loading contracts directory...
        </div>
      )}

      {isError && (
        <div className="p-12 text-center text-error text-sm font-medium">
          Failed to load contracts. Please try again.
        </div>
      )}

      {filtered && filtered.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Contract Code</th>
                <th>Employee Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Monthly Wage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => (
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
      ) : (
        !isLoading && (
          <div className="p-12 text-center text-text-muted text-sm bg-surface border border-border rounded-xl">
            No contracts found.
          </div>
        )
      )}

      <ContractCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultEmployeeId={employeeIdParam}
      />
    </div>
  );
};
