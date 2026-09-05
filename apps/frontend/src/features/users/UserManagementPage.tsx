import { useState, useMemo } from 'react';
import { useUsers } from './useUsers';
import { UserModal } from './UserModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import type { UserAccount } from '../../api/users';
import { Plus, ShieldCheck, X, Users, Edit2, Info } from 'lucide-react';

export const UserManagementPage = () => {
  const { data: users, isLoading } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return users?.filter((user) => {
      const s = search.trim().toLowerCase();
      const matchesSearch = !s ||
        (user.employeeName || '').toLowerCase().includes(s) ||
        (user.email || '').toLowerCase().includes(s) ||
        (user.role || '').toLowerCase().includes(s) ||
        (user.employee?.employeeCode || '').toLowerCase().includes(s);

      const matchesRole = roleFilter === 'ALL' || (
        user.roles?.some((r) => r.code?.toUpperCase() === roleFilter || r.name?.toUpperCase() === roleFilter)
      );

      const matchesStatus = statusFilter === 'ALL' || (user.status || 'ACTIVE').toUpperCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalCount = users?.length || 0;
  const activeCount = users?.filter(u => (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length || 0;
  const adminCount = users?.filter(u => u.roles?.some(r => r.code === 'ADMIN') || u.role === 'ADMIN').length || 0;
  const linkedCount = users?.filter(u => Boolean(u.employeeId || u.employee)).length || 0;

  const hasActiveFilters = Boolean(search.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL');

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 pb-12">
      <PageHeader 
        title="User & Access Control" 
        subtitle="Manage user credentials, security role bindings, and system permissions"
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-md">
              <ShieldCheck size={14} /> ADMIN ONLY
            </span>
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus size={16} />
              <span>New User</span>
            </Button>
          </div>
        }
      />

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Users */}
        <div 
          onClick={clearFilters}
          className="bg-surface border border-border hover:border-primary/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Click to reset filters and view all users"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {totalCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {hasActiveFilters ? 'Click to reset all filters ➔' : 'All provisioned system users'}
          </div>
        </div>

        {/* Card 2: Active Accounts */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30'
              : 'border-border hover:border-emerald-500/40'
          }`}
          title="Click to toggle Active status filter"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Access</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-500">
            {activeCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {statusFilter === 'ACTIVE' ? 'Filtered: active only (click to clear)' : 'Click to filter active accounts ➔'}
          </div>
        </div>

        {/* Card 3: Superusers */}
        <div 
          onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')}
          className={`bg-surface border rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none ${
            roleFilter === 'ADMIN'
              ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/30'
              : 'border-border hover:border-purple-500/40'
          }`}
          title="Click to toggle Admin filter"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Superusers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-purple-600 dark:text-purple-400">
            {adminCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            {roleFilter === 'ADMIN' ? 'Filtered: admins only (click to clear)' : 'Full permission admins ➔'}
          </div>
        </div>

        {/* Card 4: Linked Employees */}
        <div 
          onClick={() => {
            setSearch('');
            setRoleFilter('ALL');
            setStatusFilter('ALL');
          }}
          className="bg-surface border border-border hover:border-blue-500/40 rounded-xl p-4 shadow-xs transition-all hover:scale-[1.01] cursor-pointer group select-none"
          title="Staff members with system accounts"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Linked Staff</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-text-primary">
            {linkedCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1 truncate">
            Linked to workforce profiles ➔
          </div>
        </div>
      </div>

      {/* Search & Role Filter Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-3 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="w-full sm:w-80">
            <SearchInput 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, employees or email..."
            />
          </div>

          {/* Role Filter Dropdown */}
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-border bg-surface text-text-primary px-3 py-2 rounded-lg text-xs font-medium outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="TIME_OFF_ADMIN">Time Off Admin</option>
            <option value="PAYROLL_USER">HR Payroll User</option>
            <option value="ADMIN">Admin</option>
          </select>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary bg-elevated px-2.5 py-1 rounded-md border border-border font-medium">
                Showing {filtered?.length} of {totalCount}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-error px-2 py-1 transition-colors cursor-pointer"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>User</th>
              <th>Employee Link</th>
              <th>Work Email</th>
              <th>Assigned Roles</th>
              <th>Account Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center text-text-muted text-sm font-medium">Loading user access directory...</td></tr>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((user) => (
                <tr 
                  key={user.id}
                  onClick={() => handleOpenEdit(user)}
                  className="cursor-pointer hover:bg-elevated/40 transition-colors"
                >
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.employeeName || user.email} size="sm" />
                      <div>
                        <span className="font-semibold text-text-primary text-sm block">
                          {user.name || user.employeeName || 'Direct Account'}
                        </span>
                        <span className="text-[11px] text-text-muted font-mono">{user.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {user.employee ? (
                      <div>
                        <span className="font-medium text-text-primary text-xs block">
                          {user.employee.firstName} {user.employee.lastName}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {user.employee.employeeCode} • {user.employee.jobPosition}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic">No linked employee</span>
                    )}
                  </td>
                  <td className="text-text-secondary text-sm">{user.email}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((r, idx) => (
                          <span 
                            key={r.id || idx}
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                              r.code === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                : r.code === 'HR_MANAGER'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : r.code === 'PAYROLL_USER'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : r.code === 'TIME_OFF_ADMIN'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                      : 'bg-elevated text-text-secondary border-border'
                            }`}
                          >
                            {r.name || r.code}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-elevated border border-border text-text-primary">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={user.status || 'Active'} />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(user);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary p-1 rounded transition-colors"
                      title="Edit Access & Roles"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-muted text-sm">
                  No users found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Excalidraw Footer Guidance Note */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-text-muted bg-surface border border-border rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-primary flex-shrink-0" />
          <span>
            Select a user row to edit access and assigned security roles, or create a new user.
          </span>
        </div>
        <span className="text-[11px] text-text-muted italic">
          User accounts are separate from Employee records, but linked for access and ownership.
        </span>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <UserModal 
          user={selectedUser} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }} 
        />
      )}
    </div>
  );
};
