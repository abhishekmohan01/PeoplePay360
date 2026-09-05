import { useState } from 'react';
import { useUsers } from './useUsers';
import { UserModal } from './UserModal';
import { Plus } from 'lucide-react';

export const UserManagementPage = () => {
  const { data: users, isLoading } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full font-primary w-full max-w-5xl mx-auto mt-4">
      
      {/* Header Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 mb-6 flex items-center gap-4">
        <h1 className="text-3xl font-[Caveat] font-bold m-0">User Management</h1>
        <span className="px-3 py-1 text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 rounded uppercase tracking-wider font-[Caveat]">ADMIN ONLY</span>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold !font-handwritten text-lg transition-colors whitespace-nowrap"
        >
          <Plus size={20} strokeWidth={3} /> New User
        </button>
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search users, employees or email..." 
            className="w-full h-full border border-border bg-surface px-4 rounded-lg font-[Caveat] text-lg text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <button className="border border-border bg-surface hover:bg-elevated text-text-primary px-6 py-2 rounded-lg !font-handwritten text-lg transition-colors whitespace-nowrap">
          Role Filter
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-elevated/30">
              <th className="p-4 font-[Caveat] font-bold text-muted">Employee</th>
              <th className="p-4 font-[Caveat] font-bold text-muted">Work Email</th>
              <th className="p-4 font-[Caveat] font-bold text-muted">Role</th>
              <th className="p-4 font-[Caveat] font-bold text-muted text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center font-[Caveat] text-muted text-lg">Loading users...</td></tr>
            ) : (
              users?.map((user, i) => (
                <tr key={user.id} className="border-t border-border hover:bg-elevated/30 transition-colors relative group">
                  <td className={`p-4 font-[Caveat] text-lg relative ${i === 0 ? 'pl-5' : ''}`}>
                    {/* Blue active indicator line */}
                    {i === 0 && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563eb]"></div>
                    )}
                    {user.employeeName}
                  </td>
                  <td className="p-4 font-[Caveat] text-lg">{user.email}</td>
                  <td className="p-4 font-[Caveat] text-lg">{user.role}</td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-4 py-1 text-blue-500 font-[Caveat] font-bold border border-blue-200 rounded-md bg-transparent">
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && <UserModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
