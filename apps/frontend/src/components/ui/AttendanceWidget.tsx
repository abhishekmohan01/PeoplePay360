import React, { useState, useEffect, useRef } from 'react';
import { useAttendanceStatus, useCheckIn, useCheckOut } from '../../features/attendance/useAttendance';
import { useAuthStore } from '../../stores/auth.store';
import { format } from 'date-fns';

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
              setFeedback('✓ WFH attendance logged! Sent to HR for review.');
            } else {
              setFeedback('✓ Checked in successfully!');
            }
            setTimeout(() => {
              setFeedback(null);
              setIsOpen(false);
            }, 2500);
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
          // If denied or failed, still allow punch with soft capture
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
        }, 2000);
      },
      onError: (err: any) => {
        setFeedback(`Error: ${err?.message || 'Failed to check out'}`);
      },
    });
  };

  // Format check-in time if available
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-elevated transition-all font-[Caveat] text-lg font-bold shadow-sm cursor-pointer"
        title="Quick Attendance Punch"
      >
        <span
          className={`w-3 h-3 rounded-full inline-block transition-colors ${
            isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-text-primary text-sm font-sans font-medium">
          {isLoading ? '...' : isCheckedIn ? 'Checked In' : 'Checked Out'}
        </span>
      </button>

      {/* Popup Dialog */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-surface border-2 border-border/90 rounded-2xl shadow-2xl p-5 z-50 font-primary animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'
                }`}
              />
              <h3 className="font-[Caveat] font-bold text-2xl text-text-primary m-0">Attendance Widget</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-text-primary text-xl leading-none font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* User greeting */}
          <p className="font-[Caveat] text-xl text-text-primary m-0 mb-3">
            Welcome back, <span className="font-bold text-accent">{user?.name || 'Employee'}</span>!
          </p>

          {/* Status content */}
          {isCheckedIn ? (
            <div className="space-y-4 font-[Caveat] text-lg">
              <div className="bg-elevated/80 border border-border/80 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-muted text-sm block font-sans">Session Started</span>
                  <span className="font-bold text-text-primary text-xl">{checkInDisplay} — Now</span>
                </div>
                <div className="text-right">
                  <span className="text-muted text-sm block font-sans">Elapsed</span>
                  <span className="font-bold text-emerald-400 text-xl">{elapsedStr}</span>
                </div>
              </div>

              {status?.activeRecord?.notes && (
                <div className="text-xs font-sans text-muted bg-surface/50 border border-border/40 rounded-lg p-2">
                  📝 {status.activeRecord.notes}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-[Caveat] text-2xl font-bold tracking-wider transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {checkOutMutation.isPending ? 'Punching Out...' : 'Check Out'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 font-[Caveat] text-lg">
              <div className="bg-elevated/80 border border-border/80 rounded-xl p-3">
                <span className="text-muted text-sm block font-sans mb-1">Select Work Mode</span>
                <div className="grid grid-cols-2 gap-2 mt-1 font-sans text-sm">
                  <button
                    type="button"
                    onClick={() => setWorkMode('OFFICE')}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                      workMode === 'OFFICE'
                        ? 'border-accent bg-accent/15 text-accent font-bold shadow-sm'
                        : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                    }`}
                  >
                    🏢 In-Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode('WFH')}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                      workMode === 'WFH'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-sm'
                        : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                    }`}
                  >
                    🏠 Remote / WFH
                  </button>
                </div>

                {workMode === 'WFH' && (
                  <div className="mt-2 text-xs font-sans text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2">
                    ⚠️ Remote check-in will be logged with location & sent to HR for review.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || isLocating}
                className="w-full py-2.5 px-4 bg-accent hover:opacity-90 text-white rounded-xl font-[Caveat] text-2xl font-bold tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLocating
                  ? 'Detecting Location...'
                  : checkInMutation.isPending
                  ? 'Punching In...'
                  : 'Check In'}
              </button>
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div className="mt-3 p-2 text-center text-xs font-sans rounded-lg bg-surface border border-border text-text-primary animate-pulse">
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
