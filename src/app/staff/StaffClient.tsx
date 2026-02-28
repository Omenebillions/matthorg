'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
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
} from '@heroicons/react/24/outline';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role_id?: string;
  position?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  permissions?: string[];
}

interface Permission {
  id: string;
  name: string;
  key: string;
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

export default function StaffClient({
  organizationId,
  initialStaff,
  initialRoles,
  initialPermissions,
  handleInviteUser,
  assignRole,
  updateStaffStatus,
}: StaffClientProps) {
  const supabase = createClient();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    position: '',
    department: '',
    phone: '',
  });

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
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Also listen for role changes
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
  }, [organizationId]);

  // Handle real-time staff updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setStaff(prev => [payload.new, ...prev]);
        break;
      case 'UPDATE':
        setStaff(prev => 
          prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
        );
        break;
      case 'DELETE':
        setStaff(prev => prev.filter(s => s.id !== payload.old.id));
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

  // Get role name by ID
  const getRoleName = (roleId?: string) => {
    if (!roleId) return 'No Role';
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  // Start editing staff
  const startEdit = (member: StaffMember) => {
    setEditingStaff(member.id);
    setEditForm({
      full_name: member.full_name || '',
      position: member.position || '',
      department: member.department || '',
      phone: member.phone || '',
    });
  };

  // Save edit
  const saveEdit = async (staffId: string) => {
    await supabase
      .from('staff_profiles')
      .update({
        ...editForm,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId);
    
    setEditingStaff(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-600">MattH</span>
            <span className="text-gray-800">org</span>
          </h1>
        </div>

        <nav className="flex-grow px-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                <span>🏠</span><span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/tasks" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                <span>📝</span><span className="ml-3">Tasks</span>
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                <span>💼</span><span className="ml-3">Jobs</span>
              </Link>
            </li>
            <li>
              <Link href="/sales" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                <span>📈</span><span className="ml-3">Sales</span>
              </Link>
            </li>
            <li>
              <Link href="/staff" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm">
                <span>👥</span><span className="ml-3">Staff</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Live Status */}
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live Updates' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {staff.length} team members
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Staff Management</h1>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              Invite Staff
            </button>
          </div>
        </header>

        <main className="flex-grow p-6 overflow-y-auto">
          {/* Invite Form */}
          <AnimatePresence>
            {showInviteForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 bg-white p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Invite New Staff Member</h2>

                <form action={handleInviteUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        required
                        className="mt-1 w-full border p-2 rounded"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        required
                        className="mt-1 w-full border p-2 rounded"
                        placeholder="staff@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Role</label>
                      <select 
                        name="roleId"
                        className="mt-1 w-full border p-2 rounded"
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
                      <label className="block text-sm font-medium">Position</label>
                      <input 
                        type="text" 
                        name="position" 
                        className="mt-1 w-full border p-2 rounded"
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStaff.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition"
                >
                  {editingStaff === member.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full border p-2 rounded text-lg font-bold"
                        placeholder="Full Name"
                      />
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                        className="w-full border p-2 rounded"
                        placeholder="Position"
                      />
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                        className="w-full border p-2 rounded"
                        placeholder="Department"
                      />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full border p-2 rounded"
                        placeholder="Phone"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(member.id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStaff(null)}
                          className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 flex items-center justify-center"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold">
                            {member.full_name || "Pending Invite"}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <EnvelopeIcon className="w-4 h-4 mr-1" />
                            {member.email}
                          </p>
                          {member.position && (
                            <p className="text-sm text-gray-600 mt-1">
                              📍 {member.position}
                              {member.department && ` · ${member.department}`}
                            </p>
                          )}
                          {member.phone && (
                            <p className="text-sm text-gray-600 mt-1">
                              📞 {member.phone}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>

                      {/* Role Selector */}
                      <form action={assignRole} className="mt-4">
                        <input type="hidden" name="staffId" value={member.id} />
                        <label className="block text-xs text-gray-500 mb-1">Role</label>
                        <select
                          name="roleId"
                          defaultValue={member.role_id || ""}
                          className="w-full border p-2 rounded text-sm"
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          <option value="">No Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </form>

                      {/* Status Update */}
                      <form action={updateStaffStatus} className="mt-2">
                        <input type="hidden" name="staffId" value={member.id} />
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <select
                          name="status"
                          defaultValue={member.status}
                          className="w-full border p-2 rounded text-sm"
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </form>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <Link 
                          href={`/staff/${member.id}`} 
                          className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
                        >
                          <UserIcon className="w-4 h-4 mr-1" />
                          View Profile
                        </Link>
                        <button
                          onClick={() => startEdit(member)}
                          className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredStaff.length === 0 && (
              <div className="col-span-full text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No staff members found</p>
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Invite your first team member
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}