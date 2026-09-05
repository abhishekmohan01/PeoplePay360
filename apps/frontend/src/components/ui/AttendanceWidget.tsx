import React, { useState, useEffect, useRef } from 'react';
import { useAttendanceStatus, useCheckIn, useCheckOut } from '../../features/attendance/useAttendance';
import { useAuthStore } from '../../stores/auth.store';
import { format } from 'date-fns';
import { Clock, Building2, Home, X } from 'lucide-react';

export const AttendanceWidget: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { data: status, isLoading } = useAttendanceStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [isOpen, setIsOpen] = useState(false);
  const [workMode, setWorkMode] = useState<'OFFICE' | 'WFH'>('OFFICE');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCheckedIn = Boolean(status?.checkedIn);

  const handleCheckIn = () => {
    setIsLocating(true);
    setFeedback(null);

    const performPunch = (coords?: { latitude: number; longitude: number }) => {
      checkInMutation.mutate(
        {
          isWfh: workMode === 'WFH',
          locationType: workMode,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          notes: workMode === 'WFH' ? 'WFH remote check-in via TopNav widget' : 'Office check-in via TopNav widget',
        },
        {
          onSuccess: (data) => {
            setIsLocating(false);
            if (data?.isWfh) {
              setFeedback('✓ WFH logged! Sent to HR for review.');
            } else {
              setFeedback('✓ Checked in successfully!');
            }
            setTimeout(() => {
              setFeedback(null);
              setIsOpen(false);
            }, 2000);
          },
          onError: (err: any) => {
            setIsLocating(false);
            setFeedback(`Error: ${err?.message || 'Failed to check in'}`);
          },
        }
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          performPunch({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          performPunch();
        },
        { timeout: 5000 }
      );
    } else {
      performPunch();
    }
  };

  const handleCheckOut = () => {
    setFeedback(null);
    checkOutMutation.mutate(undefined, {
      onSuccess: () => {
        setFeedback('✓ Checked out successfully!');
        setTimeout(() => {
          setFeedback(null);
          setIsOpen(false);
        }, 1800);
      },
      onError: (err: any) => {
        setFeedback(`Error: ${err?.message || 'Failed to check out'}`);
      },
    });
  };

  let checkInDisplay = '—';
  if (status?.activeRecord?.checkIn) {
    try {
      checkInDisplay = format(new Date(status.activeRecord.checkIn), 'hh:mm a');
    } catch {
      checkInDisplay = String(status.activeRecord.checkIn);
    }
  }

  const elapsedMins = status?.elapsedMinutes ?? 0;
  const elapsedHours = Math.floor(elapsedMins / 60);
  const remainingMins = elapsedMins % 60;
  const elapsedStr = `${elapsedHours}h ${remainingMins}m`;

  return (
    <div className="relative inline-block" ref={widgetRef}>
      {/* TopNav Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-elevated transition-all text-xs font-medium shadow-sm cursor-pointer"
        title="Quick Attendance Punch"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full inline-block transition-colors ${
            isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-400'
          }`}
        />
        <span className="text-text-primary font-medium">
          {isLoading ? '...' : isCheckedIn ? 'Checked In' : 'Checked Out'}
        </span>
      </button>

      {/* Modern Glassmorphic Popup Dialog */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-red-400'
                }`}
              />
              <h4 className="font-heading font-semibold text-sm text-text-primary m-0">Quick Attendance</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-0.5 rounded"
            >
              <X size={16} />
            </button>
          </div>

          {/* User greeting */}
          <p className="text-xs text-text-secondary m-0 mb-3">
            Employee: <span className="font-semibold text-text-primary">{user?.name || 'Current User'}</span>
          </p>

          {/* Status content */}
          {isCheckedIn ? (
            <div className="space-y-3">
              <div className="bg-elevated/70 border border-border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-text-muted text-xs block">Checked In At</span>
                  <span className="font-semibold text-text-primary text-sm flex items-center gap-1 mt-0.5">
                    <Clock size={13} className="text-primary" /> {checkInDisplay}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted text-xs block">Elapsed</span>
                  <span className="font-bold text-emerald-500 text-sm">{elapsedStr}</span>
                </div>
              </div>

              {status?.activeRecord?.notes && (
                <div className="text-xs text-text-secondary bg-elevated/40 border border-border rounded-lg p-2">
                  📝 {status.activeRecord.notes}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending}
                className="w-full py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-elevated/70 border border-border rounded-lg p-3">
                <span className="text-text-muted text-xs block mb-2 font-medium">Select Work Location</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setWorkMode('OFFICE')}
                    className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      workMode === 'OFFICE'
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                    }`}
                  >
                    <Building2 size={14} /> In-Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode('WFH')}
                    className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      workMode === 'WFH'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                    }`}
                  >
                    <Home size={14} /> Remote / WFH
                  </button>
                </div>

                {workMode === 'WFH' && (
                  <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                    ⚠️ Remote punches are logged and routed to HR for review.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || isLocating}
                className="w-full py-2 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLocating
                  ? 'Capturing Location...'
                  : checkInMutation.isPending
                  ? 'Checking In...'
                  : 'Check In Now'}
              </button>
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div className="mt-2.5 p-2 text-center text-xs font-medium rounded-lg bg-surface border border-border text-text-primary">
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
