// /home/user/matthorg/src/components/dashboard/AddStaffModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import {
  EnvelopeIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess?: () => void;
  showNotif?: (type: 'success' | 'error', message: string) => void;
}

interface Permission {
  id: string;
  name: string;
  key: string;
  module: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_default?: boolean;
}

// Loading skeleton
function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-40 bg-gray-200 rounded"></div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        <div className="w-20 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Permission Group Component
function PermissionGroup({ 
  title, 
  permissions, 
  selected, 
  onToggle,
  module 
}: { 
  title: string; 
  permissions: Permission[];
  selected: string[];
  onToggle: (permId: string) => void;
  module: string;
}) {
  const filteredPerms = permissions.filter(p => p.module === module);
  
  if (filteredPerms.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">{title}</h4>
      <div className="space-y-2">
        {filteredPerms.map(perm => (
          <label key={perm.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(perm.key)}
              onChange={() => onToggle(perm.key)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {perm.name}
              </span>
              {perm.description && (
                <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function AddStaffModal({ 
  isOpen, 
  onClose, 
  orgId, 
  onSuccess,
  showNotif 
}: AddStaffModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<'form' | 'link' | 'loading'>('form');
  const [form, setForm] = useState({
    email: "",
    role: "staff",
    permissions: [] as string[],
    customRole: "",
  });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const supabase = createClient();

  // Load permissions and roles when modal opens
  useEffect(() => {
    if (isOpen && orgId) {
      loadPermissions();
      loadRoles();
      loadRecentInvitations();
    }
  }, [isOpen, orgId]);

  // Load available permissions
  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', orgId)
        .order('module', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPermissions(data);
      } else {
        // Fallback default permissions if none exist
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(defaultPermissions);
    }
  };

  // Load existing roles
  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  // Load recent invitations
  const loadRecentInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  // Default permissions if none exist in DB
  const defaultPermissions: Permission[] = [
    { id: '1', name: 'View Sales', key: 'sales:view', module: 'sales', description: 'View sales data and reports' },
    { id: '2', name: 'Create Sales', key: 'sales:create', module: 'sales', description: 'Create new sales transactions' },
    { id: '3', name: 'View Expenses', key: 'expenses:view', module: 'expenses', description: 'View expense data' },
    { id: '4', name: 'Create Expenses', key: 'expenses:create', module: 'expenses', description: 'Create new expenses' },
    { id: '5', name: 'View Inventory', key: 'inventory:view', module: 'inventory', description: 'View inventory items' },
    { id: '6', name: 'Manage Inventory', key: 'inventory:manage', module: 'inventory', description: 'Add, edit, delete inventory' },
    { id: '7', name: 'View Staff', key: 'staff:view', module: 'staff', description: 'View staff profiles' },
    { id: '8', name: 'Manage Staff', key: 'staff:manage', module: 'staff', description: 'Add, edit, remove staff' },
    { id: '9', name: 'View Tasks', key: 'tasks:view', module: 'tasks', description: 'View tasks and assignments' },
    { id: '10', name: 'Create Tasks', key: 'tasks:create', module: 'tasks', description: 'Create new tasks' },
    { id: '11', name: 'View Reports', key: 'reports:view', module: 'reports', description: 'View analytics and reports' },
    { id: '12', name: 'View Attendance', key: 'attendance:view', module: 'attendance', description: 'View attendance records' },
    { id: '13', name: 'Mark Attendance', key: 'attendance:mark', module: 'attendance', description: 'Mark attendance for others' },
  ];

  // Handle role selection
  const handleRoleChange = (roleName: string) => {
    setForm({ ...form, role: roleName });
    
    if (roleName === 'custom') {
      setSelectedRole(null);
      return;
    }

    const role = roles.find(r => r.name.toLowerCase() === roleName);
    if (role) {
      setSelectedRole(role);
      setForm({ ...form, role: roleName, permissions: role.permissions || [] });
    } else {
      // Default role permissions
      let defaultPerms: string[] = [];
      switch(roleName) {
        case 'admin':
          defaultPerms = permissions.map(p => p.key);
          break;
        case 'manager':
          defaultPerms = permissions
            .filter(p => !p.key.includes('staff:manage') && !p.key.includes('settings'))
            .map(p => p.key);
          break;
        case 'staff':
          defaultPerms = permissions
            .filter(p => p.key.includes('view') || p.key.includes('create'))
            .map(p => p.key);
          break;
        case 'viewer':
          defaultPerms = permissions
            .filter(p => p.key.includes('view'))
            .map(p => p.key);
          break;
        default:
          defaultPerms = [];
      }
      setForm({ ...form, role: roleName, permissions: defaultPerms });
    }
  };

  // Toggle permission
  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  // Select all permissions
  const selectAllPermissions = () => {
    setForm({
      ...form,
      permissions: permissions.map(p => p.key)
    });
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setForm({
      ...form,
      permissions: []
    });
  };

  // Validate email
  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Generate invite link
  const generateInviteLink = async () => {
    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setStep('loading');
    
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Save to database
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert({
          organization_id: orgId,
          email: form.email || null,
          token,
          role: form.role,
          permissions: form.permissions,
          invited_by: user?.id,
          status: 'pending',
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create invite link
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      setStep('link');
      
      // Show success notification
      if (showNotif) showNotif('success', 'Invitation created successfully!');
      showToast('Invitation created successfully!', 'success');
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('Invite error:', error);
      setError(error.message || 'Failed to create invitation');
      setStep('form');
      if (showNotif) showNotif('error', 'Failed to create invitation');
      showToast(error.message || 'Failed to create invitation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  // Resend invitation
  const resendInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ 
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
      
      showToast('Invitation reset successfully', 'success');
      loadRecentInvitations();
      
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      showToast(error.message || 'Failed to resend invitation', 'error');
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      
      showToast('Invitation cancelled', 'success');
      loadRecentInvitations();
      
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      showToast(error.message || 'Failed to cancel invitation', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setStep('form');
    setForm({
      email: "",
      role: "staff",
      permissions: [],
      customRole: "",
    });
    setInviteLink("");
    setError("");
    setSelectedRole(null);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Modal wrapper
  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    );
  };

  // Loading state
  if (step === 'loading') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Creating Invitation">
        <div className="py-12 text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Creating your invitation...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait</p>
        </div>
      </Modal>
    );
  }

  // Step 1: Invitation Form
  if (step === 'form') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2"
            >
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to create a generic link anyone can use
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['staff', 'manager', 'admin', 'viewer'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                    form.role === role
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {permissions.length > 0 ? (
                <>
                  <PermissionGroup
                    title="Sales"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="sales"
                  />
                  <PermissionGroup
                    title="Expenses"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="expenses"
                  />
                  <PermissionGroup
                    title="Inventory"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="inventory"
                  />
                  <PermissionGroup
                    title="Staff"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="staff"
                  />
                  <PermissionGroup
                    title="Tasks"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="tasks"
                  />
                  <PermissionGroup
                    title="Attendance"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="attendance"
                  />
                  <PermissionGroup
                    title="Reports"
                    permissions={permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    module="reports"
                  />
                </>
              ) : (
                <FormSkeleton />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {form.permissions.length} permissions
            </p>
          </div>

          {/* Recent Invitations */}
          {invitations.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UserPlusIcon className="w-4 h-4" />
                {showHistory ? 'Hide' : 'Show'} recent invitations
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 border rounded-lg overflow-hidden"
                  >
                    {invitations.map((inv) => (
                      <div key={inv.id} className="p-3 border-b last:border-0 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{inv.email || 'Generic link'}</p>
                            <p className="text-xs text-gray-500">
                              Status: <span className={`capitalize ${
                                inv.status === 'accepted' ? 'text-green-600' :
                                inv.status === 'pending' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>{inv.status}</span>
                            </p>
                          </div>
                          {inv.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => resendInvitation(inv.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => cancelInvitation(inv.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={generateInviteLink}
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Generate Invite Link
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 2: Show Invite Link
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Created">
      <div className="space-y-6">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
        >
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-medium text-green-700">Invitation created successfully!</p>
          <p className="text-sm text-green-600 mt-1">Share the link below with your team member</p>
        </motion.div>

        {/* Invite Link Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="w-full pl-9 pr-4 py-2 border rounded-lg bg-gray-50 text-sm"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Email info if provided */}
        {form.email && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              An email will also be sent to <strong>{form.email}</strong> with the invitation link.
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleClose}
            className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Done
          </button>
          <button
            onClick={() => setStep('form')}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Create Another
          </button>
        </div>

        {/* Info note */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🔗 Link expires in 7 days</p>
          <p>👥 Anyone with this link can join your organization</p>
        </div>
      </div>
    </Modal>
  );
}