import { useParams } from 'react-router-dom';
import { useContract } from './useContracts';

export const ContractDetail = () => {
  const { contractId } = useParams();
  const { data: contract, isLoading, isError } = useContract(contractId!);

  if (isLoading) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading contract...</div>;
  if (isError || !contract) return <div className="p-8 text-center font-[Caveat] text-muted text-xl">Failed to load contract</div>;

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full p-4 mt-4">
      
      {/* Top Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-[Caveat] font-bold m-0 text-text-primary uppercase tracking-wide">Contract / {contract.id}</h1>
        <p className="text-muted m-0 mt-2 font-[Caveat] text-xl">Form view of one contract</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl font-[Caveat] text-xl mb-12">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center">
            <label className="w-40 text-muted">Employee</label>
            <input type="text" readOnly value={contract.employeeName} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Start Date</label>
            <input type="text" readOnly value={contract.startDate} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">End Date</label>
            <input type="text" readOnly value={contract.endDate || '—'} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Status</label>
            <input type="text" readOnly value={contract.status === 'Active' ? 'Running' : contract.status} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center">
            <label className="w-40 text-muted">Department</label>
            <input type="text" readOnly value="Finance" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Job Position</label>
            <input type="text" readOnly value="Payroll Specialist" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Wage / Month</label>
            <input type="text" readOnly value={`₹${contract.salary.toLocaleString()}`} className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-muted">Working Schedule</label>
            <input type="text" readOnly value="40 Hours / Week" className="flex-1 border border-border/80 rounded-xl px-4 py-2 bg-surface text-text-primary focus:outline-none" />
          </div>
        </div>

      </div>
    </div>
  );
};
