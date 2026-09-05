import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayruns } from './usePayruns';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Calendar, Users, AlertTriangle } from 'lucide-react';

export const PayrunListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: payruns, isLoading } = usePayruns();
  const [search, setSearch] = useState('');

  const filtered = payruns?.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.status || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-primary max-w-5xl mx-auto w-full mt-4">
      <PageHeader
        title="Payrun Batches"
        subtitle="Process payroll batches, compute salary breakdowns, and validate payslips"
        actions={
          <Button variant="primary" onClick={() => navigate('/payroll/dashboard')}>
            📊 Payroll Analytics
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="w-80">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payrun batches..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-muted font-[Caveat] text-xl">Loading payrun batches...</div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left border-collapse text-sm font-sans">
            <thead>
              <tr className="bg-elevated/40">
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[30%]">
                  Batch Name
                </th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[20%]">
                  Period
                </th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[15%]">
                  Structure
                </th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[12%]">
                  Employees
                </th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-r border-border/50 w-[10%]">
                  Warnings
                </th>
                <th className="p-4 font-[Caveat] font-bold text-muted text-lg border-b border-border/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/payroll/payruns/${p.id}`)}
                    className="border-b border-border hover:bg-elevated/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-[Caveat] text-xl font-bold border-r border-border/50 text-text-primary">
                      {p.name}
                    </td>
                    <td className="p-4 text-xs text-text-secondary border-r border-border/50">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Calendar size={14} className="text-muted" />
                        <span>{p.periodStart} to {p.periodEnd}</span>
                      </div>
                    </td>
                    <td className="p-4 font-[Caveat] text-base border-r border-border/50 text-text-primary">
                      {p.salaryStructureName}
                    </td>
                    <td className="p-4 border-r border-border/50 text-xs">
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-muted" />
                        <span className="font-bold">{p.employeeCount}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r border-border/50">
                      {p.warningCount > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                          <AlertTriangle size={14} /> {p.warningCount}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">0</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted font-[Caveat] text-lg">
                    No payrun batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
