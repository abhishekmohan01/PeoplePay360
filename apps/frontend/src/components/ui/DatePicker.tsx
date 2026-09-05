import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';
import './DatePicker.css';

interface DatePickerProps {
  /** YYYY-MM-DD string (or empty = no selection) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** YYYY-MM-DD — dates before this are disabled */
  minDate?: string;
  /** YYYY-MM-DD — dates after this are disabled */
  maxDate?: string;
  id?: string;
}

const toDate = (str: string | undefined): Date | null => {
  if (!str) return null;
  try {
    const d = parseISO(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const toYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const PANEL_W = 288; // fixed panel width in px
const PANEL_H = 320; // approx panel height in px
const GAP = 6;       // gap between trigger and panel

/** Compute the best fixed position for the floating panel */
function computePos(triggerRect: DOMRect): { top: number; left: number } {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Prefer opening below; fall back to above if not enough room
  const spaceBelow = vh - triggerRect.bottom - GAP;
  const spaceAbove = triggerRect.top - GAP;
  const openBelow = spaceBelow >= PANEL_H || spaceBelow >= spaceAbove;

  const top = openBelow
    ? triggerRect.bottom + GAP        // fixed: no scrollY
    : triggerRect.top - GAP - PANEL_H;

  // Align left edge to trigger; clamp so it doesn't overflow right edge
  let left = triggerRect.left;
  if (left + PANEL_W > vw - 8) {
    left = vw - PANEL_W - 8;
  }
  if (left < 8) left = 8;

  return { top, left };
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date…',
  required,
  disabled,
  minDate,
  maxDate,
  id,
}) => {
  const selected = toDate(value);
  const minD = toDate(minDate);
  const maxD = toDate(maxDate);

  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(selected ?? new Date());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Recalculate panel position whenever it opens
  const openPanel = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos(computePos(rect));
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => setOpen(false), []);

  // Close on outside click / scroll / resize
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        closePanel();
      }
    };
    const reposition = () => {
      if (triggerRef.current) {
        setPanelPos(computePos(triggerRef.current.getBoundingClientRect()));
      }
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, closePanel]);

  // Sync viewMonth to selected date when it changes externally
  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [value]);

  const isDisabled = (d: Date) =>
    (minD ? isBefore(d, minD) : false) || (maxD ? isAfter(d, maxD) : false);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (isDisabled(day)) return;
      onChange(toYMD(day));
      closePanel();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minDate, maxDate, onChange]
  );

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    if (!isDisabled(today)) {
      onChange(toYMD(today));
      closePanel();
    }
  };

  // Build 6-row × 7-col grid
  const buildGrid = () => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  };

  const displayLabel = selected ? format(selected, 'dd MMM yyyy') : '';

  const panel = open && panelPos ? (
    <div
      ref={panelRef}
      className="pp-dp-panel"
      role="dialog"
      aria-label="Date picker"
      style={{ top: panelPos.top, left: panelPos.left, width: PANEL_W }}
    >
      {/* ── Month header ── */}
      <div className="pp-dp-header">
        <button
          type="button"
          className="pp-dp-nav"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="pp-dp-month-label">{format(viewMonth, 'MMMM yyyy')}</span>
        <button
          type="button"
          className="pp-dp-nav"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="pp-dp-day-names">
        {DAY_LABELS.map((d) => (
          <span key={d} className="pp-dp-day-name">{d}</span>
        ))}
      </div>

      {/* ── Date grid ── */}
      <div className="pp-dp-grid">
        {buildGrid().map((day) => {
          const outside = !isSameMonth(day, viewMonth);
          const todayDay = isToday(day);
          const sel = selected ? isSameDay(day, selected) : false;
          const dis = isDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={dis}
              onClick={() => handleDayClick(day)}
              className={[
                'pp-dp-day',
                outside   ? 'pp-dp-day--outside'  : '',
                todayDay && !sel ? 'pp-dp-day--today' : '',
                sel       ? 'pp-dp-day--selected' : '',
                dis       ? 'pp-dp-day--disabled' : '',
              ].filter(Boolean).join(' ')}
              aria-label={format(day, 'dd MMMM yyyy')}
              aria-selected={sel}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="pp-dp-footer">
        <button type="button" className="pp-dp-today-btn" onClick={handleToday}>
          Today
        </button>
        {value && (
          <button
            type="button"
            className="pp-dp-clear-btn"
            onClick={() => { onChange(''); closePanel(); }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="pp-dp-root">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={open ? closePanel : openPanel}
        className={[
          'pp-dp-trigger',
          disabled ? 'pp-dp-trigger--disabled' : '',
          open      ? 'pp-dp-trigger--open'     : '',
        ].filter(Boolean).join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {/* Calendar icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pp-dp-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={displayLabel ? 'pp-dp-value' : 'pp-dp-placeholder'}>
          {displayLabel || placeholder}
        </span>
        {/* Chevron icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`pp-dp-chevron${open ? ' pp-dp-chevron--open' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Portal — renders outside all modals & overflow containers */}
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
};
