// /src/components/dashboard/RoleBadge.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
  customColor?: string; // Allow custom color override
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
const getRoleDescription = (role: string, isPredefined: boolean): string => {
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
  
  return `Custom Role: ${role} - Configure permissions in settings`;
};

export default function RoleBadge({ 
  role, 
  size = 'md', 
  showIcon = false,
  animated = false,
  onClick,
  className = '',
  customColor
}: RoleBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
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
  
  const description = getRoleDescription(role, isPredefined);

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
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
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
      {!isPredefined && size === 'lg' && (
        <span className="text-xs opacity-50 ml-1">(custom)</span>
      )}
    </span>
  );

  // Animated version
  if (animated) {
    return (
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
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap"
            >
              {description}
              {!isPredefined && (
                <div className="text-xs text-yellow-300 mt-1">
                  ⚡ Custom role - Manage in Settings
                </div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Static version with tooltip
  return (
    <div className="relative inline-block">
      {badgeContent}
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap"
          >
            {description}
            {!isPredefined && (
              <div className="text-xs text-yellow-300 mt-1">
                ⚡ Custom role
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component for role management (to be used in admin settings)
export function RoleManager({ onRoleCreated }: { onRoleCreated?: (role: string) => void }) {
  const [newRole, setNewRole] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  const handleAddRole = () => {
    if (newRole.trim() && !customRoles.includes(newRole.trim())) {
      setCustomRoles([...customRoles, newRole.trim()]);
      onRoleCreated?.(newRole.trim());
      setNewRole('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="text-lg font-bold mb-4">Custom Roles</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Enter custom role (e.g., 'Team Lead')"
          className="flex-1 p-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
        />
        <button
          onClick={handleAddRole}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Role
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Predefined Roles:</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(predefinedRoleColors).slice(0, 8).map(role => (
            <RoleBadge key={role} role={role} size="sm" showIcon />
          ))}
        </div>

        {customRoles.length > 0 && (
          <>
            <p className="text-sm font-medium text-gray-700 mt-4">Custom Roles:</p>
            <div className="flex flex-wrap gap-2">
              {customRoles.map(role => (
                <RoleBadge key={role} role={role} size="sm" showIcon animated />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Example usage
export function RoleBadgeExamples() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Predefined Roles:</h4>
        <div className="space-x-2">
          <RoleBadge role="CEO" showIcon animated />
          <RoleBadge role="ADMIN" showIcon animated />
          <RoleBadge role="MANAGER" showIcon animated />
          <RoleBadge role="STAFF" showIcon animated />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Custom Roles (Auto-colored):</h4>
        <div className="space-x-2">
          <RoleBadge role="Team Lead" showIcon animated />
          <RoleBadge role="Product Owner" showIcon animated />
          <RoleBadge role="Scrum Master" showIcon animated />
          <RoleBadge role="QA Tester" showIcon animated />
        </div>
      </div>

      <RoleManager />
    </div>
  );
}