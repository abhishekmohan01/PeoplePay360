import { useParams, useNavigate } from 'react-router-dom';
import { useContract } from './useContracts';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ArrowLeft, FileText, Calendar, Building, DollarSign, Clock } from 'lucide-react';

export const ContractDetail = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { data: contract, isLoading, isError } = useContract(contractId!);

  if (isLoading) return <div className="p-12 text-center text-text-muted text-sm font-medium">Loading contract details...</div>;
  if (isError || !contract) return <div className="p-12 text-center text-error text-sm font-medium">Failed to load contract.</div>;

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 pb-12">
      
      {/* Back button */}
      <div className="mb-3">
        <button
          onClick={() => navigate('/contracts')}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Contracts</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary m-0">
              Contract {contract.contractNumber || contract.id}
            </h1>
            <StatusBadge status={contract.status === 'RUNNING' ? 'Active' : contract.status} />
          </div>
          <p className="text-xs text-text-secondary m-0 mt-1">
            Official employment contract for <span className="font-semibold text-text-primary">{contract.employeeName}</span>
          </p>
        </div>
      </div>

      {/* Form Fields Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Terms */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" /> Contract Terms
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Employee Name</label>
            <div className="text-sm font-semibold text-text-primary">{contract.employeeName}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Start Date</label>
            <div className="text-sm font-semibold text-text-primary">{contract.startDate}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">End Date</label>
            <div className="text-sm font-semibold text-text-primary">{contract.endDate || '— Permanent Agreement'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Working Schedule</label>
            <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Clock size={14} className="text-text-muted" />
              {contract.scheduleName || contract.workingSchedule?.name || 'Standard 40h Full-Time'}
            </div>
          </div>
        </div>

        {/* Compensation & Role */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <DollarSign size={14} className="text-primary" /> Compensation & Role
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Assigned Department</label>
            <div className="text-sm font-semibold text-text-primary">{contract.departmentName || contract.department?.name || 'General'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Job Position</label>
            <div className="text-sm font-semibold text-text-primary">{contract.jobPosition || 'Staff Member'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Agreed Monthly Base Wage</label>
            <div className="text-lg font-bold text-emerald-500 tabular-nums">
              ₹{contract.salary.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Contract Status</label>
            <div>
              <StatusBadge status={contract.status === 'RUNNING' ? 'Active' : contract.status} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
