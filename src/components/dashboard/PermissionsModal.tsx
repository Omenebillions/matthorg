// /src/components/dashboard/PermissionsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";

interface Permission {
  key: string;
  label: string;
  category: 'sales' | 'expenses' | 'inventory' | 'staff' | 'tasks' | 'reports' | 'admin';
  description?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_default?: boolean;
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  currentPermissions: string[];
  currentRole?: string;
  organizationId: string;
  onSave: (permissions: string[], roleId?: string) => Promise<void>;
}

// Extended permissions with categories and descriptions
const availablePermissions: Permission[] = [
  // Sales permissions
  { key: "sales:view", label: "View Sales", category: "sales", description: "View sales transactions and reports" },
  { key: "sales:create", label: "Create Sales", category: "sales", description: "Add new sales transactions" },
  { key: "sales:edit", label: "Edit Sales", category: "sales", description: "Modify existing sales" },
  { key: "sales:delete", label: "Delete Sales", category: "sales", description: "Remove sales transactions" },
  { key: "sales:refund", label: "Process Refunds", category: "sales", description: "Issue refunds to customers" },
  
  // Expenses permissions
  { key: "expenses:view", label: "View Expenses", category: "expenses", description: "View expense entries" },
  { key: "expenses:create", label: "Create Expenses", category: "expenses", description: "Add new expenses" },
  { key: "expenses:edit", label: "Edit Expenses", category: "expenses", description: "Modify expenses" },
  { key: "expenses:approve", label: "Approve Expenses", category: "expenses", description: "Approve expense reports" },
  
  // Inventory permissions
  { key: "inventory:view", label: "View Inventory", category: "inventory", description: "View product catalog" },
  { key: "inventory:create", label: "Add Products", category: "inventory", description: "Create new products" },
  { key: "inventory:edit", label: "Edit Products", category: "inventory", description: "Modify product details" },
  { key: "inventory:delete", label: "Delete Products", category: "inventory", description: "Remove products" },
  { key: "inventory:manage-stock", label: "Manage Stock", category: "inventory", description: "Update inventory levels" },
  
  // Staff permissions
  { key: "staff:view", label: "View Staff", category: "staff", description: "View staff directory" },
  { key: "staff:create", label: "Add Staff", category: "staff", description: "Invite new team members" },
  { key: "staff:edit", label: "Edit Staff", category: "staff", description: "Modify staff details" },
  { key: "staff:deactivate", label: "Deactivate Staff", category: "staff", description: "Remove staff access" },
  { key: "staff:manage-permissions", label: "Manage Permissions", category: "staff", description: "Change staff roles" },
  
  // Tasks permissions
  { key: "tasks:view", label: "View Tasks", category: "tasks", description: "See all tasks" },
  { key: "tasks:create", label: "Create Tasks", category: "tasks", description: "Add new tasks" },
  { key: "tasks:edit", label: "Edit Tasks", category: "tasks", description: "Modify tasks" },
  { key: "tasks:assign", label: "Assign Tasks", category: "tasks", description: "Assign tasks to staff" },
  { key: "tasks:delete", label: "Delete Tasks", category: "tasks", description: "Remove tasks" },
  
  // Reports permissions
  { key: "reports:view", label: "View Reports", category: "reports", description: "Access analytics" },
  { key: "reports:export", label: "Export Reports", category: "reports", description: "Download data" },
  { key: "reports:create", label: "Create Reports", category: "reports", description: "Build custom reports" },
  
  // Admin permissions
  { key: "admin:settings", label: "Manage Settings", category: "admin", description: "Change organization settings" },
  { key: "admin:billing", label: "Manage Billing", category: "admin", description: "Access billing portal" },
  { key: "admin:audit-logs", label: "View Audit Logs", category: "admin", description: "See all activity" },
];

// Pre-defined role templates
const roleTemplates: Record<string, string[]> = {
  "Admin": availablePermissions.map(p => p.key),
  "Manager": [
    "sales:view", "sales:create", "sales:edit",
    "expenses:view", "expenses:create", "expenses:approve",
    "inventory:view", "inventory:edit", "inventory:manage-stock",
    "staff:view",
    "tasks:view", "tasks:create", "tasks:assign",
    "reports:view"
  ],
  "Sales Rep": [
    "sales:view", "sales:create",
    "inventory:view",
    "tasks:view", "tasks:create"
  ],
  "Inventory Manager": [
    "inventory:view", "inventory:create", "inventory:edit", "inventory:manage-stock",
    "reports:view"
  ],
  "View Only": [
    "sales:view",
    "expenses:view",
    "inventory:view",
    "staff:view",
    "tasks:view"
  ]
};

export default function PermissionsModal({ 
  isOpen, 
  onClose, 
  staffId,
  staffName, 
  currentPermissions,
  currentRole = "Custom",
  organizationId,
  onSave 
}: PermissionsModalProps) {
  const [selected, setSelected] = useState<string[]>(currentPermissions);
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const supabase = createClient();

  // Live roles data
  const { data: customRoles = [] } = useRealtime<Role>(
    { table: 'roles', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Reset state when modal opens with new staff
  useEffect(() => {
    if (isOpen) {
      setSelected(currentPermissions);
      setSelectedRole(currentRole);
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [isOpen, currentPermissions, currentRole]);

  // Get unique categories
  const categories = ["all", ...new Set(availablePermissions.map(p => p.category))];

  // Filter permissions based on search and category
  const filteredPermissions = availablePermissions.filter(perm => {
    const matchesSearch = perm.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perm.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || perm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group permissions by category for display
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Handle role template selection
  const applyRoleTemplate = (roleName: string) => {
    const template = roleTemplates[roleName] || roleTemplates["View Only"];
    setSelected(template);
    setSelectedRole(roleName);
  };

  // Handle select all in category
  const selectCategory = (category: string, select: boolean) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.key);
    
    if (select) {
      setSelected([...new Set([...selected, ...categoryPermissions])]);
    } else {
      setSelected(selected.filter(p => !categoryPermissions.includes(p)));
    }
  };

  // Check if category is fully selected
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.key);
    return categoryPermissions.every(p => selected.includes(p));
  };

  // Check if category has any selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.key);
    const selectedInCategory = categoryPermissions.filter(p => selected.includes(p));
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissions.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold">Permissions for {staffName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Grant or restrict access to features
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Role Templates */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Role Templates</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(roleTemplates).map(role => (
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
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Permissions Grid */}
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="border rounded-lg p-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold capitalize">{category}</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isCategoryFullySelected(category)}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isCategoryPartiallySelected(category);
                        }
                      }}
                      onChange={(e) => selectCategory(category, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-500">
                      {perms.filter(p => selected.includes(p.key)).length}/{perms.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {perms.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded group cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(perm.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected([...selected, perm.key]);
                        } else {
                          setSelected(selected.filter(p => p !== perm.key));
                        }
                        setSelectedRole("Custom");
                      }}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">{perm.label}</span>
                      {perm.description && (
                        <p className="text-xs text-gray-500 group-hover:text-gray-700">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </label>
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
                {selected.length} of {availablePermissions.length} permissions selected
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
          <div className="flex flex-wrap gap-2 mt-3">
            {selected.slice(0, 5).map(key => {
              const perm = availablePermissions.find(p => p.key === key);
              return perm && (
                <span key={key} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {perm.label}
                </span>
              );
            })}
            {selected.length > 5 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                +{selected.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-2">Confirm Permission Changes</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to update permissions for {staffName}?
                This will affect their access immediately.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    await onSave(selected, selectedRole !== "Custom" ? selectedRole : undefined);
                    setIsSaving(false);
                    setShowConfirm(false);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm
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