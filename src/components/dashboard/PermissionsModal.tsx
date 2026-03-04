// /src/components/dashboard/PermissionsModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface Permission {
  id: string;
  key: string;
  name: string;
  category: 'sales' | 'expenses' | 'inventory' | 'staff' | 'tasks' | 'reports' | 'admin' | 'attendance';
  description?: string;
  created_at?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  staffEmail?: string;
  currentPermissions: string[];
  currentRole?: string;
  organizationId: string;
  onSave: (permissions: string[], roleId?: string) => Promise<void>;
}

// Loading skeleton
function PermissionsSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded"></div>
        {[1,2,3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(j => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Badge Component
function CategoryBadge({ category, count, total }: { category: string; count: number; total: number }) {
  const colors: Record<string, string> = {
    sales: 'bg-green-100 text-green-700 border-green-200',
    expenses: 'bg-orange-100 text-orange-700 border-orange-200',
    inventory: 'bg-purple-100 text-purple-700 border-purple-200',
    staff: 'bg-blue-100 text-blue-700 border-blue-200',
    tasks: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    reports: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    admin: 'bg-red-100 text-red-700 border-red-200',
    attendance: 'bg-pink-100 text-pink-700 border-pink-200',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${colors[category] || 'bg-gray-100 text-gray-700'}`}>
      {category} ({count}/{total})
    </span>
  );
}

// Permission Card Component
function PermissionCard({ 
  permission, 
  selected, 
  onToggle,
  disabled 
}: { 
  permission: Permission; 
  selected: boolean; 
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
      selected 
        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
        : 'hover:bg-gray-50 border-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        disabled={disabled}
        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{permission.name}</p>
        {permission.description && (
          <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1 font-mono">{permission.key}</p>
      </div>
    </label>
  );
}

export default function PermissionsModal({ 
  isOpen, 
  onClose, 
  staffId,
  staffName,
  staffEmail,
  currentPermissions,
  currentRole = "Custom",
  organizationId,
  onSave 
}: PermissionsModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<string[]>(currentPermissions);
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Fetch permissions and roles
  useEffect(() => {
    if (!isOpen || !organizationId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch permissions
        const { data: perms, error: permsError } = await supabase
          .from('permissions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('category', { ascending: true });

        if (permsError) throw permsError;

        // Fetch custom roles
        const { data: roles, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .eq('organization_id', organizationId);

        if (rolesError) throw rolesError;

        // Fetch audit logs for this staff
        const { data: logs, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', staffId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsError) throw logsError;

        setPermissions(perms || []);
        setCustomRoles(roles || []);
        setAuditLogs(logs || []);

      } catch (error: any) {
        console.error('Error fetching permissions data:', error);
        showToast(error.message || 'Failed to load permissions', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup real-time subscription
    const channel = supabase
      .channel('permissions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'permissions', filter: `organization_id=eq.${organizationId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roles', filter: `organization_id=eq.${organizationId}` },
        () => fetchData()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, organizationId, staffId]);

  // Reset state when modal opens with new staff
  useEffect(() => {
    if (isOpen) {
      setSelected(currentPermissions);
      setSelectedRole(currentRole);
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [isOpen, currentPermissions, currentRole]);

  // Get unique categories from permissions
  const categories = useMemo(() => {
    return ['all', ...new Set(permissions.map(p => p.category))];
  }, [permissions]);

  // Filter permissions based on search and category
  const filteredPermissions = useMemo(() => {
    return permissions.filter(perm => {
      const matchesSearch = 
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.key.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || perm.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [permissions, searchTerm, selectedCategory]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [filteredPermissions]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = permissions.length;
    const selectedCount = selected.length;
    const percentage = total > 0 ? Math.round((selectedCount / total) * 100) : 0;
    
    return { total, selected: selectedCount, percentage };
  }, [permissions, selected]);

  // Handle role template selection
  const applyRoleTemplate = (role: Role | string) => {
    let rolePermissions: string[] = [];
    let roleName: string;

    if (typeof role === 'string') {
      // Predefined role
      const templates: Record<string, string[]> = {
        "Admin": permissions.map(p => p.key),
        "Manager": permissions
          .filter(p => !p.key.includes('admin') && !p.key.includes('billing'))
          .map(p => p.key),
        "Sales Rep": permissions
          .filter(p => p.category === 'sales' || p.category === 'inventory' || p.category === 'tasks')
          .map(p => p.key),
        "Inventory Manager": permissions
          .filter(p => p.category === 'inventory' || p.category === 'reports')
          .map(p => p.key),
        "View Only": permissions
          .filter(p => p.key.includes('view'))
          .map(p => p.key),
      };
      rolePermissions = templates[role] || [];
      roleName = role;
    } else {
      // Custom role from database
      rolePermissions = role.permissions;
      roleName = role.name;
    }

    setSelected(rolePermissions);
    setSelectedRole(roleName);
  };

  // Handle select all in category
  const selectCategory = (category: string, select: boolean) => {
    const categoryPermissions = permissions
      .filter(p => p.category === category)
      .map(p => p.key);
    
    if (select) {
      setSelected([...new Set([...selected, ...categoryPermissions])]);
    } else {
      setSelected(selected.filter(p => !categoryPermissions.includes(p)));
    }
    setSelectedRole("Custom");
  };

  // Check if category is fully selected
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = permissions
      .filter(p => p.category === category)
      .map(p => p.key);
    return categoryPermissions.length > 0 && categoryPermissions.every(p => selected.includes(p));
  };

  // Check if category has any selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissions
      .filter(p => p.category === category)
      .map(p => p.key);
    const selectedInCategory = categoryPermissions.filter(p => selected.includes(p));
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissions.length;
  };

  // Handle save with audit log
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save permissions
      await onSave(selected, selectedRole !== "Custom" ? selectedRole : undefined);

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: staffId,
          action: 'permissions_updated',
          details: {
            previous_permissions: currentPermissions,
            new_permissions: selected,
            previous_role: currentRole,
            new_role: selectedRole,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          },
          created_at: new Date().toISOString()
        });

      showToast('Permissions updated successfully', 'success');
      setShowConfirm(false);
      onClose();
      
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      showToast(error.message || 'Failed to save permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <PermissionsSkeleton />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Permissions for {staffName}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Connecting...'}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {staffEmail && `${staffEmail} • `}Grant or restrict access to features
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Live Status Bar */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">
                Changes take effect immediately
              </span>
            </div>
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <DocumentTextIcon className="w-4 h-4" />
              {showAuditLog ? 'Hide' : 'View'} History
            </button>
          </div>

          {/* Audit Log Section */}
          <AnimatePresence>
            {showAuditLog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="text-sm font-semibold mb-3">Permission Change History</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {auditLogs.length > 0 ? (
                      auditLogs.map(log => (
                        <div key={log.id} className="text-xs p-2 bg-white rounded border">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.action}</span>
                            <span className="text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-500 mt-1">
                            {JSON.stringify(log.details).slice(0, 100)}...
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No permission changes recorded
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Role Templates</label>
            <div className="flex flex-wrap gap-2">
              {/* Predefined roles */}
              {["Admin", "Manager", "Sales Rep", "Inventory Manager", "View Only"].map(role => (
                <button
                  key={role}
                  onClick={() => applyRoleTemplate(role)}
                  className={`px-3 py-1.5 text-sm rounded-full transition ${
                    selectedRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
              
              {/* Custom roles from database */}
              {customRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => applyRoleTemplate(role)}
                  className={`px-3 py-1.5 text-sm rounded-full transition ${
                    selectedRole === role.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg min-w-[150px]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Selection Progress</span>
              <span className="font-medium">{stats.percentage}% ({stats.selected}/{stats.total})</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentage}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="border rounded-lg p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold capitalize text-lg">{category}</h3>
                    <CategoryBadge 
                      category={category}
                      count={perms.filter(p => selected.includes(p.key)).length}
                      total={perms.length}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectCategory(category, true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => selectCategory(category, false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((perm) => (
                    <PermissionCard
                      key={perm.key}
                      permission={perm}
                      selected={selected.includes(perm.key)}
                      onToggle={() => {
                        if (selected.includes(perm.key)) {
                          setSelected(selected.filter(p => p !== perm.key));
                        } else {
                          setSelected([...selected, perm.key]);
                        }
                        setSelectedRole("Custom");
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Selected Permissions</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.selected} of {stats.total} permissions selected • Role: {selectedRole}
                </p>
              </div>
              <button
                onClick={() => setSelected([])}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            {/* Selected Tags */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selected.slice(0, 8).map(key => {
                  const perm = permissions.find(p => p.key === key);
                  return perm && (
                    <span key={key} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {perm.name}
                      <button
                        onClick={() => setSelected(selected.filter(p => p !== key))}
                        className="hover:text-red-600"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {selected.length > 8 && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    +{selected.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Permissions'
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ShieldCheckIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2 text-center">Confirm Permission Changes</h3>
              <p className="text-gray-600 mb-4 text-center">
                Are you sure you want to update permissions for <strong>{staffName}</strong>?
                This will affect their access immediately.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-700 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  This action will be logged for audit purposes
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isSaving ? 'Saving...' : 'Confirm Changes'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}