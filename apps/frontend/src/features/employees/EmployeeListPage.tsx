import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from './useEmployees';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmployeeCard } from './EmployeeCard';
import './EmployeeListPage.css';

export const EmployeeListPage = () => {
  const { data: employees, isLoading, isError } = useEmployees();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const navigate = useNavigate();

  const filtered = employees?.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="emp-page">
      <PageHeader 
        title="Employees" 
        subtitle="Manage your workforce"
        actions={
          <Button variant="primary">NEW</Button>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden font-[Caveat] text-lg">
          <button 
            className={`px-6 py-1 ${view === 'kanban' ? 'bg-blue-100 text-blue-600 font-bold' : 'hover:bg-elevated text-muted'}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
          <div className="w-px bg-border"></div>
          <button 
            className={`px-6 py-1 ${view === 'list' ? 'bg-blue-100 text-blue-600 font-bold' : 'hover:bg-elevated text-muted'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>

      {isLoading && <div className="emp-loading">Loading employees...</div>}
      
      {isError && <div className="emp-error">Failed to load employees.</div>}

      {filtered && filtered.length > 0 ? (
        view === 'kanban' ? (
          <div className="emp-grid">
            {filtered.map(emp => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-elevated/30">
                  <th className="p-4 font-[Caveat] font-bold text-muted">Employee</th>
                  <th className="p-4 font-[Caveat] font-bold text-muted">Work Email</th>
                  <th className="p-4 font-[Caveat] font-bold text-muted">Job Position</th>
                  <th className="p-4 font-[Caveat] font-bold text-muted">Department</th>
                  <th className="p-4 font-[Caveat] font-bold text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="border-t border-border hover:bg-elevated/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-[Caveat] text-lg font-bold">{emp.name}</td>
                    <td className="p-4 font-[Caveat] text-lg">{emp.email}</td>
                    <td className="p-4 font-[Caveat] text-lg">{emp.jobPosition}</td>
                    <td className="p-4 font-[Caveat] text-lg">{emp.department}</td>
                    <td className="p-4 font-[Caveat] text-lg text-success">{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        !isLoading && <div className="emp-empty font-[Caveat] text-xl text-muted text-center mt-10">No employees found.</div>
      )}
    </div>
  );
};
