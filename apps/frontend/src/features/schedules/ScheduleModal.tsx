import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useCreateSchedule, useUpdateSchedule } from './useSchedules';
import { type Schedule } from '../../api/schedules';
import { X, Calendar, AlertCircle, Clock, Globe } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: Schedule | null;
}

const DAY_NAMES = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  scheduleToEdit,
}) => {
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setName(scheduleToEdit.name);
        setTimezone(scheduleToEdit.timezone || 'Asia/Kolkata');
        setSelectedDays([1, 2, 3, 4, 5]);
        setHoursPerDay(String(Math.round((scheduleToEdit.hoursPerWeek / 5) * 10) / 10 || 8));
      } else {
        setName('Standard 40h Working Schedule');
        setTimezone('Asia/Kolkata');
        setStartTime('09:00');
        setEndTime('18:00');
        setBreakMinutes('60');
        setHoursPerDay('8');
        setSelectedDays([1, 2, 3, 4, 5]);
      }
      setFormError(null);
    }
  }, [isOpen, scheduleToEdit]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length <= 1) {
        setFormError('Schedule must have at least one active working day.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a schedule name.');
      return;
    }
    if (selectedDays.length === 0) {
      setFormError('Please select at least one working day.');
      return;
    }

    const dailyH = Number(hoursPerDay) || 8;
    const daysPayload = selectedDays.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      breakMinutes: Number(breakMinutes) || 60,
      hours: dailyH,
    }));

    try {
      if (scheduleToEdit) {
        await updateMutation.mutateAsync({
          id: scheduleToEdit.id,
          data: {
            name: name.trim(),
            timezone,
            days: daysPayload,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          timezone,
          days: daysPayload,
        });
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save working schedule.');
    }
  };

  const calculatedTotalHours = selectedDays.length * (Number(hoursPerDay) || 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                {scheduleToEdit ? 'Edit Working Schedule' : 'New Working Schedule'}
              </h2>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Define shift timings, working days, and weekly base duration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Schedule Name */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Schedule Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard 40h Working Week"
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Globe size={13} className="text-primary" /> Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
            </select>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Shift Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Shift End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Break (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                step="15"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 flex items-center justify-between">
              <span>Working Days</span>
              <span className="text-primary font-semibold">
                {selectedDays.length} Days • {calculatedTotalHours}h / week
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface text-text-secondary border-border hover:border-primary/40'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending}
            >
              {isPending ? 'Saving...' : scheduleToEdit ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
