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
import { useToast } from '@/hooks/useToast';

const supabase = createClient();

// Link definitions with proper typing
interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  perm: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'indigo' | 'pink' | 'teal' | 'red' | 'gray';
  description?: string;
  badge?: (count: number) => React.ReactNode;
}

const links: NavLink[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    perm: 'canViewDashboard', 
    color: 'blue',
    description: 'Overview and analytics'
  },
  { 
    name: 'Sales', 
    href: '/dashboard/sales', 
    icon: CurrencyDollarIcon, 
    perm: 'canViewSales', 
    color: 'green',
    description: 'Track revenue and transactions'
  },
  { 
    name: 'Expenses', 
    href: '/dashboard/expenses', 
    icon: DocumentDuplicateIcon, 
    perm: 'canViewExpenses', 
    color: 'orange',
    description: 'Manage business expenses'
  },
  { 
    name: 'Inventory', 
    href: '/dashboard/inventory', 
    icon: ArchiveBoxIcon, 
    perm: 'canViewInventory', 
    color: 'purple',
    description: 'Stock and product management'
  },
  { 
    name: 'Tasks', 
    href: '/dashboard/tasks', 
    icon: ClockIcon, 
    perm: 'canViewTasks', 
    color: 'yellow',
    description: 'Track assignments and progress'
  },
  { 
    name: 'Staff', 
    href: '/dashboard/staff', 
    icon: UserGroupIcon, 
    perm: 'canViewStaff', 
    color: 'indigo',
    description: 'Manage team members'
  },
  { 
    name: 'Attendance', 
    href: '/dashboard/attendance', 
    icon: ClockIcon, 
    perm: 'canViewAttendance', 
    color: 'pink',
    description: 'Track staff attendance'
  },
  { 
    name: 'Jobs', 
    href: '/dashboard/jobs', 
    icon: DocumentDuplicateIcon, 
    perm: 'canViewJobs', 
    color: 'teal',
    description: 'Project and job tracking'
  },
  { 
    name: 'Notifications', 
    href: '/dashboard/notifications', 
    icon: BellIcon, 
    perm: 'canViewNotifications', 
    color: 'red',
    description: 'View system alerts'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Cog6ToothIcon, 
    perm: 'canViewSettings', 
    color: 'gray',
    description: 'Configure your workspace'
  },
];

// Permission change types
const permissionChangeTypes = {
  ADDED: 'added',
  REMOVED: 'removed',
  UPDATED: 'updated'
};

// Loading skeleton
function NavLinksSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}

// Permission Badge Component
function PermissionBadge({ type }: { type: string }) {
  const colors = {
    added: 'bg-green-100 text-green-800 border-green-200',
    removed: 'bg-red-100 text-red-800 border-red-200',
    updated: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[type as keyof typeof colors] || colors.updated}`}>
      {type}
    </span>
  );
}

export default function NavLinks() {
  const pathname = usePathname();
  const { showToast } = useToast();
  
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [changedLinks, setChangedLinks] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [retryCount, setRetryCount] = useState(0);

  // Load initial permissions and setup real-time subscription
  useEffect(() => {
    loadUserAndPermissions();
    
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  // Load user and permissions with retry logic
  const loadUserAndPermissions = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadPermissions(user.id);
      await loadUnreadCounts(user.id);
      setupRealtimeSubscription(user.id);
      
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      console.error('Error loading user:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const timeout = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadUserAndPermissions();
        }, timeout);
      } else {
        showToast('Failed to load permissions. Please refresh the page.', 'error');
      }
    }
  }, [retryCount, showToast]);

  // Load permissions from database
  const loadPermissions = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')  // FIXED: Changed from 'profiles' to 'staff_profiles'
        .select('permissions, role')
        .eq('id', uid)
        .single();

      if (error) throw error;

      if (data?.permissions) {
        setPermissions(data.permissions);
      }
      if (data?.role) {
        setUserRole(data.role);
      }
      
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load unread counts for notifications
  const loadUnreadCounts = async (uid: string) => {
    try {
      // Get unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false);

      // Get pending tasks count
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', uid)
        .eq('status', 'pending');

      setUnreadCounts({
        notifications: notifCount || 0,
        tasks: taskCount || 0,
      });
      
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
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
          table: 'staff_profiles',  // FIXED: Changed from 'profiles' to 'staff_profiles'
          filter: `id=eq.${uid}`
        },
        (payload) => {
          console.log('🔐 Permissions updated:', payload);
          handlePermissionUpdate(payload.new.permissions, payload.old?.permissions);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Also subscribe to notifications for real-time counts
    const notifChannel = supabase
      .channel('notification-counts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`
        },
        () => {
          loadUnreadCounts(uid);
        }
      )
      .subscribe();

    return { channel, notifChannel };
  };

  // Handle permission updates with animations
  const handlePermissionUpdate = (newPerms: string[], oldPerms: string[] = []) => {
    setLastUpdate(new Date());
    
    // Find which permissions changed
    const added = newPerms?.filter(p => !oldPerms?.includes(p)) || [];
    const removed = oldPerms?.filter(p => !newPerms?.includes(p)) || [];
    
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
    setPermissions(newPerms || []);
    
    // Show notification for permission changes
    if (added.length > 0) {
      const names = added.map(p => links.find(l => l.perm === p)?.name || p).join(', ');
      showToast(`New access granted: ${names}`, 'success');
    }
    if (removed.length > 0) {
      const names = removed.map(p => links.find(l => l.perm === p)?.name || p).join(', ');
      showToast(`Access removed: ${names}`, 'info');
    }
  };

  // Get link color classes
  const getLinkColor = (color: NavLink['color'], isActive: boolean) => {
    const colors: Record<NavLink['color'], { active: string, hover: string, bg: string }> = {
      blue: { 
        active: 'bg-blue-100 text-blue-600', 
        hover: 'hover:bg-blue-50 hover:text-blue-600',
        bg: 'bg-blue-500'
      },
      green: { 
        active: 'bg-green-100 text-green-600', 
        hover: 'hover:bg-green-50 hover:text-green-600',
        bg: 'bg-green-500'
      },
      orange: { 
        active: 'bg-orange-100 text-orange-600', 
        hover: 'hover:bg-orange-50 hover:text-orange-600',
        bg: 'bg-orange-500'
      },
      purple: { 
        active: 'bg-purple-100 text-purple-600', 
        hover: 'hover:bg-purple-50 hover:text-purple-600',
        bg: 'bg-purple-500'
      },
      yellow: { 
        active: 'bg-yellow-100 text-yellow-600', 
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        bg: 'bg-yellow-500'
      },
      indigo: { 
        active: 'bg-indigo-100 text-indigo-600', 
        hover: 'hover:bg-indigo-50 hover:text-indigo-600',
        bg: 'bg-indigo-500'
      },
      pink: { 
        active: 'bg-pink-100 text-pink-600', 
        hover: 'hover:bg-pink-50 hover:text-pink-600',
        bg: 'bg-pink-500'
      },
      teal: { 
        active: 'bg-teal-100 text-teal-600', 
        hover: 'hover:bg-teal-50 hover:text-teal-600',
        bg: 'bg-teal-500'
      },
      red: { 
        active: 'bg-red-100 text-red-600', 
        hover: 'hover:bg-red-50 hover:text-red-600',
        bg: 'bg-red-500'
      },
      gray: { 
        active: 'bg-gray-100 text-gray-600', 
        hover: 'hover:bg-gray-50 hover:text-gray-600',
        bg: 'bg-gray-500'
      },
    };
    
    return colors[color] || colors.blue;
  };

  // Render notification badge
  const renderBadge = (link: NavLink) => {
    if (link.name === 'Notifications' && unreadCounts.notifications > 0) {
      return (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
          {unreadCounts.notifications > 9 ? '9+' : unreadCounts.notifications}
        </span>
      );
    }
    if (link.name === 'Tasks' && unreadCounts.tasks > 0) {
      return (
        <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
      );
    }
    return null;
  };

  if (loading) {
    return <NavLinksSkeleton />;
  }

  const filteredLinks = links.filter((link) => permissions.includes(link.perm));

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Navigation
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* User Role */}
        {userRole && (
          <div className="mt-2">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {userRole}
            </span>
          </div>
        )}
        
        {/* Last Update */}
        <div className="mt-2 text-xs text-gray-400">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {filteredLinks.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {filteredLinks.map((link) => {
                const LinkIcon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
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
                    }}
                    transition={{ 
                      duration: 0.3,
                      scale: { duration: 0.5, times: [0, 0.5, 1] }
                    }}
                    className="relative"
                    layout
                  >
                    {/* Notification Badge for Changed Permissions */}
                    {isChanged && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -left-1 -top-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white z-10"
                      />
                    )}

                    {/* Count Badge */}
                    {renderBadge(link)}

                    <Link
                      href={link.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 relative group',
                        colors.hover,
                        {
                          [colors.active]: isActive,
                          'text-gray-700': !isActive,
                          'shadow-sm': isChanged,
                        }
                      )}
                      title={link.description}
                    >
                      <LinkIcon className={clsx(
                        'w-5 h-5 transition-transform duration-200 flex-shrink-0',
                        isChanged && 'scale-110',
                        isActive ? `text-${link.color}-600` : 'text-gray-500 group-hover:text-gray-700'
                      )} />
                      
                      <span className="flex-1 truncate">{link.name}</span>
                      
                      {/* Active Indicator Dot */}
                      {isActive && (
                        <motion.div
                          layoutId="activeDot"
                          className={`w-2 h-2 rounded-full bg-${link.color}-500`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>

                    {/* Tooltip on hover (desktop only) */}
                    {link.description && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-20">
                        {link.description}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 text-center"
            >
              <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No permissions yet</p>
              <p className="text-xs text-gray-400 mt-1">Contact admin for access</p>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Connection Status */}
      {!isLive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-2 left-2 right-2 bg-yellow-50 text-yellow-700 text-xs p-2 rounded border border-yellow-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
            <span>Reconnecting to real-time updates...</span>
          </div>
        </motion.div>
      )}

      {/* Permission Summary */}
      {filteredLinks.length > 0 && (
        <div className="mt-auto p-3 border-t text-xs text-gray-400">
          <p>{filteredLinks.length} of {links.length} modules accessible</p>
        </div>
      )}
    </div>
  );
}