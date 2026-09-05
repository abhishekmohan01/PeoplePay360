import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee, useDepartments, useEmployees } from './useEmployees';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  AlertCircle 
} from 'lucide-react';

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createEmployee, isPending, error } = useCreateEmployee();
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
  
  // Banking details
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIdentifierCode, setBankIdentifierCode] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (departments && departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  useEffect(() => {
    if (employees && !employeeCode) {
      const nextNum = (employees.length || 0) + 1;
      setEmployeeCode(`EMP-${String(nextNum).padStart(3, '0')}`);
    }
  }, [employees, employeeCode]);

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

    createEmployee(
      {
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
      },
      {
        onSuccess: (created) => {
          navigate(`/employees/${created.id}`);
        },
        onError: (err: any) => {
          setFormError(err.message || 'Failed to create employee profile.');
        },
      }
    );
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 pb-12">
      {/* Back Link */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Workforce Directory</span>
        </button>
      </div>

      <PageHeader
        title="Create New Employee"
        subtitle="Provision a new employee profile, department assignment, and reporting structure"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
        {/* Error Banner */}
        {(formError || error) && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-500 font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{formError || (error as any)?.message || 'An error occurred while creating employee.'}</span>
          </div>
        )}

        {/* Card 1: Identity & Contact */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border">
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Michael"
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
                placeholder="e.g. Scott"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                <Mail size={12} className="text-text-muted" /> Work Email
              </label>
              <input
                type="email"
                placeholder="michael@peoplepay360.com"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                <Phone size={12} className="text-text-muted" /> Work Phone
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 019-2834"
                value={workPhone}
                onChange={(e) => setWorkPhone(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Role & Department */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <Briefcase size={14} className="text-primary" /> Role & Department Allocation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Job Position / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Regional Sales Manager"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="">No Direct Manager (Senior Level)</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.jobPosition}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="text-xs font-medium text-text-primary">Account Status</label>
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
                <MapPin size={12} className="text-text-muted" /> Work Location
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

        {/* Card 3: Banking (Optional) */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 pb-2 border-b border-border flex items-center gap-1.5">
            <CreditCard size={14} className="text-primary" /> Banking & Disbursement Details (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. JPMorgan Chase"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-primary">Bank Identifier Code (BIC / Swift / Routing)</label>
              <input
                type="text"
                placeholder="e.g. CHASUS33"
                value={bankIdentifierCode}
                onChange={(e) => setBankIdentifierCode(e.target.value)}
                className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Saving Record...' : 'Create Employee Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};
