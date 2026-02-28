'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient();

// All links + their permission keys
const links = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, perm: 'canViewDashboard', color: 'blue' },
  { name: 'Sales', href: '/dashboard/sales', icon: CurrencyDollarIcon, perm: 'canViewSales', color: 'green' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: DocumentDuplicateIcon, perm: 'canViewExpenses', color: 'orange' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ArchiveBoxIcon, perm: 'canViewInventory', color: 'purple' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClockIcon, perm: 'canViewTasks', color: 'yellow' },
  { name: 'Staff', href: '/dashboard/staff', icon: UserGroupIcon, perm: 'canViewStaff', color: 'indigo' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: ClockIcon, perm: 'canViewAttendance', color: 'pink' },
  { name: 'Jobs', href: '/dashboard/jobs', icon: DocumentDuplicateIcon, perm: 'canViewJobs', color: 'teal' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, perm: 'canViewNotifications', color: 'red' },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, perm: 'canViewSettings', color: 'gray' },
];

// Permission change types for animation
const permissionChangeTypes = {
  ADDED: 'added',
  REMOVED: 'removed',
  UPDATED: 'updated'
};

export default function NavLinks() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [changedLinks, setChangedLinks] = useState<Set<string>>(new Set());

  // Load initial permissions and setup real-time subscription
  useEffect(() => {
    loadUserAndPermissions();
    
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  // Load user and permissions
  const loadUserAndPermissions = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);
    await loadPermissions(user.id);
    setupRealtimeSubscription(user.id);
  };

  // Load permissions from database
  const loadPermissions = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions, role')
      .eq('id', uid)
      .single();

    if (!error && data?.permissions) {
      setPermissions(data.permissions);
    }

    setLoading(false);
  };

  // Setup real-time subscription for permission changes
  const setupRealtimeSubscription = (uid: string) => {
    const channel = supabase
      .channel('permissions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`
        },
        (payload) => {
          console.log('🔐 Permissions updated:', payload);
          handlePermissionUpdate(payload.new.permissions, payload.old.permissions);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return channel;
  };

  // Handle permission updates with animations
  const handlePermissionUpdate = (newPerms: string[], oldPerms: string[]) => {
    setLastUpdate(new Date());
    
    // Find which permissions changed
    const added = newPerms.filter(p => !oldPerms?.includes(p));
    const removed = oldPerms?.filter(p => !newPerms.includes(p)) || [];
    
    // Update changed links for animation
    const changed = new Set<string>();
    added.forEach(perm => {
      const link = links.find(l => l.perm === perm);
      if (link) changed.add(link.name);
    });
    removed.forEach(perm => {
      const link = links.find(l => l.perm === perm);
      if (link) changed.add(link.name);
    });
    
    setChangedLinks(changed);
    
    // Clear animations after 2 seconds
    setTimeout(() => {
      setChangedLinks(new Set());
    }, 2000);
    
    // Update permissions
    setPermissions(newPerms);
    
    // Show notification
    showPermissionNotification(added, removed);
  };

  // Show notification for permission changes
  const showPermissionNotification = (added: string[], removed: string[]) => {
    if (added.length > 0) {
      const names = added.map(p => links.find(l => l.perm === p)?.name || p).join(', ');
      // You could integrate with your notification system here
      console.log(`🔓 New permissions granted: ${names}`);
    }
    if (removed.length > 0) {
      const names = removed.map(p => links.find(l => l.perm === p)?.name || p).join(', ');
      console.log(`🔒 Permissions removed: ${names}`);
    }
  };

  // Get link color classes
  const getLinkColor = (color: string, isActive: boolean) => {
    const colors: Record<string, { active: string, hover: string }> = {
      blue: { active: 'bg-blue-100 text-blue-600', hover: 'hover:bg-blue-50 hover:text-blue-600' },
      green: { active: 'bg-green-100 text-green-600', hover: 'hover:bg-green-50 hover:text-green-600' },
      orange: { active: 'bg-orange-100 text-orange-600', hover: 'hover:bg-orange-50 hover:text-orange-600' },
      purple: { active: 'bg-purple-100 text-purple-600', hover: 'hover:bg-purple-50 hover:text-purple-600' },
      yellow: { active: 'bg-yellow-100 text-yellow-600', hover: 'hover:bg-yellow-50 hover:text-yellow-600' },
      indigo: { active: 'bg-indigo-100 text-indigo-600', hover: 'hover:bg-indigo-50 hover:text-indigo-600' },
      pink: { active: 'bg-pink-100 text-pink-600', hover: 'hover:bg-pink-50 hover:text-pink-600' },
      teal: { active: 'bg-teal-100 text-teal-600', hover: 'hover:bg-teal-50 hover:text-teal-600' },
      red: { active: 'bg-red-100 text-red-600', hover: 'hover:bg-red-50 hover:text-red-600' },
      gray: { active: 'bg-gray-100 text-gray-600', hover: 'hover:bg-gray-50 hover:text-gray-600' },
    };
    
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  const filteredLinks = links.filter((link) => permissions.includes(link.perm));

  return (
    <div className="relative">
      {/* Live Status Indicator */}
      <div className="absolute top-0 right-0 flex items-center space-x-2 p-2">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-400">
          {isLive ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Last Update Timestamp */}
      <div className="text-xs text-gray-400 text-right mt-6 mr-2">
        Updated: {lastUpdate.toLocaleTimeString()}
      </div>

      <AnimatePresence>
        {filteredLinks.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href;
          const colors = getLinkColor(link.color, isActive);
          const isChanged = changedLinks.has(link.name);

          return (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: isChanged ? [1, 1.05, 1] : 1,
                backgroundColor: isChanged ? ['#fef3c7', '#ffffff', '#ffffff'] : '#ffffff',
              }}
              transition={{ 
                duration: 0.3,
                scale: { duration: 0.5, times: [0, 0.5, 1] }
              }}
              exit={{ opacity: 0, x: -20 }}
              className="relative"
            >
              {/* Notification Badge for Changed Permissions */}
              {isChanged && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -left-2 -top-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"
                />
              )}

              <Link
                href={link.href}
                className={clsx(
                  'flex h-[48px] items-center gap-2 rounded-md p-3 text-sm font-medium transition-all duration-200 md:px-3 relative',
                  colors.hover,
                  {
                    [colors.active]: isActive,
                    'bg-white': !isActive,
                    'shadow-md': isChanged,
                  }
                )}
              >
                <LinkIcon className={clsx(
                  'w-6 transition-transform duration-200',
                  isChanged && 'scale-110'
                )} />
                <span className="hidden md:block">{link.name}</span>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 text-center"
        >
          <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No permissions yet</p>
          <p className="text-xs text-gray-400 mt-1">Contact admin for access</p>
        </motion.div>
      )}

      {/* Connection Status Tooltip */}
      {!isLive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-2 right-2 bg-yellow-50 text-yellow-700 text-xs p-2 rounded border border-yellow-200"
        >
          ⚠️ Reconnecting to real-time updates...
        </motion.div>
      )}
    </div>
  );
}