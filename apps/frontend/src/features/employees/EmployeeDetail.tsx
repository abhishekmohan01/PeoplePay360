import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEmployee } from './useEmployees';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmployeeModal } from './EmployeeModal';
import { UserModal } from '../users/UserModal';
import { 
  Calendar, 
  FileText, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase,
  Lock,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit3,
  CreditCard,
  Hash,
  Copy,
  Check,
  Building2,
  CalendarCheck,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Users,
  ExternalLink,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError } = useEmployee(employeeId!);
  const canManageHR = useAuthStore((state) => state.canManageHR)();
  const currentUser = useAuthStore((state) => state.user);
  const isEmployeeOnly = useAuthStore((state) => state.isEmployeeOnly)();
  const isViewingColleague = isEmployeeOnly && currentUser?.employeeId && currentUser.employeeId !== employeeId;

  const [activeTab, setActiveTab] = useState<'work' | 'private' | 'contracts'>('work');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showAccountMask, setShowAccountMask] = useState(true);
  const [copied, setCopied] = useState(false);

  // Skeleton shimmer state for initial cold loads
  if (isLoading && !employee) {
    return (
      <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 animate-pulse">
        <div className="h-6 w-48 bg-elevated rounded-lg mb-6" />
        <div className="h-44 bg-surface border border-border rounded-2xl p-6 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="h-20 bg-surface border border-border rounded-xl" />
          <div className="h-20 bg-surface border border-border rounded-xl" />
          <div className="h-20 bg-surface border border-border rounded-xl" />
          <div className="h-20 bg-surface border border-border rounded-xl" />
        </div>
        <div className="h-10 w-80 bg-elevated rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-surface border border-border rounded-xl" />
          <div className="h-64 bg-surface border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Employee Profile Not Found</h2>
        <p className="text-xs text-text-muted mb-6">
          The requested employee record could not be retrieved. It may have been archived or removed.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/employees')}>
          Return to Employee Directory
        </Button>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (employee?.employeeCode) {
      navigator.clipboard.writeText(employee.employeeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatEmploymentType = (type?: string) => {
    if (!type) return 'Full-time';
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('-');
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 animate-in fade-in-50 duration-200">
      
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Directory</span>
          </button>
          <ChevronRight size={13} className="text-text-muted/60" />
          <span className="text-text-muted">Workforce</span>
          <ChevronRight size={13} className="text-text-muted/60" />
          <span className="text-text-primary font-semibold">{employee.name}</span>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2">
          {canManageHR && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-1.5 cursor-pointer hover:border-primary transition-colors"
              >
                <Shield size={14} className="text-primary" />
                <span className="hidden sm:inline">
                  {employee.user ? 'Manage Roles' : 'Assign Roles'}
                </span>
              </Button>

              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hero Profile Header Card */}
      <div className="relative bg-surface border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
        {/* Subtle decorative gradient banner */}
        <div className="h-14 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border/40" />

        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-7">
            
            {/* Left: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative flex-shrink-0">
                <Avatar name={employee.name} size="lg" className="w-20 h-20 text-xl ring-4 ring-[var(--surface)] shadow-md" />
                <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full ring-2 ring-[var(--surface)] ${
                  (employee.status || '').toUpperCase() === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`} />
              </div>

              <div className="flex flex-col mb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary m-0">
                    {employee.name}
                  </h1>
                  <StatusBadge status={employee.status} />
                  {employee.employeeCode && (
                    <span className="px-2 py-0.5 font-mono text-[11px] font-semibold rounded-md bg-elevated text-text-secondary border border-border">
                      {employee.employeeCode}
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-text-secondary mt-1 flex items-center gap-2">
                  <span>{employee.jobPosition || 'Employee'}</span>
                  <span>•</span>
                  <span className="text-primary font-medium">
                    {employee.departmentName || employee.department?.name || 'General Department'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated/60 border border-border/80">
                <Building2 size={13} className="text-text-muted" />
                <span>{employee.companyName || 'PeoplePay360 Inc.'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated/60 border border-border/80">
                <MapPin size={13} className="text-text-muted" />
                <span>{employee.workLocation || 'Headquarters'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated/60 border border-border/80">
                <Mail size={13} className="text-text-muted" />
                <span className="font-mono">{employee.email || employee.workEmail}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Smart Interactive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        
        {/* Metric 1: Contracts */}
        <div 
          onClick={() => setActiveTab('contracts')}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Contracts</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={14} />
            </div>
          </div>
          <div className="text-xl font-heading font-bold text-text-primary">
            {employee._count?.contracts ?? 0}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 truncate">
            {employee.contracts?.[0] ? `${employee.contracts[0].contractNumber || 'Active'} • Linked` : 'View contract history'}
          </div>
        </div>

        {/* Metric 2: Attendance */}
        <div 
          onClick={() => navigate(`/attendance?employeeId=${employee.id}`)}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Attendance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl font-heading font-bold text-text-primary">
            {employee._count?.attendances ?? 0}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 truncate">
            Timesheets & punches ➔
          </div>
        </div>

        {/* Metric 3: Time Off */}
        <div 
          onClick={() => navigate(`/time-off?employeeId=${employee.id}`)}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Time Off</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={14} />
            </div>
          </div>
          <div className="text-xl font-heading font-bold text-text-primary">
            {employee._count?.timeOffRequests ?? 0}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 truncate">
            Leaves & allocations ➔
          </div>
        </div>

        {/* Metric 4: System Roles Access */}
        <div 
          onClick={() => {
            if (canManageHR) setIsUserModalOpen(true);
            else setActiveTab('private');
          }}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Security Access</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={14} />
            </div>
          </div>
          <div className="text-xl font-heading font-bold text-text-primary truncate">
            {employee.user ? (
              employee.user.roles?.length ? `${employee.user.roles.length} Roles` : 'Active Login'
            ) : (
              'No Login'
            )}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 truncate">
            {employee.user ? 'Configured permissions' : 'Click to grant access'}
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('work')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm cursor-pointer transition-colors relative flex items-center gap-2 ${
            activeTab === 'work'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Briefcase size={15} />
          <span>Work Information</span>
        </button>

        {!isViewingColleague && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('private')}
              className={`pb-3 px-3 font-semibold text-xs sm:text-sm cursor-pointer transition-colors relative flex items-center gap-2 ${
                activeTab === 'private'
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Lock size={15} />
              <span>Private Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`pb-3 px-3 font-semibold text-xs sm:text-sm cursor-pointer transition-colors relative flex items-center gap-2 ${
                activeTab === 'contracts'
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText size={15} />
              <span>Contracts &amp; Salary</span>
            </button>
          </>
        )}
      </div>

      {isViewingColleague && (
        <div className="mb-4 p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 text-xs text-text-secondary">
          <ShieldCheck size={16} className="text-primary flex-shrink-0" />
          <span>
            <strong>Public Directory View:</strong> You are viewing standard public work information for your colleague. Private PII and compensation details are restricted.
          </span>
        </div>
      )}

      {/* TAB 1: WORK & ORGANIZATION */}
      {activeTab === 'work' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-150">
          
          {/* Card 1: Hierarchy & Organization */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-primary" />
                <span>Organization & Team</span>
              </div>
              <span className="text-[11px] font-normal text-text-muted font-mono">
                {employee.companyName || 'Acme PeoplePay Corp'}
              </span>
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Assigned Department</label>
              <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span>{employee.departmentName || employee.department?.name || 'General Department'}</span>
                {employee.department?.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated border border-border text-text-secondary">
                    {employee.department.code}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Reports To (Manager)</label>
              <div className="text-sm font-semibold text-text-primary">
                {employee.manager ? (
                  <Link 
                    to={`/employees/${employee.manager.id}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <UserCheck size={14} />
                    <span>{employee.manager.firstName} {employee.manager.lastName}</span>
                    <span className="text-xs text-text-muted font-normal">
                      ({employee.manager.jobPosition || 'Manager'})
                    </span>
                  </Link>
                ) : (
                  <span className="text-text-secondary italic text-xs">
                    Executive / Top-level (No direct manager assigned)
                  </span>
                )}
              </div>
            </div>

            {/* Direct Reports / Subordinates */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <label className="text-xs font-medium text-text-muted flex items-center justify-between">
                <span>Direct Reports ({employee.subordinates?.length || 0})</span>
              </label>
              {employee.subordinates && employee.subordinates.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {employee.subordinates.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/employees/${sub.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-elevated/50 hover:bg-elevated border border-border text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={`${sub.firstName} ${sub.lastName}`} size="sm" />
                        <div>
                          <div className="font-semibold text-text-primary">
                            {sub.firstName} {sub.lastName}
                          </div>
                          <div className="text-[10px] text-text-muted">{sub.jobPosition}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">{sub.employeeCode}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-text-muted italic">
                  Individual Contributor (No direct subordinate team members)
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-border">
              <label className="text-xs font-medium text-text-muted">Working Schedule</label>
              <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                <span>{employee.workingSchedule || 'Standard 40h Full-Time (Mon - Fri)'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Position & Contact Info */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-3 border-b border-border flex items-center gap-1.5">
              <Briefcase size={14} className="text-primary" />
              <span>Position & Terms</span>
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Employment Classification</label>
              <div className="text-sm font-semibold text-text-primary">
                {formatEmploymentType(employee.employeeType)}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Assigned Work Location</label>
              <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <MapPin size={14} className="text-text-muted" />
                <span>{employee.workLocation || 'Corporate Headquarters'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Work Email Address</label>
              <div className="text-sm font-semibold text-text-primary font-mono flex items-center gap-1.5">
                <Mail size={13} className="text-text-muted" />
                <a href={`mailto:${employee.email || employee.workEmail}`} className="hover:underline text-text-primary">
                  {employee.email || employee.workEmail}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Direct Phone</label>
              <div className="text-sm font-semibold text-text-primary">
                {employee.workPhone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-text-muted" />
                    <span>{employee.workPhone}</span>
                  </span>
                ) : (
                  <span className="text-text-muted italic text-xs">No direct extension assigned</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-border">
              <label className="text-xs font-medium text-text-muted">Hire & Audit Record</label>
              <div className="text-xs text-text-secondary flex items-center gap-2">
                <CalendarCheck size={13} className="text-text-muted" />
                <span>
                  Member since {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '2026'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRIVATE & SECURITY */}
      {activeTab === 'private' && (
        <div className="flex flex-col gap-6 animate-in fade-in-50 duration-150">
          
          {/* Compliance & Privacy Notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary m-0">Confidential HR & Banking Details</h4>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Disbursement accounts, tax identifiers, and security credentials are protected under HR privacy protocols.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Banking Details Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-primary" />
                  <span>Banking & Payroll Disbursement</span>
                </h3>
                {canManageHR && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit Banking</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Bank Name</label>
                <div className="text-sm font-semibold text-text-primary">
                  {employee.bankName || <span className="text-text-muted italic text-xs">Not Provided</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-muted">Disbursement Account Number</label>
                  {employee.bankAccountNumber && (
                    <button
                      type="button"
                      onClick={() => setShowAccountMask(!showAccountMask)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showAccountMask ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{showAccountMask ? 'Reveal Number' : 'Mask'}</span>
                    </button>
                  )}
                </div>
                <div className="text-sm font-mono font-semibold text-text-primary">
                  {employee.bankAccountNumber ? (
                    showAccountMask ? (
                      `•••• •••• •••• ${employee.bankAccountNumber.slice(-4)}`
                    ) : (
                      employee.bankAccountNumber
                    )
                  ) : (
                    <span className="text-text-muted italic text-xs">No bank account linked</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Bank Identifier Code (BIC / SWIFT / Routing)</label>
                <div className="text-sm font-mono font-semibold text-text-primary">
                  {employee.bankIdentifierCode || <span className="text-text-muted italic font-sans text-xs">None Provided</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t border-border">
                <label className="text-xs font-medium text-text-muted">Disbursement Channel</label>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    employee.bankAccountNumber 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${employee.bankAccountNumber ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {employee.bankAccountNumber ? 'Direct Deposit Active' : 'Manual / Check Disbursement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Identification & Audit Card */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-3 border-b border-border flex items-center gap-1.5">
                <Hash size={14} className="text-primary" />
                <span>Identification & Audit Logs</span>
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Employee System Code</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold bg-elevated px-2 py-1 rounded border border-border text-text-primary">
                    {employee.employeeCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy code"
                    className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-elevated transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  {copied && <span className="text-[11px] text-emerald-500 font-medium">Copied!</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Personal Contact Channel</label>
                <div className="text-sm font-semibold text-text-primary">
                  {employee.workPhone || <span className="text-text-muted italic text-xs">Not Provided</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Record Created In Database</label>
                <div className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <CalendarCheck size={13} className="text-text-muted" />
                  <span>
                    {employee.createdAt 
                      ? new Date(employee.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-muted">Last Profile Update</label>
                <div className="text-xs font-medium text-text-secondary">
                  {employee.updatedAt 
                    ? new Date(employee.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>
              </div>
            </div>

          </div>

          {/* System Security Roles Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="text-primary" size={16} />
                <div>
                  <h3 className="text-sm font-heading font-bold text-text-primary m-0">
                    System Security Roles & Login Access
                  </h3>
                  <p className="text-xs text-text-muted m-0">
                    ERP authentication credentials and functional permissions assigned to this user
                  </p>
                </div>
              </div>
              {canManageHR && (
                <Button 
                  variant={employee.user ? "outline" : "primary"}
                  size="sm" 
                  onClick={() => setIsUserModalOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield size={14} />
                  <span>{employee.user ? 'Manage Roles' : '+ Grant Login & Assign Roles'}</span>
                </Button>
              )}
            </div>

            {employee.user ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Login Work Email</label>
                  <div className="text-sm font-semibold text-text-primary font-mono">
                    {employee.user.email}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Account Status</label>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {employee.user.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-1">
                  <label className="text-xs font-medium text-text-muted">
                    Assigned Roles ({employee.user.roles?.length || 0})
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {employee.user.roles && employee.user.roles.length > 0 ? (
                      employee.user.roles.map((r: any, idx: number) => {
                        const roleObj = r.role || r;
                        const code = roleObj.code || roleObj.name;
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                          >
                            <Shield size={10} />
                            {roleObj.name || code}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-text-muted italic">No specific roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-elevated/40 border border-dashed border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-text-muted/10 text-text-muted flex items-center justify-center flex-shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">No Linked User Login Account</div>
                    <div className="text-xs text-text-muted">
                      This employee does not currently have system login access or security roles assigned.
                    </div>
                  </div>
                </div>
                {canManageHR && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Assign Roles Now</span>
                  </Button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: CONTRACTS & COMPENSATION */}
      {activeTab === 'contracts' && (
        <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                Employment Contracts & Salary Terms
              </h3>
              <p className="text-xs text-text-muted m-0">
                Contractual agreements, wage structures, and payroll baselines
              </p>
            </div>
            {canManageHR && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/contracts?employeeId=${employee.id}`)}
                className="flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Contracts Center</span>
              </Button>
            )}
          </div>

          {employee.contracts && employee.contracts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5">
              {employee.contracts.map((contract) => (
                <div 
                  key={contract.id}
                  className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary m-0">
                          {contract.contractNumber || 'Contract Agreement'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          contract.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-elevated text-text-secondary border border-border'
                        }`}>
                          {contract.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        Structure: <span className="text-text-primary font-medium">{contract.salaryStructure?.name || 'Standard Full-Time'}</span>
                        {contract.workingSchedule?.name && (
                          <span> • Schedule: <span className="text-text-primary font-medium">{contract.workingSchedule.name}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Monthly Base Wage</div>
                      <div className="text-lg font-heading font-bold text-text-primary">
                        ₹{typeof contract.wage === 'number' ? contract.wage.toLocaleString() : (contract.wage || '0')}
                        <span className="text-xs text-text-muted font-normal"> / mo</span>
                      </div>
                    </div>

                    <Link
                      to={`/contracts/${contract.id}`}
                      className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-elevated/80 text-text-primary text-xs font-semibold flex items-center gap-1 border border-border transition-colors cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-surface border border-dashed border-border text-center flex flex-col items-center justify-center">
              <FileText size={32} className="text-text-muted mb-2 opacity-50" />
              <h4 className="text-sm font-semibold text-text-primary m-0">No Contracts Found</h4>
              <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
                This employee does not currently have an active employment contract or wage structure on file.
              </p>
              {canManageHR && (
                <Button variant="primary" size="sm" onClick={() => navigate(`/contracts?employeeId=${employee.id}`)}>
                  + Draft First Contract
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EmployeeModal
        isOpen={isEditOpen}
        employee={employee}
        onClose={() => setIsEditOpen(false)}
      />

      {/* User Roles & Access Modal */}
      {isUserModalOpen && (
        <UserModal
          user={employee.user ? ({
            id: employee.user.id,
            email: employee.user.email,
            status: employee.user.status,
            employeeId: employee.id,
            employeeName: employee.name,
            roles: employee.user.roles?.map((r: any) => r.role || r) || [],
          } as any) : null}
          defaultEmployeeId={employee.id}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

    </div>
  );
};
