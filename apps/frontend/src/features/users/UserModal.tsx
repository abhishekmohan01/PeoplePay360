import React, { useState, useEffect } from 'react';
import { useCreateUser, useUpdateUser } from './useUsers';
import { useEmployees } from '../employees/useEmployees';
import { Button } from '../../components/ui/Button';
import type { UserAccount } from '../../api/users';
import { 
  X, 
  UserPlus, 
  Shield, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Info 
} from 'lucide-react';

interface UserModalProps {
  user?: UserAccount | null;
  onClose: () => void;
  defaultEmployeeId?: string;
}

const AVAILABLE_ROLES = [
  { 
    code: 'EMPLOYEE', 
    label: 'Employee', 
    desc: 'Self-service attendance punch-in & time-off requests' 
  },
  { 
    code: 'HR_MANAGER', 
    label: 'HR Manager', 
    desc: 'Workforce directory, employment contracts, and attendance admin' 
  },
  { 
    code: 'TIME_OFF_ADMIN', 
    label: 'Time Off Admin', 
    desc: 'Review team leave requests and manage leave quota allocations' 
  },
  { 
    code: 'PAYROLL_USER', 
    label: 'HR Payroll User', 
    desc: 'Run payrun batches, compute salary structures, and validate payslips' 
  },
  { 
    code: 'ADMIN', 
    label: 'Admin', 
    desc: 'Full superuser organizational permissions and user management' 
  },
];

export const UserModal: React.FC<UserModalProps> = ({ user, onClose, defaultEmployeeId }) => {
  const isEditing = Boolean(user);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const isPending = isCreating || isUpdating;

  const { data: employees } = useEmployees();
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>(['EMPLOYEE']);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill when editing an existing user or creating with defaultEmployeeId
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setEmployeeId(user.employeeId || '');
      setEmployeeName(user.employeeName || '');
      setStatus(user.status?.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active');

      if (Array.isArray(user.roles) && user.roles.length > 0) {
        const codes = user.roles.map(r => (r as any).code?.toUpperCase() || (r as any).name?.toUpperCase() || (r as any).role?.code?.toUpperCase());
        setSelectedRoleCodes(codes.filter(Boolean));
      } else if (user.role) {
        const matching = AVAILABLE_ROLES.find(r => 
          r.label.toLowerCase() === user.role.toLowerCase() ||
          r.code.toLowerCase() === user.role.toLowerCase()
        );
        setSelectedRoleCodes([matching ? matching.code : 'EMPLOYEE']);
      }
    } else {
      const targetEmpId = defaultEmployeeId || '';
      setEmployeeId(targetEmpId);
      const emp = employees?.find(e => e.id === targetEmpId);
      if (emp) {
        setEmployeeName(emp.name);
        setEmail(emp.email || emp.workEmail || '');
      } else {
        setEmployeeName('');
        setEmail('');
      }
      setSelectedRoleCodes(['EMPLOYEE']);
      setStatus('Active');
    }
  }, [user, defaultEmployeeId, employees]);

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setEmployeeId(selectedId);
    const emp = employees?.find(em => em.id === selectedId);
    if (emp) {
      setEmployeeName(emp.name);
      if (!email || !isEditing) {
        setEmail(emp.email || emp.workEmail || '');
      }
    }
  };

  const toggleRole = (code: string) => {
    setSelectedRoleCodes(prev => {
      if (prev.includes(code)) {
        // Prevent deselecting all roles (must have at least one role)
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError('Work email address is required.');
      return;
    }

    if (selectedRoleCodes.length === 0) {
      setFormError('Please assign at least one security role.');
      return;
    }

    if (isEditing && user) {
      updateUser(
        {
          id: user.id,
          data: {
            email: email.trim(),
            employeeId: employeeId || null,
            status: status.toUpperCase(),
            roleCodes: selectedRoleCodes,
          }
        },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => {
            setFormError(err.message || 'Failed to update user access.');
          }
        }
      );
    } else {
      createUser(
        {
          employeeId: employeeId || null,
          email: email.trim(),
          password: 'password123',
          roleCodes: selectedRoleCodes,
          status: status.toUpperCase(),
        },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => {
            setFormError(err.message || 'Failed to provision user.');
          }
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border animate-in zoom-in-95 my-8 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              {isEditing ? <Shield size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-text-primary m-0">
                {isEditing ? 'Create / Edit User' : 'Create / Edit User'}
              </h3>
              <p className="text-xs text-text-muted m-0">
                {isEditing ? 'Update organizational roles and account status' : 'Link employee account and assign one or more roles'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1 rounded-lg hover:bg-elevated"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form with Fixed Header & Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500 font-medium">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Link Employee Profile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Employee *
              </label>
              <select 
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary cursor-pointer transition-colors"
                value={employeeId}
                onChange={handleEmployeeChange}
              >
                <option value="">Select employee (or Direct System Account)</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.jobPosition} ({emp.departmentName || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Work Email *
              </label>
              <input 
                type="email" 
                className="border border-border bg-surface text-text-primary p-2.5 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                placeholder="employee@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Multiple Roles Selection (Checkboxes) */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Roles * <span className="text-[11px] font-normal lowercase text-text-muted">(select one or more)</span>
                </label>
                <span className="text-[11px] text-primary font-bold">
                  {selectedRoleCodes.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_ROLES.map(r => {
                  const isSelected = selectedRoleCodes.includes(r.code);
                  return (
                    <div 
                      key={r.code} 
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => toggleRole(r.code)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleRole(r.code);
                        }
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40' 
                          : 'border-border bg-surface hover:bg-elevated hover:border-border/80 text-text-secondary'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`}>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                            {r.label}
                          </span>
                          {r.code === 'ADMIN' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                              Superuser
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted m-0 mt-0.5 leading-relaxed">
                          {r.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Status */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Account Status
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('Active')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'Active'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-border bg-surface text-text-muted hover:bg-elevated'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('Inactive')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'Inactive'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                      : 'border-border bg-surface text-text-muted hover:bg-elevated'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Inactive</span>
                </button>
              </div>
            </div>

            {/* ERP Note from Excalidraw mockup */}
            <div className="p-3 bg-elevated/50 border border-border rounded-xl flex items-start gap-2 text-[11px] text-text-muted leading-relaxed mt-1">
              <Info size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
              <span>
                User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
              </span>
            </div>
          </div>

          {/* Fixed Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border bg-surface flex-shrink-0 z-10 shadow-xs">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPending} disabled={isPending}>
              {isPending 
                ? (isEditing ? 'Saving Access...' : 'Creating User...') 
                : 'Create User / Save Access'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
