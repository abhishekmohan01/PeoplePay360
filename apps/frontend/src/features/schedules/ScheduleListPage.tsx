import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from './useSchedules';
import { ScheduleModal } from './ScheduleModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Clock, Users, Calendar, Globe, Edit2 } from 'lucide-react';
import { type Schedule } from '../../api/schedules';

export const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: schedules, isLoading } = useSchedules();
  const [search, setSearch] = useState('');
  const [filterStandardOnly, setFilterStandardOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);

  const totalSchedules = schedules?.length || 0;
  const standardSchedules = schedules?.filter((s) => s.hoursPerWeek >= 40).length || 0;
  const totalAssignedStaff = schedules?.reduce((sum, s) => sum + (s.assignedEmployees || 0), 0) || 0;

  const filtered = schedules?.filter((s) => {
    if (filterStandardOnly && (s.hoursPerWeek || 0) < 40) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.type || '').toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setScheduleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      <PageHeader 
        title="Working Schedules" 
        subtitle="Configure weekly working hours, rotational shifts, and policy assignments"
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>New Schedule</span>
          </Button>
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => { setFilterStandardOnly(false); setSearch(''); }}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            !filterStandardOnly && !search ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
          }`}
          title="Click to view all working schedules"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Schedules</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalSchedules}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            Operational shift policies
          </div>
        </div>

        <div 
          onClick={() => setFilterStandardOnly((prev) => !prev)}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            filterStandardOnly ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-emerald-500/40'
          }`}
          title="Click to toggle filter for standard 40h+ schedules"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Standard Shifts (40h)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-500">
            {standardSchedules}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {filterStandardOnly ? 'Active filter: Showing 40h+ (Click to reset)' : 'Click to filter standard 40h+ shifts'}
          </div>
        </div>

        <div 
          onClick={() => navigate('/employees')}
          className="bg-surface border border-border hover:border-indigo-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to view workforce directory"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Assigned Staff</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalAssignedStaff}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            View employee assignments ➔
          </div>
        </div>
      </div>

      {/* Search Bar & Active Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-full sm:w-80">
          <SearchInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schedules by name or type..."
          />
        </div>
        {filterStandardOnly && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-xs font-medium">
            <span>Filter: Standard Shifts (40h+)</span>
            <button 
              type="button" 
              onClick={() => setFilterStandardOnly(false)} 
              className="hover:opacity-75 cursor-pointer ml-1"
              title="Remove filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="p-12 text-center text-text-muted text-sm font-medium">
          Loading working schedules...
        </div>
      )}

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered?.map((schedule) => (
          <div 
            key={schedule.id} 
            className="bg-surface border border-border hover:border-primary/40 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-heading font-bold text-text-primary group-hover:text-primary transition-colors m-0">
                    {schedule.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                    <Globe size={13} />
                    <span>{schedule.timezone || 'Asia/Kolkata'}</span>
                  </div>
                </div>
                <StatusBadge status={schedule.status} />
              </div>
              
              <div className="space-y-2 py-3 border-y border-border/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Shift Type:</span>
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Calendar size={13} className="text-primary" /> {schedule.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Hours / Week:</span>
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Clock size={13} className="text-primary" /> {schedule.hoursPerWeek}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Assigned Workforce:</span>
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Users size={13} className="text-primary" /> {schedule.assignedEmployees} employees
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-end gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleOpenEdit(schedule)}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Edit2 size={13} />
                <span>Edit Schedule</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="p-12 text-center text-text-muted text-sm bg-surface border border-border rounded-xl">
          No working schedules found matching "{search}".
        </div>
      )}

      {/* Create / Edit Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scheduleToEdit={scheduleToEdit}
      />
    </div>
  );
};
