import { useState, useMemo, useEffect } from 'react';
import { useSalaryStructures, usePayrollRules } from './usePayrollConfig';
import { SalaryStructureModal } from './SalaryStructureModal';
import { SalaryRuleModal } from './SalaryRuleModal';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Calculator, 
  FileText, 
  Lock, 
  Plus, 
  X, 
  Shield, 
  Info, 
  Search, 
  Filter, 
  Code2, 
  Check, 
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  Coins,
  Sparkles,
  Equal,
  Minus,
  Sliders,
  DollarSign
} from 'lucide-react';

export const PayrollConfigPage = () => {
  const { data: structures, isLoading: isLoadingStructs } = useSalaryStructures();
  const { data: allRules, isLoading: isLoadingRules } = usePayrollRules();
  const canEdit = useAuthStore((state) => state.canEditPayrollConfig)();

  // Active Structure Selection (Master-Detail)
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  
  // Set default structure once structures load
  useEffect(() => {
    if (structures && structures.length > 0 && !selectedStructureId) {
      const activeOne = structures.find(s => s.status === 'Active') || structures[0];
      if (activeOne) setSelectedStructureId(activeOne.id);
    }
  }, [structures, selectedStructureId]);

  // View Mode: 'BLUEPRINT' (Master-Detail Studio) | 'CATALOG' (All Rules Table)
  const [viewMode, setViewMode] = useState<'BLUEPRINT' | 'CATALOG'>('BLUEPRINT');

  // Interactive Live Wage Simulator
  const [simulatedWage, setSimulatedWage] = useState<number>(90000);

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<'ALL' | 'ALLOWANCE' | 'DEDUCTION' | 'BASE_NET'>('ALL');
  const [catalogStructureFilter, setCatalogStructureFilter] = useState<string>('ALL');

  // Modals
  const [inspectStruct, setInspectStruct] = useState<any | null>(null);
  const [inspectRule, setInspectRule] = useState<any | null>(null);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleCategory, setNewRuleCategory] = useState<'ALLOWANCE' | 'DEDUCTION' | 'BASIC' | 'GROSS' | 'NET'>('ALLOWANCE');

  // Current Active Structure
  const activeStructure = useMemo(() => {
    if (!structures || structures.length === 0) return null;
    return structures.find(s => s.id === selectedStructureId) || structures[0] || null;
  }, [structures, selectedStructureId]);

  // Sync simulated wage when active structure changes
  useEffect(() => {
    if (activeStructure) {
      setSimulatedWage(Number(activeStructure.baseSalary) || 75000);
    }
  }, [activeStructure?.id, activeStructure?.baseSalary]);

  // Rules for Active Structure
  const structureRules = useMemo(() => {
    if (!allRules) return [];
    if (!activeStructure) return allRules;
    return allRules.filter(r => r.salaryStructureId === activeStructure.id);
  }, [allRules, activeStructure]);

  // Categorized Rules for the Active Structure
  const earningsRules = useMemo(() => {
    return structureRules.filter(r => {
      const cat = (r.category || '').toUpperCase();
      return cat === 'BASIC' || cat === 'ALLOWANCE';
    });
  }, [structureRules]);

  const deductionRules = useMemo(() => {
    return structureRules.filter(r => {
      const cat = (r.category || '').toUpperCase();
      return cat === 'DEDUCTION';
    });
  }, [structureRules]);

  const formulaRules = useMemo(() => {
    return structureRules.filter(r => {
      const cat = (r.category || '').toUpperCase();
      return cat === 'GROSS' || cat === 'NET';
    });
  }, [structureRules]);

  // Helper to compute simulated amount for a rule based on simulatedWage
  const calculateSimulatedAmount = (rule: any, wage: number): { value: number | null; display: string } => {
    if (rule.computationType === 'PERCENTAGE_OF_WAGE' || String(rule.amount).includes('%')) {
      const match = String(rule.computationValue || rule.amount).match(/(\d+(\.\d+)?)/);
      const pct = match ? parseFloat(match[1] || '0') : 0;
      const val = Math.round((pct / 100) * wage);
      return { value: val, display: `₹${val.toLocaleString()}` };
    }
    if (rule.computationType === 'FIXED_AMOUNT' || (!isNaN(Number(rule.computationValue)) && Number(rule.computationValue) > 0)) {
      const val = Number(rule.computationValue || String(rule.amount).replace(/[^0-9.-]+/g, '')) || 0;
      return { value: val, display: `₹${val.toLocaleString()}` };
    }
    return { value: null, display: 'Variable / Dynamic' };
  };

  // Live Summary Calculations
  const simulatedTotals = useMemo(() => {
    let gross = 0;
    let deductions = 0;

    for (const r of earningsRules) {
      const res = calculateSimulatedAmount(r, simulatedWage);
      if (res.value !== null) gross += res.value;
    }

    for (const r of deductionRules) {
      const res = calculateSimulatedAmount(r, simulatedWage);
      if (res.value !== null) deductions += res.value;
    }

    const net = Math.max(0, gross - deductions);

    return { gross, deductions, net };
  }, [earningsRules, deductionRules, simulatedWage]);

  // Catalog Filtered Rules
  const catalogFilteredRules = useMemo(() => {
    if (!allRules) return [];
    return allRules.filter(rule => {
      if (catalogStructureFilter !== 'ALL' && rule.salaryStructureId && rule.salaryStructureId !== catalogStructureFilter) {
        return false;
      }
      const cat = (rule.category || '').toUpperCase();
      if (catalogCategory === 'ALLOWANCE' && cat !== 'ALLOWANCE') return false;
      if (catalogCategory === 'DEDUCTION' && cat !== 'DEDUCTION') return false;
      if (catalogCategory === 'BASE_NET' && (cat === 'ALLOWANCE' || cat === 'DEDUCTION')) return false;

      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return rule.name.toLowerCase().includes(q) || rule.code.toLowerCase().includes(q) || rule.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allRules, catalogStructureFilter, catalogCategory, catalogSearch]);

  const openAddRule = (cat: 'ALLOWANCE' | 'DEDUCTION' | 'BASIC' | 'GROSS' | 'NET' = 'ALLOWANCE') => {
    setNewRuleCategory(cat);
    setIsRuleModalOpen(true);
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 pb-16">
      
      {/* Top Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary m-0">
                Payroll Configuration
              </h1>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Compensation architecture, salary structure blueprints, and statutory deduction policies
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-elevated/70 border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode('BLUEPRINT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'BLUEPRINT'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Structure Studio
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CATALOG')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'CATALOG'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Rules Catalog ({allRules?.length || 0})
            </button>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsStructureModalOpen(true)}>
                <Plus size={14} />
                <span>New Structure</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => openAddRule('ALLOWANCE')}>
                <Plus size={14} />
                <span>Add Rule</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
          <Lock size={15} />
          <span>You have Read-Only view permissions for Salary Structures & Rules under HR Payroll User policy.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: MASTER-DETAIL BLUEPRINT STUDIO (Default)                          */}
      {/* ========================================================================= */}
      {viewMode === 'BLUEPRINT' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Structure Selector Ribbon (Tabs) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Layers size={13} className="text-primary" /> Select Compensation Template
              </span>
              <span className="text-xs text-text-muted">
                {structures?.length || 0} active blueprints defined
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {isLoadingStructs ? (
                <div className="p-4 text-xs text-text-muted">Loading structures...</div>
              ) : (
                structures?.map((s) => {
                  const isSelected = activeStructure?.id === s.id;
                  const ruleCount = allRules ? allRules.filter(r => r.salaryStructureId === s.id).length : (s._count?.rules ?? 0);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStructureId(s.id)}
                      className={`flex flex-col items-start p-3.5 px-4 rounded-xl border text-left transition-all min-w-[240px] cursor-pointer group relative ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-sm'
                          : 'border-border bg-surface/70 hover:border-primary/40 hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                          {s.name}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>Base: <strong className="text-text-primary font-medium">₹{s.baseSalary?.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>{ruleCount} Rules</span>
                      </div>
                    </button>
                  );
                })
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(true)}
                  className="flex items-center gap-2 p-3.5 px-4 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 text-text-muted hover:text-primary transition-all text-xs font-semibold whitespace-nowrap cursor-pointer h-full min-h-[66px]"
                >
                  <Plus size={15} />
                  <span>New Template</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Structure Hero Banner & Live Calculator */}
          {activeStructure && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="flex flex-col gap-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-text-primary m-0">
                    {activeStructure.name}
                  </h2>
                  <StatusBadge status={activeStructure.status} />
                  {activeStructure.code && (
                    <span className="px-2 py-0.5 rounded-md bg-elevated border border-border text-[11px] font-mono text-text-muted font-semibold">
                      {activeStructure.code}
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-muted m-0 leading-relaxed">
                  Monthly wage calculation template configured with basic pay baseline, tax withholding, and progressive allowances. Applied to employee contracts during payrun computation.
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setInspectStruct(activeStructure)}
                    className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Info size={13} /> View Template Specifications
                  </button>
                </div>
              </div>

              {/* Real-time Simulated Compensation Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-elevated/40 border border-border rounded-xl p-3 sm:p-4">
                <div className="flex flex-col gap-1 pr-3 sm:border-r border-border">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Simulated Base Wage
                  </span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted font-semibold">₹</span>
                    <input
                      type="number"
                      step="1000"
                      value={simulatedWage}
                      onChange={(e) => setSimulatedWage(Math.max(0, Number(e.target.value) || 0))}
                      className="w-28 pl-6 pr-2 py-1 text-xs font-semibold bg-surface border border-border rounded-lg text-text-primary tabular-nums focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      Est. Gross
                    </span>
                    <span className="text-sm font-bold text-text-primary tabular-nums">
                      ₹{simulatedTotals.gross.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                      Deductions
                    </span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      -₹{simulatedTotals.deductions.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                      Net Pay
                    </span>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      ₹{simulatedTotals.net.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fresh Blueprint Guide when Structure has 0 Rules */}
          {structureRules.length === 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-heading font-bold text-text-primary m-0">
                    New Blueprint Ready for Configuration
                  </h4>
                  <p className="text-xs text-text-muted m-0 mt-0.5">
                    This salary structure template has 0 rules assigned. Start configuring allowances and deductions to build the compensation package.
                  </p>
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openAddRule('BASIC')}>
                    <Plus size={13} />
                    <span>Add Basic Pay</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => openAddRule('ALLOWANCE')}>
                    <Plus size={13} />
                    <span>Add Allowance</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Earnings & Allowances */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-text-primary m-0">
                    Earnings & Allowances
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Components added to employee gross compensation ({earningsRules.length} rules)
                  </span>
                </div>
              </div>

              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openAddRule('ALLOWANCE')}
                  className="text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Allowance</span>
                </Button>
              )}
            </div>

            {/* Structured Table for Earnings */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-semibold w-16">Seq</th>
                    <th className="pb-2.5 font-semibold">Component</th>
                    <th className="pb-2.5 font-semibold">Methodology</th>
                    <th className="pb-2.5 font-semibold text-right">Simulated Amount</th>
                    <th className="pb-2.5 font-semibold text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {earningsRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-text-muted">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={18} />
                          </div>
                          <span className="text-xs font-semibold text-text-primary">No Earnings or Allowances Configured</span>
                          <p className="text-[11px] text-text-muted m-0">
                            Configure basic pay, house rent allowance (HRA), or bonuses for this template.
                          </p>
                          {canEdit && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAddRule('ALLOWANCE')}
                              className="mt-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>Add Allowance</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    earningsRules.map((rule) => {
                      const sim = calculateSimulatedAmount(rule, simulatedWage);
                      const isPercentage = rule.computationType === 'PERCENTAGE_OF_WAGE' || String(rule.amount).includes('%');
                      const isFormula = rule.computationType === 'PYTHON_CODE' || String(rule.amount).includes('Formula');

                      return (
                        <tr key={rule.id} className="hover:bg-elevated/30 transition-colors group">
                          <td className="py-3 font-mono text-text-muted font-bold">
                            #{rule.sequence ?? 10}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{rule.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-elevated border border-border text-[10px] font-mono text-text-muted uppercase">
                                {rule.code}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            {isFormula ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
                                <Code2 size={11} /> fx Dynamic Formula
                              </span>
                            ) : isPercentage ? (
                              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Percent size={10} /> {rule.amount}
                              </span>
                            ) : (
                              <span className="text-text-secondary font-medium">
                                {rule.amount}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-semibold text-text-primary tabular-nums">
                            {sim.display}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectRule(rule)}
                              className="text-text-muted hover:text-primary transition-colors text-xs font-medium cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {earningsRules.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border font-semibold text-xs bg-emerald-500/[0.03]">
                      <td colSpan={3} className="py-3 px-2 text-text-primary">
                        Subtotal Earnings (Gross Target on ₹{simulatedWage.toLocaleString()} Wage)
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ₹{simulatedTotals.gross.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Section 2: Statutory & Voluntary Deductions */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Minus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-text-primary m-0">
                    Statutory & Policy Deductions
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Pre-tax and post-tax withholdings subtracted from gross salary ({deductionRules.length} rules)
                  </span>
                </div>
              </div>

              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openAddRule('DEDUCTION')}
                  className="text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Deduction</span>
                </Button>
              )}
            </div>

            {/* Structured Table for Deductions */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-semibold w-16">Seq</th>
                    <th className="pb-2.5 font-semibold">Deduction Component</th>
                    <th className="pb-2.5 font-semibold">Rate / Methodology</th>
                    <th className="pb-2.5 font-semibold text-right">Simulated Withholding</th>
                    <th className="pb-2.5 font-semibold text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {deductionRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-text-muted">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <Minus size={18} />
                          </div>
                          <span className="text-xs font-semibold text-text-primary">No Deductions Configured</span>
                          <p className="text-[11px] text-text-muted m-0">
                            Configure statutory withholdings like Provident Fund (PF), Professional Tax (PT), or TDS.
                          </p>
                          {canEdit && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAddRule('DEDUCTION')}
                              className="mt-1 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>Add Deduction</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    deductionRules.map((rule) => {
                      const sim = calculateSimulatedAmount(rule, simulatedWage);
                      const isPercentage = rule.computationType === 'PERCENTAGE_OF_WAGE' || String(rule.amount).includes('%');

                      return (
                        <tr key={rule.id} className="hover:bg-elevated/30 transition-colors group">
                          <td className="py-3 font-mono text-text-muted font-bold">
                            #{rule.sequence ?? 80}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{rule.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-elevated border border-border text-[10px] font-mono text-text-muted uppercase">
                                {rule.code}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            {isPercentage ? (
                              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <Percent size={10} /> {rule.amount}
                              </span>
                            ) : (
                              <span className="text-text-secondary font-medium">
                                {rule.amount}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                            -{sim.display}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectRule(rule)}
                              className="text-text-muted hover:text-primary transition-colors text-xs font-medium cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {deductionRules.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border font-semibold text-xs bg-rose-500/[0.03]">
                      <td colSpan={3} className="py-3 px-2 text-text-primary">
                        Total Monthly Deductions
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        -₹{simulatedTotals.deductions.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Section 3: Take-Home Pay Formulation (Engine Calculation) */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Calculator size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-text-primary m-0">
                    Net Take-Home Pay Formulation
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Automated computational logic driving final employee payslip disbursement
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Formula Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center text-center p-4 bg-elevated/40 border border-border rounded-xl">
              <div className="flex flex-col p-3 rounded-lg bg-surface border border-border">
                <span className="text-[10px] text-text-muted uppercase font-semibold">Gross Salary</span>
                <span className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
                  ₹{simulatedTotals.gross.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 mt-1">Base + Allowances</span>
              </div>

              <div className="flex items-center justify-center text-rose-500 font-bold text-base">
                <span className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center">−</span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-surface border border-border">
                <span className="text-[10px] text-text-muted uppercase font-semibold">Total Deductions</span>
                <span className="text-sm font-bold text-rose-600 tabular-nums mt-0.5">
                  ₹{simulatedTotals.deductions.toLocaleString()}
                </span>
                <span className="text-[10px] text-text-muted mt-1">PF + Professional Tax</span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-primary/10 border border-primary/25 text-primary">
                <span className="text-[10px] uppercase font-bold tracking-wider">Estimated Net Pay</span>
                <span className="text-base font-bold tabular-nums mt-0.5">
                  ₹{simulatedTotals.net.toLocaleString()}
                </span>
                <span className="text-[10px] text-primary/80 mt-1">Final Bank Transfer</span>
              </div>
            </div>

            {/* Formula Rules Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {formulaRules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => setInspectRule(rule)}
                  className="p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {rule.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated border border-border text-text-muted">
                      #{rule.sequence}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-elevated/70 font-mono text-[11px] text-text-secondary truncate border border-border/50">
                    {rule.computationValue || rule.amount}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                    <span>Variable Formula</span>
                    <span className="text-primary font-medium">Inspect Code ➔</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: ALL RULES CATALOG VIEW                                            */}
      {/* ========================================================================= */}
      {viewMode === 'CATALOG' && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                Company Compensation Rules Catalog
              </h3>
              <p className="text-xs text-text-muted m-0">
                Centralized registry of all salary calculation rules across templates
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={catalogStructureFilter}
                onChange={(e) => setCatalogStructureFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text-primary cursor-pointer"
              >
                <option value="ALL">All Structure Templates</option>
                {structures?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Filter rules by name, code, or type..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              {(['ALL', 'ALLOWANCE', 'DEDUCTION', 'BASE_NET'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategory(cat)}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    catalogCategory === cat
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface text-text-secondary border-border hover:bg-elevated'
                  }`}
                >
                  {cat === 'ALL' ? 'All Rules' : cat === 'ALLOWANCE' ? 'Allowances' : cat === 'DEDUCTION' ? 'Deductions' : 'Base & Net'}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-semibold w-16">Seq</th>
                  <th className="pb-2.5 font-semibold">Rule Name</th>
                  <th className="pb-2.5 font-semibold">Code</th>
                  <th className="pb-2.5 font-semibold">Category</th>
                  <th className="pb-2.5 font-semibold">Assigned Structure</th>
                  <th className="pb-2.5 font-semibold">Rate / Calculation</th>
                  <th className="pb-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {catalogFilteredRules.map((r) => (
                  <tr key={r.id} className="hover:bg-elevated/30 transition-colors">
                    <td className="py-3 font-mono text-text-muted font-bold">#{r.sequence ?? 10}</td>
                    <td className="py-3 font-semibold text-text-primary">{r.name}</td>
                    <td className="py-3 font-mono text-text-muted uppercase">{r.code}</td>
                    <td className="py-3">
                      <StatusBadge 
                        status={r.category} 
                        variant={
                          r.category === 'Allowance' ? 'success' : 
                          r.category === 'Deduction' ? 'error' : 'info'
                        } 
                      />
                    </td>
                    <td className="py-3 text-text-secondary">
                      {r.salaryStructure?.name || activeStructure?.name || 'Standard'}
                    </td>
                    <td className="py-3 font-medium text-text-primary">
                      {r.amount}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectRule(r)}
                        className="text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STRUCTURE INSPECTION MODAL                                                */}
      {/* ========================================================================= */}
      {inspectStruct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setInspectStruct(null)}
        >
          <div 
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-border p-6 animate-in zoom-in-95 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-text-primary m-0">
                    {inspectStruct.name}
                  </h3>
                  <span className="text-xs text-text-muted">Template Specifications</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInspectStruct(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Template Type</span>
                <span className="font-semibold text-text-primary">{inspectStruct.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Baseline Monthly Salary</span>
                <span className="font-semibold text-primary text-sm tabular-nums">
                  ₹{inspectStruct.baseSalary?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Lifecycle Status</span>
                <StatusBadge status={inspectStruct.status} />
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted font-medium">Configured Rules</span>
                <span className="font-semibold text-text-primary">
                  {allRules?.filter(r => !r.salaryStructureId || r.salaryStructureId === inspectStruct.id).length || 9} Rules
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-elevated/50 border border-border text-[11px] text-text-muted flex items-start gap-2">
              <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                Employee contracts referencing this template compute salary in sequence order with live attendance and overtime integration.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setInspectStruct(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RULE INSPECTION MODAL                                                     */}
      {/* ========================================================================= */}
      {inspectRule && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setInspectRule(null)}
        >
          <div 
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border p-6 animate-in zoom-in-95 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-text-primary m-0">
                    {inspectRule.name}
                  </h3>
                  <span className="text-xs font-mono text-text-muted uppercase font-semibold">
                    Code: {inspectRule.code}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInspectRule(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted font-medium">Category</span>
                <StatusBadge 
                  status={inspectRule.category} 
                  variant={
                    inspectRule.category === 'Allowance' ? 'success' : 
                    inspectRule.category === 'Deduction' ? 'error' : 'info'
                  } 
                />
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted font-medium">Execution Sequence</span>
                <span className="font-mono font-semibold text-text-primary">
                  Order #{inspectRule.sequence ?? 10}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted font-medium">Computation Format</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {inspectRule.amount}
                </span>
              </div>
            </div>

            {/* Formula Expression Details */}
            {(inspectRule.computationType === 'PYTHON_CODE' || String(inspectRule.computationValue).includes('return')) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Code2 size={13} className="text-primary" /> Computational Formula Expression
                </span>
                <div className="p-3 bg-elevated/70 border border-border rounded-xl font-mono text-xs text-text-primary overflow-x-auto">
                  {inspectRule.computationValue || inspectRule.amount}
                </div>
                <span className="text-[11px] text-text-muted">
                  Parameters supplied by execution engine: <code className="text-primary font-mono">wage</code>, <code className="text-primary font-mono">basic</code>, <code className="text-primary font-mono">gross</code>, <code className="text-primary font-mono">deductions</code>, <code className="text-primary font-mono">overtime</code>.
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-elevated/50 border border-border text-[11px] text-text-muted flex items-start gap-2 mt-1">
              <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Executes during monthly payroll generation to calculate itemized payslip breakdown.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setInspectRule(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Modal */}
      <SalaryStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onCreated={(newStruct) => {
          setSelectedStructureId(newStruct.id);
        }}
      />

      {/* Rule Modal */}
      <SalaryRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        defaultStructureId={activeStructure?.id || undefined}
        defaultCategory={newRuleCategory}
        onCreated={(newRule) => {
          if (newRule.salaryStructureId && newRule.salaryStructureId !== selectedStructureId) {
            setSelectedStructureId(newRule.salaryStructureId);
          }
        }}
      />

    </div>
  );
};
