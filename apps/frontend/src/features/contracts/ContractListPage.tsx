import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContracts } from './useContracts';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';

export const ContractListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || undefined;

  const { data: contracts, isLoading } = useContracts(employeeIdParam);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = contracts?.filter(c => 
    (c.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.contractNumber || c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader 
        title="Contracts" 
        subtitle="List view of employee contracts"
      />

      <div className="flex items-center gap-4 mb-6">
        <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold !font-handwritten text-xl transition-colors uppercase tracking-widest cursor-pointer">
          New
        </button>
        <div className="w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts..."
          />
        </div>

        {employeeIdParam && (
          <button 
            type="button"
            onClick={() => setSearchParams({})}
            className="px-4 py-1.5 border border-accent/60 bg-accent/15 text-accent rounded-lg font-[Caveat] font-bold text-lg hover:bg-accent/25 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>Filtered by Employee</span>
            <span className="text-xs">✕ Clear</span>
          </button>
        )}
      </div>

      {isLoading && <div className="p-8 text-center font-[Caveat] text-muted text-xl">Loading contracts...</div>}

      {filtered && filtered.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-elevated/30">
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">Contract</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">Employee</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">Start</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">End</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">Wage / Month</th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-border/50">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => (
                <tr 
                  key={contract.id} 
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  className="border-b border-border hover:bg-elevated/30 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50 uppercase">{contract.contractNumber || contract.id}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{contract.employeeName}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{contract.startDate}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">{contract.endDate || '—'}</td>
                  <td className="p-4 font-[Caveat] text-lg border-r border-border/50">₹{contract.salary.toLocaleString()}</td>
                  <td className={`p-4 font-[Caveat] text-lg ${contract.status === 'RUNNING' || contract.status === 'Active' ? 'text-success' : 'text-error'}`}>
                    {contract.status === 'RUNNING' ? 'Running' : contract.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
