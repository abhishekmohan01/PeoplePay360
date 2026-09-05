import React, { useState, useEffect } from 'react';
import { useCreateEmployee, useUpdateEmployee, useDepartments, useEmployees } from './useEmployees';
import { Button } from '../../components/ui/Button';
import type { Employee } from '../../api/employees';
import { 
  X, 
  UserPlus, 
  Edit3,
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle 
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess?: (employeeId: string) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, employee, onSuccess }) => {
  const isEditing = Boolean(employee);
  const { mutate: createEmployee, isPending: isCreating, error: createError } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: isUpdating, error: updateError } = useUpdateEmployee();
  const isPending = isCreating || isUpdating;
  const error = createError || updateError;

  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [managerId, setManagerId] = useState('');
  const [employeeType, setEmployeeType] = useState('FULL_TIME');
  const [status, setStatus] = useState('ACTIVE');
  const [workLocation, setWorkLocation] = useState('Headquarters');
  
  // Banking details (collapsible)
  const [showBanking, setShowBanking] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIdentifierCode, setBankIdentifierCode] = useState('');

  // Form error message
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill fields when editing, or reset when creating
  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName || '');
      setLastName(employee.lastName || '');
      setWorkEmail(employee.email || employee.workEmail || '');
      setWorkPhone(employee.workPhone || '');
      setJobPosition(employee.jobPosition || '');
      setDepartmentId(employee.departmentId || employee.department?.id || '');
      setEmployeeCode(employee.employeeCode || '');
      setManagerId(employee.managerId || '');
      setEmployeeType(employee.employeeType || 'FULL_TIME');
      setStatus(employee.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
      setWorkLocation(employee.workLocation || 'Headquarters');
      setBankName(employee.bankName || '');
      setBankAccountNumber(employee.bankAccountNumber || '');
      setBankIdentifierCode(employee.bankIdentifierCode || '');
      if (employee.bankName || employee.bankAccountNumber) {
        setShowBanking(true);
      }
    } else {
      setFirstName('');
      setLastName('');
      setWorkEmail('');
      setWorkPhone('');
      setJobPosition('');
      setEmployeeCode('');
      setManagerId('');
      setEmployeeType('FULL_TIME');
      setStatus('ACTIVE');
      setWorkLocation('Headquarters');
      setBankName('');
      setBankAccountNumber('');
      setBankIdentifierCode('');
      setShowBanking(false);
    }
  }, [employee, isOpen]);

  // Set default department when departments load
  useEffect(() => {
    if (departments && departments.length > 0 && !departmentId && !isEditing) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId, isEditing]);

  // Suggest employee code based on existing headcount if creating
  useEffect(() => {
    if (employees && !employeeCode && !isEditing) {
      const nextNum = (employees.length || 0) + 1;
      setEmployeeCode(`EMP-${String(nextNum).padStart(3, '0')}`);
    }
  }, [employees, employeeCode, isEditing]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please provide both first and last name.');
      return;
    }

    if (!jobPosition.trim()) {
      setFormError('Job position is required.');
      return;
    }

    if (!departmentId) {
      setFormError('Please select a department.');
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      workEmail: workEmail.trim() || undefined,
      workPhone: workPhone.trim() || undefined,
      jobPosition: jobPosition.trim(),
      departmentId,
      employeeCode: employeeCode.trim() || undefined,
      managerId: managerId || null,
      employeeType,
      status,
      workLocation: workLocation.trim() || 'Headquarters',
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankIdentifierCode: bankIdentifierCode.trim() || undefined,
    };

    if (isEditing && employee) {
      updateEmployee(
        { id: employee.id, data: payload },
        {
          onSuccess: (updated) => {
            onClose();
            if (onSuccess) onSuccess(updated.id);
          },
          onError: (err: any) => {
            setFormError(err.message || 'Failed to update employee profile.');
          },
        }
      );
    } else {
      createEmployee(payload, {
        onSuccess: (created) => {
          onClose();
          if (onSuccess) onSuccess(created.id);
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to create employee profile.');
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl border border-border animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              {isEditing ? <Edit3 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                {isEditing ? 'Edit Employee Profile' : 'Add New Employee'}
              </h2>
              <p className="text-xs text-text-muted m-0">
                {isEditing ? `Update details and record for ${employee?.name || 'employee'}` : 'Create employee record, assign department and job role'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-elevated transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Error Banner */}
          {(formError || error) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500 font-medium">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{formError || (error as any)?.message || 'An error occurred while creating employee.'}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="flex flex-col gap-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Personal Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pam"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beesly"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Mail size={12} className="text-text-muted" /> Work Email
                </label>
                <input
                  type="email"
                  placeholder="pam@peoplepay360.com"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Phone size={12} className="text-text-muted" /> Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  value={workPhone}
                  onChange={(e) => setWorkPhone(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role & Department Assignment */}
          <div className="flex flex-col gap-3.5 border-t border-border pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Role & Department
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Briefcase size={12} className="text-text-muted" /> Job Position *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Administrator"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Building2 size={12} className="text-text-muted" /> Department *
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Employee Code</label>
                <input
                  type="text"
                  placeholder="EMP-008"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Direct Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">No Direct Manager (Top level)</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.jobPosition}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Employment Type</label>
                <select
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <MapPin size={12} className="text-text-muted" /> Location
                </label>
                <input
                  type="text"
                  placeholder="Headquarters"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Collapsible Banking Details */}
          <div className="border border-border rounded-xl overflow-hidden bg-elevated/30">
            <button
              type="button"
              onClick={() => setShowBanking(!showBanking)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-elevated transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-primary" />
                <span>Banking & Disbursement Details (Optional)</span>
              </div>
              {showBanking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showBanking && (
              <div className="p-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-primary">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chase Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-primary">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-text-primary">Bank Identifier Code (BIC / Routing)</label>
                  <input
                    type="text"
                    placeholder="e.g. CHASUS33"
                    value={bankIdentifierCode}
                    onChange={(e) => setBankIdentifierCode(e.target.value)}
                    className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Fixed Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface flex-shrink-0 z-10 shadow-xs">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? 'Saving Record...' : isEditing ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
