// /src/components/SideNav.tsx
"use client";

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

interface StaffPermissions {
  canViewDashboard: boolean;
  canViewSales: boolean;
  canViewExpenses: boolean;
  canViewInventory: boolean;
  canViewTasks: boolean;
  canViewStaff: boolean;
  canViewAttendance: boolean;
  canViewJobs: boolean;
  canViewNotifications: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
}

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  organization_id: string;
  permissions?: string[];
}

interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  perm: keyof StaffPermissions;
  badge?: 'notification' | 'count';
  group?: 'main' | 'management' | 'tools';
  description?: string;
}

const navLinks: NavLink[] = [
  // Main Group
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    perm: 'canViewDashboard', 
    group: 'main',
    description: 'Overview and analytics'
  },
  { 
    name: 'Sales', 
    href: '/dashboard/sales', 
    icon: CurrencyDollarIcon, 
    perm: 'canViewSales', 
    group: 'main',
    description: 'Track revenue and transactions'
  },
  { 
    name: 'Expenses', 
    href: '/dashboard/expenses', 
    icon: DocumentDuplicateIcon, 
    perm: 'canViewExpenses', 
    group: 'main',
    description: 'Manage business expenses'
  },
  { 
    name: 'Inventory', 
    href: '/dashboard/inventory', 
    icon: ArchiveBoxIcon, 
    perm: 'canViewInventory', 
    group: 'main',
    description: 'Stock and product management'
  },
  
  // Management Group
  { 
    name: 'Tasks', 
    href: '/dashboard/tasks', 
    icon: ClockIcon, 
    perm: 'canViewTasks', 
    group: 'management',
    description: 'Track assignments and progress',
    badge: 'count'
  },
  { 
    name: 'Staff', 
    href: '/dashboard/staff', 
    icon: UserGroupIcon, 
    perm: 'canViewStaff', 
    group: 'management',
    description: 'Manage team members'
  },
  { 
    name: 'Attendance', 
    href: '/dashboard/attendance', 
    icon: CalendarIcon, 
    perm: 'canViewAttendance', 
    group: 'management',
    description: 'Track staff attendance'
  },
  { 
    name: 'Jobs', 
    href: '/dashboard/jobs', 
    icon: BriefcaseIcon, 
    perm: 'canViewJobs', 
    group: 'management',
    description: 'Project and job tracking'
  },
  
  // Tools Group
  { 
    name: 'Reports', 
    href: '/dashboard/reports', 
    icon: ChartBarIcon, 
    perm: 'canViewReports', 
    group: 'tools',
    description: 'Analytics and reports'
  },
  { 
    name: 'Notifications', 
    href: '/dashboard/notifications', 
    icon: BellIcon, 
    perm: 'canViewNotifications', 
    group: 'tools',
    description: 'View system alerts',
    badge: 'notification'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Cog6ToothIcon, 
    perm: 'canViewSettings', 
    group: 'tools',
    description: 'Configure your workspace'
  },
];

const groupNames = {
  main: 'Main',
  management: 'Management',
  tools: 'Tools',
};

const groupColors = {
  main: 'border-blue-200 bg-blue-50/50',
  management: 'border-green-200 bg-green-50/50',
  tools: 'border-purple-200 bg-purple-50/50',
};

// Loading skeleton
function SideNavSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
      <div className="mt-auto pt-4 border-t">
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

// User Profile Dropdown
function UserProfile({ user, onSignOut }: { user: StaffProfile | null; onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name ? getInitials(user.full_name) : 'U'}
          </div>
        )}
        <div className="hidden md:block text-left flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.full_name || 'Loading...'}</p>
          <p className="text-xs text-gray-500 truncate">{user?.role || 'Staff'}</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border py-1"
          >
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <UserCircleIcon className="w-4 h-4" />
              Profile
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </Link>
            <hr className="my-1" />
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SideNav() {
  const supabase = createClient();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user and permissions
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return;

      // Fetch staff profile
      const { data: staffProfile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;
      
      if (staffProfile) {
        setUser(staffProfile);

        // Get permissions from either role-based or individual permissions
        const isAdmin = ['CEO', 'Admin', 'Manager', 'Director'].includes(staffProfile.role);
        const userPermissions = staffProfile.permissions || [];
        
        setPermissions({
          canViewDashboard: true, // Everyone can see dashboard
          canViewSales: isAdmin || userPermissions.includes('view:sales'),
          canViewExpenses: isAdmin || userPermissions.includes('view:expenses'),
          canViewInventory: isAdmin || userPermissions.includes('view:inventory'),
          canViewTasks: isAdmin || userPermissions.includes('view:tasks'),
          canViewStaff: isAdmin || userPermissions.includes('view:staff'),
          canViewAttendance: isAdmin || userPermissions.includes('view:attendance'),
          canViewJobs: isAdmin || userPermissions.includes('view:jobs'),
          canViewNotifications: true, // Everyone can see notifications
          canViewReports: isAdmin || userPermissions.includes('view:reports'),
          canViewSettings: isAdmin || userPermissions.includes('view:settings'),
        });
      }

      // Get unread notifications count
      const { count: notifCount, error: notifError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('read', false);
      
      if (!notifError) setUnreadCount(notifCount || 0);

      // Get pending tasks count
      const { count: taskCount, error: taskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', authUser.id)
        .eq('status', 'pending');
      
      if (!taskError) setPendingTasks(taskCount || 0);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      showToast(error.message || 'Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  // Setup real-time subscriptions
  useEffect(() => {
    loadUserData();

    const setupSubscriptions = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Subscribe to notifications
      const notifChannel = supabase
        .channel('nav-notifications')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${authUser.id}`
          },
          (payload) => {
            setUnreadCount(prev => prev + 1);
            showToast(payload.new.message || 'New notification', 'info');
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${authUser.id}`
          },
          () => {
            // Refresh count when notifications are marked as read
            supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', authUser.id)
              .eq('read', false)
              .then(({ count }) => setUnreadCount(count || 0));
          }
        )
        .subscribe();

      // Subscribe to tasks for pending count
      const tasksChannel = supabase
        .channel('nav-tasks')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'tasks',
            filter: `assignee_id=eq.${authUser.id}`
          },
          () => {
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('assignee_id', authUser.id)
              .eq('status', 'pending')
              .then(({ count }) => setPendingTasks(count || 0));
          }
        )
        .subscribe();

      // Subscribe to profile updates
      const profileChannel = supabase
        .channel('nav-profile')
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'staff_profiles',
            filter: `id=eq.${authUser.id}`
          },
          (payload) => {
            setUser(payload.new as StaffProfile);
            showToast('Profile updated', 'info');
          }
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(notifChannel);
        supabase.removeChannel(tasksChannel);
        supabase.removeChannel(profileChannel);
      };
    };

    const cleanup = setupSubscriptions();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [supabase, showToast, loadUserData]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showToast('Signed out successfully', 'success');
      router.push('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      showToast(error.message || 'Failed to sign out', 'error');
    }
  };

  if (loading) {
    return <SideNavSkeleton />;
  }

  if (!permissions || !user) {
    return (
      <div className="p-4 text-center">
        <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Unable to load navigation</p>
      </div>
    );
  }

  // Group links by category
  const groupedLinks = navLinks.reduce((acc, link) => {
    if (permissions[link.perm]) {
      const group = link.group || 'main';
      if (!acc[group]) acc[group] = [];
      acc[group].push(link);
    }
    return acc;
  }, {} as Record<string, NavLink[]>);

  return (
    <nav className="flex flex-col h-full bg-white">
      {/* Live Status Indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] text-gray-400">{isLive ? '' : 'Offline'}</span>
      </div>

      {/* Organization Logo/Name */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">MatthOrg</h1>
        <p className="text-xs text-gray-500 mt-1">{user.role}</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        {Object.entries(groupedLinks).map(([group, links]) => (
          <div key={group} className="mb-6">
            <h4 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {groupNames[group as keyof typeof groupNames]}
            </h4>
            <ul className="space-y-1 px-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                
                // Determine badge value
                let badgeValue: number | null = null;
                if (link.name === 'Notifications' && unreadCount > 0) {
                  badgeValue = unreadCount;
                }
                if (link.name === 'Tasks' && pendingTasks > 0) {
                  badgeValue = pendingTasks;
                }

                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className={clsx(
                        'relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 group',
                        {
                          'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm': isActive,
                          'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !isActive,
                        },
                      )}
                      title={link.description}
                    >
                      <Icon className={clsx('w-5 h-5 flex-shrink-0', {
                        'text-blue-600': isActive,
                        'text-gray-500 group-hover:text-gray-700': !isActive,
                      })} />
                      <span className="flex-1 hidden md:block truncate">{link.name}</span>
                      
                      {/* Badge for counts */}
                      {badgeValue !== null && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={clsx(
                            'text-xs rounded-full w-5 h-5 flex items-center justify-center md:ml-auto',
                            link.name === 'Notifications' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-yellow-500 text-white'
                          )}
                        >
                          {badgeValue > 9 ? '9+' : badgeValue}
                        </motion.span>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Profile Section */}
      <div className="mt-auto pt-4 px-3 border-t">
        <UserProfile user={user} onSignOut={handleSignOut} />
      </div>

      {/* Version Info */}
      <div className="px-4 py-2 text-[10px] text-gray-400 text-center border-t">
        v1.0.0 • {user.organization_id?.slice(0, 8)}
      </div>
    </nav>
  );
}