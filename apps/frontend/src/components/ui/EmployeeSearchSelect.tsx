import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { useEmployeeSearch } from '../../features/employees/useEmployees';
import type { Employee } from '../../api/employees';
import './EmployeeSearchSelect.css';

interface EmployeeSearchSelectProps {
  /** Currently selected employee ID */
  value: string;
  onChange: (employeeId: string, employee: Employee | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  /** Filter to only ACTIVE employees (default: true) */
  activeOnly?: boolean;
}

const DEBOUNCE_MS = 300;
const PANEL_W = 360;

function computePos(rect: DOMRect): { top: number; left: number } {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const panelH = 280;
  const gap = 4;

  const spaceBelow = vh - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openBelow = spaceBelow >= panelH || spaceBelow >= spaceAbove;

  const top = openBelow ? rect.bottom + gap : rect.top - gap - panelH;
  let left = rect.left;
  if (left + PANEL_W > vw - 8) left = vw - PANEL_W - 8;
  if (left < 8) left = 8;

  return { top, left };
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  value,
  onChange,
  placeholder = 'Search employee name or code…',
  required,
  disabled,
  id,
  activeOnly = true,
}) => {
  const uid = useId();
  const inputId = id ?? uid;

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = useEmployeeSearch(debouncedQuery, 20);

  // ── Debounce input → query ─────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(v);
    }, DEBOUNCE_MS);
  };

  // ── Open panel and compute position ───────────────────────
  const openPanel = useCallback(() => {
    if (!wrapperRef.current) return;
    setPanelPos(computePos(wrapperRef.current.getBoundingClientRect()));
    setOpen(true);
  }, []);

  // ── Close on outside click ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        wrapperRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const reposition = () => {
      if (wrapperRef.current) setPanelPos(computePos(wrapperRef.current.getBoundingClientRect()));
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  // ── Keyboard navigation ────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        selectEmployee(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // ── Selecting an employee ──────────────────────────────────
  const selectEmployee = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setInputValue('');
    setDebouncedQuery('');
    setOpen(false);
    setActiveIndex(-1);
    onChange(emp.id, emp);
  }, [onChange]);

  // ── Clearing selection ─────────────────────────────────────
  const clearSelection = () => {
    setSelectedEmployee(null);
    setInputValue('');
    setDebouncedQuery('');
    onChange('', null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !panelRef.current) return;
    const items = panelRef.current.querySelectorAll('.emp-search-item');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const showHint = !open || debouncedQuery.length < 2;
  const showEmpty = open && debouncedQuery.length >= 2 && !isFetching && results.length === 0;
  const showLoading = open && debouncedQuery.length >= 2 && isFetching;

  // ── Panel ──────────────────────────────────────────────────
  const panel = open && panelPos ? (
    <div
      ref={panelRef}
      className="emp-search-panel"
      role="listbox"
      aria-label="Employee results"
      style={{ top: panelPos.top, left: panelPos.left, width: PANEL_W }}
    >
      {showLoading && (
        <div className="emp-search-state">
          <div className="emp-search-spinner" />
          <span>Searching…</span>
        </div>
      )}

      {showEmpty && (
        <div className="emp-search-state emp-search-state--empty">
          No employees found for "{debouncedQuery}"
        </div>
      )}

      {!showLoading && results.map((emp, idx) => (
        <button
          key={emp.id}
          type="button"
          role="option"
          aria-selected={idx === activeIndex}
          className={`emp-search-item${idx === activeIndex ? ' emp-search-item--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); selectEmployee(emp); }}
          onMouseEnter={() => setActiveIndex(idx)}
        >
          {/* Avatar initial */}
          <div className="emp-search-avatar">
            {(emp.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="emp-search-info">
            <span className="emp-search-name">
              {emp.firstName} {emp.lastName}
            </span>
            <span className="emp-search-meta">
              {emp.employeeCode}
              {emp.jobPosition ? ` · ${emp.jobPosition}` : ''}
              {emp.departmentName ? ` · ${emp.departmentName}` : ''}
            </span>
          </div>
          <span className={`emp-search-status emp-search-status--${(emp.status || 'active').toLowerCase()}`}>
            {emp.status || 'Active'}
          </span>
        </button>
      ))}

      {!showLoading && !showEmpty && results.length > 0 && (
        <div className="emp-search-footer">
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
          {results.length === 20 ? ' · refine search for more' : ''}
        </div>
      )}
    </div>
  ) : null;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="emp-search-root" ref={wrapperRef}>
      {selectedEmployee ? (
        // ── Selected chip ──────────────────────────────────
        <div className="emp-search-chip">
          <div className="emp-search-chip-avatar">
            {(selectedEmployee.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="emp-search-chip-info">
            <span className="emp-search-chip-name">
              {selectedEmployee.firstName} {selectedEmployee.lastName}
            </span>
            <span className="emp-search-chip-meta">
              {selectedEmployee.employeeCode}
              {selectedEmployee.jobPosition ? ` · ${selectedEmployee.jobPosition}` : ''}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              className="emp-search-chip-clear"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      ) : (
        // ── Search input ───────────────────────────────────
        <div className="emp-search-input-wrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="emp-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={openPanel}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required && !value}
            autoComplete="off"
            spellCheck={false}
            className="emp-search-input"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-haspopup="listbox"
            role="combobox"
          />
          {inputValue && (
            <button
              type="button"
              className="emp-search-clear-input"
              onClick={() => { setInputValue(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          {showHint && !inputValue && (
            <span className="emp-search-hint">Type 2+ characters</span>
          )}
        </div>
      )}

      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
};
