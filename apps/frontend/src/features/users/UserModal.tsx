import { useState } from 'react';
import { useCreateUser } from './useUsers';
import { X } from 'lucide-react';

interface UserModalProps {
  onClose: () => void;
}

export const UserModal = ({ onClose }: UserModalProps) => {
  const { mutate: createUser } = useCreateUser();
  const [employee, setEmployee] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !email) return;

    createUser({
      name: employee,
      employeeName: employee,
      email,
      role: role as any,
      status: 'Active'
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-primary">
      <div 
        className="rounded-[24px] shadow-2xl w-full max-w-md p-6 border-2 border-border/50 relative"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-[Caveat] text-muted">Open on New User</div>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X size={24} />
          </button>
        </div>
        
        <h2 className="text-2xl font-[Caveat] font-bold mb-6 mt-0">Create / Edit User</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-[Caveat] font-bold">Employee *</label>
            <select 
              className="border border-border bg-surface p-2 rounded-lg text-sm font-[Caveat]"
              value={employee}
              onChange={e => setEmployee(e.target.value)}
              required
            >
              <option value="" disabled>Select employee</option>
              <option value="Advay Anand">Advay Anand</option>
              <option value="John Doe">John Doe</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-[Caveat] font-bold">Work Email *</label>
            <input 
              type="email" 
              className="border border-border bg-surface p-2 rounded-lg text-sm font-[Caveat]"
              placeholder="employee@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-[Caveat] font-bold">Roles *</label>
            {['Employee', 'Hr Manager', 'Hr Payroll User', 'Hr Payroll Admin', 'Admin'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer text-sm font-[Caveat] font-bold">
                <input 
                  type="radio" 
                  name="role" 
                  value={r}
                  checked={role === r}
                  onChange={e => setRole(e.target.value)}
                  className="accent-primary w-4 h-4 cursor-pointer"
                />
                {r}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 border-t border-border/50 pt-4">
            <label className="text-sm font-[Caveat] font-bold">Account Status</label>
            <div className="px-6 py-1 bg-blue-50 text-blue-500 border border-blue-200 rounded-md text-sm font-[Caveat] font-bold cursor-pointer">
              Active
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-6 bg-[#2563eb] text-white py-3 rounded-xl font-bold font-[Caveat] text-lg hover:bg-blue-700 transition-colors"
          >
            Create User / Save Access
          </button>

        </form>
      </div>
    </div>
  );
};
