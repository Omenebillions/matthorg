'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

// Type definitions
interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role_id?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  last_login?: string | null;
  created_at: string;
  updated_at?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[] | null;
  is_default?: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  module?: string;
}

interface StaffClientProps {
  organizationId: string;
  initialStaff: StaffMember[];
  initialRoles: Role[];
  initialPermissions: Permission[];
  handleInviteUser: (formData: FormData) => Promise<void>;
  assignRole: (formData: FormData) => Promise<void>;
  updateStaffStatus: (formData: FormData) => Promise<void>;
}

// Loading skeleton
function StaffSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Edit Profile Modal
function EditProfileModal({ 
  isOpen, 
  onClose, 
  member, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  member: StaffMember | null;
  onSave: (id: string, data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    department: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        position: member.position || '',
        department: member.department || '',
        phone: member.phone || '',
      });
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(member.id, formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="e.g., Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="e.g., Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="+1234567890"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  memberName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => Promise<void>;
  memberName: string;
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Staff Member</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to remove <strong>{memberName}</strong> from your organization? 
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Invite Form Modal
function InviteFormModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  roles 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (formData: FormData) => Promise<void>;
  roles: Role[];
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-2xl w-full p-6"
      >
        <h3 className="text-xl font-bold mb-4">Invite New Staff Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="staff@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="roleId"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                name="position"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                type="text"
                name="department"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function StaffClient({
  organizationId,
  initialStaff,
  initialRoles,
  initialPermissions,
  handleInviteUser,
  assignRole,
  updateStaffStatus,
}: StaffClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Setup real-time subscription for staff changes
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_profiles',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('👥 Staff update:', payload);
          handleRealtimeUpdate(payload);
          showToast('Staff list updated', 'info');
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Listen for role changes
    const rolesChannel = supabase
      .channel('roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roles',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('🔐 Role update:', payload);
          handleRoleUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rolesChannel);
    };
  }, [organizationId, supabase, showToast]);

  // Handle real-time staff updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setStaff(prev => [payload.new, ...prev]);
        showToast('New team member joined', 'success');
        break;
      case 'UPDATE':
        setStaff(prev => 
          prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
        );
        break;
      case 'DELETE':
        setStaff(prev => prev.filter(s => s.id !== payload.old.id));
        showToast('Team member removed', 'info');
        break;
    }
  };

  // Handle real-time role updates
  const handleRoleUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setRoles(prev => [...prev, payload.new]);
        break;
      case 'UPDATE':
        setRoles(prev => 
          prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
        );
        break;
      case 'DELETE':
        setRoles(prev => prev.filter(r => r.id !== payload.old.id));
        break;
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(member => {
    if (filterStatus !== 'all' && member.status !== filterStatus) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        member.full_name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.position?.toLowerCase().includes(searchLower) ||
        member.department?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return '🟢';
      case 'pending': return '🟡';
      case 'inactive': return '⚪';
      case 'suspended': return '🔴';
      default: return '⚪';
    }
  };

  // Get role name by ID
  const getRoleName = (roleId?: string | null) => {
    if (!roleId) return 'No Role';
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  // Handle edit save
  const handleEditSave = async (staffId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId);

      if (error) throw error;

      showToast('Profile updated successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingMember) return;

    try {
      // First, check if this is the last admin
      const admins = staff.filter(s => 
        roles.find(r => r.id === s.role_id)?.name?.toLowerCase().includes('admin')
      );

      if (admins.length === 1 && admins[0].id === deletingMember.id) {
        showToast('Cannot remove the last administrator', 'error');
        return;
      }

      const { error } = await supabase
        .from('staff_profiles')
        .delete()
        .eq('id', deletingMember.id);

      if (error) throw error;

      showToast('Team member removed successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showToast(error.message || 'Failed to remove team member', 'error');
    }
  };

  // Handle role change
  const handleRoleChange = async (staffId: string, roleId: string) => {
    const formData = new FormData();
    formData.append('staffId', staffId);
    formData.append('roleId', roleId);
    await assignRole(formData);
    router.refresh();
  };

  // Handle status change
  const handleStatusChange = async (staffId: string, status: string) => {
    const formData = new FormData();
    formData.append('staffId', staffId);
    formData.append('status', status);
    await updateStaffStatus(formData);
    router.refresh();
  };

  // Calculate stats
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    pending: staff.filter(s => s.status === 'pending').length,
    inactive: staff.filter(s => s.status === 'inactive').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total} team members • {stats.active} active
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Live Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Reconnecting...'}</span>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => router.refresh()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
                >
                  <UserPlusIcon className="w-4 h-4 mr-1" />
                  Invite Staff
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <FunnelIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, position, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Mobile Filter Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden mt-4 pt-4 border-t"
              >
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowInviteForm(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-1" />
                    Invite Staff
                  </button>
                  <button
                    onClick={() => {
                      router.refresh();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 border rounded-lg text-sm flex items-center justify-center"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <StaffSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStaff.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.full_name?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{member.full_name || 'Pending Invite'}</h3>
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                          <EnvelopeIcon className="w-3 h-3 mr-1" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(member.status)}`}>
                      {getStatusIcon(member.status)} {member.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2 text-sm mb-4">
                    {member.position && (
                      <p className="flex items-center text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {member.position}
                        {member.department && ` · ${member.department}`}
                      </p>
                    )}
                    {member.phone && (
                      <p className="flex items-center text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {member.phone}
                      </p>
                    )}
                    <p className="flex items-center text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                    {member.last_login && (
                      <p className="flex items-center text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                        Last login {new Date(member.last_login).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Role Selector */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">Role</label>
                    <select
                      value={member.role_id || ''}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="w-full border p-2 rounded text-sm bg-white hover:bg-gray-50"
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={member.status}
                      onChange={(e) => handleStatusChange(member.id, e.target.value)}
                      className="w-full border p-2 rounded text-sm bg-white hover:bg-gray-50"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t flex justify-between items-center">
                    <Link
                      href={`/staff/${member.id}`}
                      className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
                    >
                      <UserIcon className="w-4 h-4 mr-1" />
                      View Profile
                    </Link>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingMember(member);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredStaff.length === 0 && (
              <div className="col-span-full text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No staff members found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {search || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Invite your first team member'}
                </p>
                {(search || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilterStatus('all');
                    }}
                    className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <InviteFormModal
        isOpen={showInviteForm}
        onClose={() => setShowInviteForm(false)}
        onSubmit={handleInviteUser}
        roles={roles}
      />

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        member={editingMember}
        onSave={handleEditSave}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingMember(null);
        }}
        onConfirm={handleDelete}
        memberName={deletingMember?.full_name || 'this team member'}
      />
    </div>
  );
}