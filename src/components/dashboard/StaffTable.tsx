// /home/user/matthorg/src/components/dashboard/StaffTable.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import PermissionsModal from './PermissionsModal';

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'staff' | 'manager' | 'admin' | 'ceo' | 'super_admin';
  status: 'active' | 'on-leave' | 'terminated' | 'pending';
  department?: string;
  position?: string;
  phone?: string;
  avatar_url?: string;
  permissions?: string[];
  last_active?: string;
  created_at: string;
  employment_type?: 'full-time' | 'part-time' | 'contract';
  hire_date?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  metadata?: Record<string, any>;
}

interface StaffTableProps {
  organizationId: string;
  currentUserId?: string; // To prevent self-deletion
  showFilters?: boolean;
  onStaffUpdate?: () => void;
}

type SortField = 'full_name' | 'role' | 'status' | 'created_at' | 'last_active';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'active' | 'on-leave' | 'pending' | 'terminated';
type RoleFilter = 'all' | 'admin' | 'manager' | 'staff' | 'ceo';

export default function StaffTable({ 
  organizationId,
  currentUserId,
  showFilters = true,
  onStaffUpdate 
}: StaffTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('active');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'staff' as 'staff' | 'manager' | 'admin',
    department: '',
    position: '',
    phone: '',
    send_welcome_email: true
  });
  const [processing, setProcessing] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const supabase = createClient();

  // Live staff data
  const { data: staff = [], isLive } = useRealtime<StaffProfile>(
    { table: 'staff_profiles', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Show notification
  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter and sort staff
  const filteredStaff = staff
    .filter(member => {
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        member.email?.toLowerCase().includes(search.toLowerCase()) ||
        member.department?.toLowerCase().includes(search.toLowerCase()) ||
        member.position?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'full_name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created_at':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
        case 'last_active':
          aValue = a.last_active || '';
          bValue = b.last_active || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Statistics
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    onLeave: staff.filter(s => s.status === 'on-leave').length,
    pending: staff.filter(s => s.status === 'pending').length,
    terminated: staff.filter(s => s.status === 'terminated').length,
    admins: staff.filter(s => s.role === 'admin' || s.role === 'ceo').length,
  };

  // Handle role change
  const handleRoleChange = async (staffId: string, newRole: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('staff_profiles')
      .update({ role: newRole })
      .eq('id', staffId);

    if (!error) {
      showNotif('success', 'Role updated successfully');
      if (onStaffUpdate) onStaffUpdate();
    } else {
      showNotif('error', 'Failed to update role');
    }
    setProcessing(false);
  };

  // Handle status change
  const handleStatusChange = async (staffId: string, newStatus: string) => {
    if (staffId === currentUserId) {
      showNotif('error', 'You cannot deactivate yourself');
      setShowDeleteConfirm(null);
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from('staff_profiles')
      .update({ status: newStatus })
      .eq('id', staffId);

    if (!error) {
      showNotif('success', `Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      if (onStaffUpdate) onStaffUpdate();
    } else {
      showNotif('error', 'Failed to update status');
    }
    setProcessing(false);
    setShowDeleteConfirm(null);
  };

  // Handle invite
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Create user in Supabase Auth with metadata
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        inviteForm.email,
        {
          data: {
            full_name: inviteForm.full_name,
            organization_id: organizationId,
            role: inviteForm.role,
            department: inviteForm.department,
            position: inviteForm.position
          }
        }
      );

      if (authError) throw authError;

      // 2. Create staff profile
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .insert({
          id: authData.user.id,
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          role: inviteForm.role,
          department: inviteForm.department || null,
          position: inviteForm.position || null,
          phone: inviteForm.phone || null,
          status: 'pending',
          organization_id: organizationId,
          permissions: getDefaultPermissions(inviteForm.role),
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        organization_id: organizationId,
        action: 'INVITE_STAFF',
        details: { email: inviteForm.email, role: inviteForm.role }
      });

      setShowInviteModal(false);
      setInviteForm({
        email: '',
        full_name: '',
        role: 'staff',
        department: '',
        position: '',
        phone: '',
        send_welcome_email: true
      });
      
      showNotif('success', `Invitation sent to ${inviteForm.email}`);

    } catch (error: any) {
      console.error('Invite error:', error);
      showNotif('error', error.message);
    }

    setProcessing(false);
  };

  // Default permissions based on role
  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['*'];
      case 'manager':
        return [
          'sales:view', 'sales:create',
          'inventory:view', 'inventory:edit',
          'staff:view',
          'reports:view'
        ];
      default:
        return [
          'sales:view', 'sales:create',
          'inventory:view',
          'tasks:view', 'tasks:create'
        ];
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedRows.length === 0) return;
    
    // Prevent self-deletion in bulk
    if (currentUserId && selectedRows.includes(currentUserId)) {
      showNotif('error', 'You cannot modify yourself in bulk actions');
      return;
    }

    setProcessing(true);
    
    const newStatus = action === 'activate' ? 'active' : 'terminated';
    
    const { error } = await supabase
      .from('staff_profiles')
      .update({ status: newStatus })
      .in('id', selectedRows);

    if (!error) {
      setSelectedRows([]);
      showNotif('success', `${selectedRows.length} staff members updated`);
      if (onStaffUpdate) onStaffUpdate();
    }

    setProcessing(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with Live Status */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Staff Management</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <span>👥</span> Invite Staff
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard title="Total" value={stats.total} color="gray" />
          <StatCard title="Active" value={stats.active} color="green" />
          <StatCard title="On Leave" value={stats.onLeave} color="yellow" />
          <StatCard title="Pending" value={stats.pending} color="blue" />
          <StatCard title="Admins" value={stats.admins} color="purple" />
          <StatCard title="Terminated" value={stats.terminated} color="red" />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-2 border rounded-lg min-w-[200px]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="p-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="pending">Pending</option>
                <option value="terminated">Terminated</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="p-2 border rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="ceo">CEO</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 pt-2 border-t"
              >
                <span className="text-sm text-gray-600">
                  {selectedRows.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={processing}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={processing}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:bg-yellow-300"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setSelectedRows([])}
                  className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredStaff.length && filteredStaff.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredStaff.map(s => s.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortField('full_name');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Name
                      {sortField === 'full_name' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortField('role');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Role
                      {sortField === 'role' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortField('status');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Status
                      {sortField === 'status' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortField('last_active');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Last Active
                      {sortField === 'last_active' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredStaff.map((member) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50 ${member.id === currentUserId ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, member.id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== member.id));
                            }
                          }}
                          disabled={member.id === currentUserId}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="text-lg">
                                {member.full_name?.charAt(0) || '👤'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.full_name}
                              {member.id === currentUserId && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{member.position || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-gray-500">{member.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={processing || member.id === currentUserId}
                          className={`border rounded px-2 py-1 text-sm ${
                            member.role === 'admin' || member.role === 'ceo'
                              ? 'bg-purple-50 border-purple-200 text-purple-700'
                              : member.role === 'manager'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-gray-50'
                          }`}
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="ceo">CEO</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${member.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          ${member.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${member.status === 'pending' ? 'bg-blue-100 text-blue-800' : ''}
                          ${member.status === 'terminated' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {member.status === 'on-leave' ? 'On Leave' : member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {member.department || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {member.last_active ? (
                          new Date(member.last_active).toLocaleDateString()
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowPermissionsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Permissions
                          </button>
                          {member.id !== currentUserId && (
                            <button
                              onClick={() => setShowDeleteConfirm(member.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-4">👥</p>
              <p className="text-gray-600 font-medium">No staff members found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Try adjusting your search' : 'Invite your first team member'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t">
            <p className="text-sm text-gray-600">
              Showing {filteredStaff.length} of {staff.length} staff members
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Modal */}
      {selectedStaff && (
        <PermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedStaff(null);
          }}
          staffId={selectedStaff.id}
          staffName={selectedStaff.full_name}
          currentPermissions={selectedStaff.permissions || []}
          currentRole={selectedStaff.role}
          organizationId={organizationId}
          onSave={async (permissions, roleId) => {
            const { error } = await supabase
              .from('staff_profiles')
              .update({ 
                permissions,
                role: roleId || selectedStaff.role
              })
              .eq('id', selectedStaff.id);

            if (!error) {
              showNotif('success', 'Permissions updated');
              if (onStaffUpdate) onStaffUpdate();
            }
            setShowPermissionsModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Invite Team Member</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    They'll receive an email to set up their account
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as any})}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., Sales, Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    value={inviteForm.position}
                    onChange={(e) => setInviteForm({...inviteForm, position: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., Senior Sales Rep"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="+234 123 456 7890"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={inviteForm.send_welcome_email}
                    onChange={(e) => setInviteForm({...inviteForm, send_welcome_email: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700">
                    Send welcome email
                  </label>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Organization</p>
                  <p className="text-sm text-blue-900">They will be added to your organization</p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-2">Confirm Deactivation</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to deactivate this staff member? They will lose access to the dashboard.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(showDeleteConfirm, 'terminated')}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Stat Card Component
const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => {
  const colors = {
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} rounded-lg border p-3`}>
      <p className="text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};