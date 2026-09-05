import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayruns } from './usePayruns';
import { PayrunCreateModal } from './PayrunCreateModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Calendar, Users, AlertTriangle, BarChart3, Plus, CheckCircle2, Clock, DollarSign, X } from 'lucide-react';

export const PayrunListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: payruns, isLoading } = usePayruns();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'ACTIVE'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filtered = payruns?.filter((p) => {
    const s = search.toLowerCase();
    const matchesSearch = !s || (p.name || '').toLowerCase().includes(s) || (p.status || '').toLowerCase().includes(s);
    const matchesStatus = statusFilter === 'ALL' 
      ? true 
      : statusFilter === 'PAID' 
        ? p.status === 'PAID' 
        : p.status !== 'PAID';
    return matchesSearch && matchesStatus;
  });

  const totalBatches = payruns?.length || 0;
  const paidBatches = payruns?.filter((p) => p.status === 'PAID').length || 0;
  const inProgressBatches = payruns?.filter((p) => p.status !== 'PAID').length || 0;
  const totalEmployeesInBatches = payruns?.reduce((sum, p) => sum + (p.employeeCount || 0), 0) || 0;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      <PageHeader
        title="Payrun Batches"
        subtitle="Manage end-to-end payroll cycles, calculate salary slips, and disburse compensation"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/payroll/dashboard')}>
              <BarChart3 size={15} />
              <span>Payroll Analytics</span>
            </Button>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={15} />
              <span>New Payrun</span>
            </Button>
          </div>
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Batches */}
        <div 
          onClick={clearFilters}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to reset filters"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Batches</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalBatches}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {statusFilter !== 'ALL' || search ? 'Click to show all batches ➔' : 'Payroll cycles recorded'}
          </div>
        </div>

        {/* Card 2: Paid Batches */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            statusFilter === 'PAID' 
              ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' 
              : 'border-border hover:border-emerald-500/40'
          }`}
          title="Click to toggle Paid batches filter"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Disbursed (Paid)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-500">
            {paidBatches}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {statusFilter === 'PAID' ? 'Filtered: paid only (click to clear)' : 'Click to filter paid batches ➔'}
          </div>
        </div>

        {/* Card 3: In-Progress */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            statusFilter === 'ACTIVE' 
              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30' 
              : 'border-border hover:border-amber-500/40'
          }`}
          title="Click to toggle in-progress batches"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-amber-500">
            {inProgressBatches}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {statusFilter === 'ACTIVE' ? 'Filtered: in-progress only' : 'Draft, Computed, Validated ➔'}
          </div>
        </div>

        {/* Card 4: Analytics Dashboard */}
        <div 
          onClick={() => navigate('/payroll/dashboard')}
          className="bg-surface border border-border hover:border-blue-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Open executive payroll metrics"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Payroll Analytics</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalEmployeesInBatches}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            View executive salary dashboard ➔
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payrun batches..."
          />
        </div>
        {(statusFilter !== 'ALL' || search) && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-error px-2.5 py-1.5 rounded-lg border border-border hover:bg-elevated transition-colors cursor-pointer"
          >
            <X size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-sm font-medium">Loading payrun batches...</div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Cycle Period</th>
                <th>Salary Structure</th>
                <th>Headcount</th>
                <th>Validation Alerts</th>
                <th>Batch Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/payroll/payruns/${p.id}`)}
                    className="cursor-pointer"
                  >
                    <td>
                      <span className="font-semibold text-text-primary text-sm">
                        {p.name}
                      </span>
                    </td>
                    <td className="text-xs text-text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar size={13} className="text-text-muted shrink-0" />
                        <span className="whitespace-nowrap">{p.periodStart} ➔ {p.periodEnd}</span>
                      </div>
                    </td>
                    <td className="text-xs text-text-secondary font-medium">
                      {p.salaryStructureName}
                    </td>
                    <td className="text-xs">
                      <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                        <Users size={13} className="text-text-muted" />
                        <span>{p.employeeCount}</span>
                      </div>
                    </td>
                    <td>
                      {p.warningCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle size={12} /> {p.warningCount} Warnings
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium">✓ Clean</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-muted text-sm">
                    No payrun batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PayrunCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
