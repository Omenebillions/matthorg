// /src/components/dashboard/RoleBadge.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import {
  InformationCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface RoleBadgeProps {
  role: string;
  roleId?: string; // For database operations
  organizationId?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
  customColor?: string;
  editable?: boolean;
  onRoleUpdate?: (newRole: string) => Promise<void>;
  showDescription?: boolean;
  permissions?: string[];
  staffCount?: number;
}

interface RoleData {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  staff_count?: number;
  is_default?: boolean;
  created_at: string;
}

// Predefined role colors (will be used as defaults)
const predefinedRoleColors: Record<string, string> = {
  // Executive roles
  ceo: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  cto: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  cfo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  coo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  
  // Admin roles
  super_admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  
  // Management roles
  manager: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  supervisor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  lead: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  
  // Staff roles
  staff: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  sales: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  support: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  engineer: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  designer: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  
  // Special roles
  owner: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  founder: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  partner: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
};

// Role icons (will show generic icon for custom roles)
const roleIcons: Record<string, string> = {
  ceo: "👑",
  cto: "💻",
  cfo: "💰",
  coo: "⚙️",
  super_admin: "🛡️",
  admin: "🔐",
  manager: "📊",
  supervisor: "👔",
  lead: "🎯",
  staff: "👤",
  sales: "📈",
  support: "🎧",
  engineer: "🔧",
  designer: "🎨",
  owner: "🏢",
  founder: "🚀",
  partner: "🤝",
};

// Color generator for custom roles (consistent colors based on role name)
const generateColorForCustomRole = (role: string): string => {
  // Simple hash function to generate consistent colors
  const hash = role.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash % 360);
  return `bg-[hsl(${hue},80%,95%)] text-[hsl(${hue},70%,40%)] border-[hsl(${hue},60%,85%)] 
          dark:bg-[hsl(${hue},30%,20%)] dark:text-[hsl(${hue},70%,70%)] dark:border-[hsl(${hue},30%,30%)]`;
};

// Generate description for custom roles
const getRoleDescription = (role: string, isPredefined: boolean, roleData?: RoleData): string => {
  if (roleData?.description) {
    return roleData.description;
  }
  
  if (isPredefined) {
    const descriptions: Record<string, string> = {
      ceo: "Chief Executive Officer - Full access to all features",
      cto: "Chief Technology Officer - Manages technical infrastructure",
      cfo: "Chief Financial Officer - Manages finances and budgets",
      coo: "Chief Operating Officer - Oversees daily operations",
      super_admin: "Super Administrator - Complete system access",
      admin: "Administrator - Can manage users and settings",
      manager: "Manager - Can manage teams and approve requests",
      supervisor: "Supervisor - Oversees team activities",
      lead: "Team Lead - Leads specific team or project",
      staff: "Staff Member - Basic access for daily tasks",
      sales: "Sales Representative - Manages sales and customers",
      support: "Support Agent - Handles customer support",
      engineer: "Engineer - Technical development and maintenance",
      designer: "Designer - Creates and manages designs",
      owner: "Business Owner - Full business access",
      founder: "Founder - Original business creator",
      partner: "Business Partner - Shared business access",
    };
    return descriptions[role] || `Role: ${role}`;
  }
  
  return roleData?.description || `Custom Role: ${role} - Configure permissions in settings`;
};

// Permission badge component
const PermissionBadge = ({ permission }: { permission: string }) => {
  return (
    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
      {permission.replace(':', ' ')}
    </span>
  );
};

// Edit Role Modal
function EditRoleModal({ 
  isOpen, 
  onClose, 
  role, 
  roleData,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  role: string;
  roleData?: RoleData;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(role);
  const [description, setDescription] = useState(roleData?.description || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(name, description);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
      >
        <h3 className="text-lg font-bold mb-4">Edit Role</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Describe this role's responsibilities..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function RoleBadge({ 
  role, 
  roleId,
  organizationId,
  size = 'md', 
  showIcon = false,
  animated = false,
  onClick,
  className = '',
  customColor,
  editable = false,
  onRoleUpdate,
  showDescription = false,
  permissions = [],
  staffCount = 0
}: RoleBadgeProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch role data if roleId is provided
  useEffect(() => {
    if (roleId && organizationId) {
      fetchRoleData();
    }
  }, [roleId, organizationId]);

  const fetchRoleData = async () => {
    if (!roleId || !organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          staff_count:staff_profiles(count)
        `)
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      setRoleData(data);
      
    } catch (error: any) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (newName: string, newDescription: string) => {
    if (!roleId || !organizationId) return;

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: newName,
          description: newDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      showToast('Role updated successfully', 'success');
      if (onRoleUpdate) {
        await onRoleUpdate(newName);
      }
      fetchRoleData(); // Refresh data
      
    } catch (error: any) {
      console.error('Error updating role:', error);
      showToast(error.message || 'Failed to update role', 'error');
    }
  };
  
  const normalizedRole = role?.toLowerCase().replace(/\s+/g, '_') || 'staff';
  const isPredefined = normalizedRole in predefinedRoleColors;
  
  // Determine color class
  let colorClass = '';
  if (customColor) {
    colorClass = customColor;
  } else if (isPredefined) {
    colorClass = predefinedRoleColors[normalizedRole];
  } else {
    colorClass = generateColorForCustomRole(normalizedRole);
  }
  
  // Get icon (or use default for custom roles)
  const icon = isPredefined 
    ? (roleIcons[normalizedRole] || '📌')
    : '✨'; // Sparkle icon for custom roles
  
  const description = getRoleDescription(role, isPredefined, roleData || undefined);

  // Size classes
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const badgeContent = (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${sizeClasses[size]}
        ${colorClass}
        ${onClick || editable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
        relative group
      `}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="status"
      aria-label={`Role: ${role}`}
    >
      {showIcon && (
        <span className="text-base leading-none" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="uppercase tracking-wide">
        {role}
      </span>
      
      {/* Staff count badge */}
      {staffCount > 0 && size !== 'sm' && (
        <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded-full text-[10px]">
          {staffCount}
        </span>
      )}
      
      {/* Edit icon for editable roles */}
      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEditModal(true);
          }}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit role"
        >
          <PencilIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );

  // Animated version
  if (animated) {
    return (
      <>
        <motion.div
          className="relative inline-block"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setShowTooltip(true)}
          onHoverEnd={() => setShowTooltip(false)}
        >
          {badgeContent}
          
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (showDescription || permissions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap min-w-[200px]"
              >
                {showDescription && (
                  <div className="mb-2">
                    <p className="font-semibold">{role}</p>
                    <p className="text-gray-300 mt-1">{description}</p>
                  </div>
                )}
                
                {permissions.length > 0 && (
                  <div>
                    <p className="font-semibold mb-1">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {permissions.slice(0, 5).map((perm, i) => (
                        <PermissionBadge key={i} permission={perm} />
                      ))}
                      {permissions.length > 5 && (
                        <span className="text-gray-400">+{permissions.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                {!isPredefined && (
                  <div className="text-xs text-yellow-300 mt-2">
                    ⚡ Custom role
                  </div>
                )}
                
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Edit Modal */}
        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          role={role}
          roleData={roleData || undefined}
          onSave={handleRoleUpdate}
        />
      </>
    );
  }

  // Static version with tooltip
  return (
    <>
      <div className="relative inline-block">
        {badgeContent}
        
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (showDescription || permissions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap min-w-[200px]"
            >
              {showDescription && (
                <div className="mb-2">
                  <p className="font-semibold">{role}</p>
                  <p className="text-gray-300 mt-1">{description}</p>
                </div>
              )}
              
              {permissions.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {permissions.slice(0, 5).map((perm, i) => (
                      <PermissionBadge key={i} permission={perm} />
                    ))}
                    {permissions.length > 5 && (
                      <span className="text-gray-400">+{permissions.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
              
              {!isPredefined && (
                <div className="text-xs text-yellow-300 mt-2">
                  ⚡ Custom role
                </div>
              )}
              
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <EditRoleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        role={role}
        roleData={roleData || undefined}
        onSave={handleRoleUpdate}
      />
    </>
  );
}

// Component for role management (to be used in admin settings)
export function RoleManager({ organizationId, onRoleCreated }: { organizationId: string; onRoleCreated?: (role: string) => void }) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [newRole, setNewRole] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [customRoles, setCustomRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load custom roles from database
  useEffect(() => {
    if (!organizationId) return;

    const loadRoles = async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (!error) {
        setCustomRoles(data || []);
      }
      setLoading(false);
    };

    loadRoles();
  }, [organizationId]);

  const handleAddRole = async () => {
    if (!newRole.trim()) return;

    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          organization_id: organizationId,
          name: newRole.trim(),
          description: newRoleDescription.trim() || null,
          permissions: [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCustomRoles([...customRoles, data]);
      showToast('Role created successfully', 'success');
      onRoleCreated?.(newRole.trim());
      setNewRole('');
      setNewRoleDescription('');
      
    } catch (error: any) {
      console.error('Error creating role:', error);
      showToast(error.message || 'Failed to create role', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setCustomRoles(customRoles.filter(r => r.id !== roleId));
      showToast('Role deleted successfully', 'success');
      
    } catch (error: any) {
      console.error('Error deleting role:', error);
      showToast(error.message || 'Failed to delete role', 'error');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
        Custom Roles
      </h3>
      
      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Role name (e.g., 'Team Lead')"
          className="w-full p-2 border rounded-lg"
        />
        <textarea
          value={newRoleDescription}
          onChange={(e) => setNewRoleDescription(e.target.value)}
          placeholder="Role description (optional)"
          className="w-full p-2 border rounded-lg"
          rows={2}
        />
        <button
          onClick={handleAddRole}
          disabled={!newRole.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          Create Custom Role
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <UserGroupIcon className="w-4 h-4" />
            Predefined Roles:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(predefinedRoleColors).slice(0, 10).map(role => (
              <RoleBadge key={role} role={role} size="sm" showIcon showDescription />
            ))}
          </div>
        </div>

        {customRoles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Cog6ToothIcon className="w-4 h-4" />
              Custom Roles:
            </p>
            <div className="space-y-2">
              {customRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RoleBadge 
                      role={role.name} 
                      size="sm" 
                      showIcon 
                      showDescription 
                      permissions={role.permissions}
                    />
                    {role.description && (
                      <span className="text-xs text-gray-500">{role.description}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete role"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Example usage
export function RoleBadgeExamples() {
  const [roles, setRoles] = useState(['CEO', 'ADMIN', 'MANAGER', 'STAFF']);
  const [customRoles, setCustomRoles] = useState(['Team Lead', 'Product Owner']);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Predefined Roles:</h4>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <RoleBadge 
              key={role} 
              role={role} 
              showIcon 
              animated 
              showDescription
              permissions={['view:dashboard', 'view:sales', 'edit:profile']}
              staffCount={Math.floor(Math.random() * 5) + 1}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Custom Roles (Auto-colored):</h4>
        <div className="flex flex-wrap gap-2">
          {customRoles.map(role => (
            <RoleBadge 
              key={role} 
              role={role} 
              showIcon 
              animated 
              editable
              showDescription
              permissions={['view:dashboard', 'view:reports']}
            />
          ))}
        </div>
      </div>

      <RoleManager organizationId="example-org-id" />
    </div>
  );
}