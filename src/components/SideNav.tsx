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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

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

interface NavLink {
  name: string;
  href: string;
  icon: any;
  perm: keyof StaffPermissions;
  badge?: number;
  group?: 'main' | 'management' | 'tools';
}

const navLinks: NavLink[] = [
  // Main Group
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, perm: 'canViewDashboard', group: 'main' },
  { name: 'Sales', href: '/dashboard/sales', icon: CurrencyDollarIcon, perm: 'canViewSales', group: 'main' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: DocumentDuplicateIcon, perm: 'canViewExpenses', group: 'main' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ArchiveBoxIcon, perm: 'canViewInventory', group: 'main' },
  
  // Management Group
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClockIcon, perm: 'canViewTasks', group: 'management' },
  { name: 'Staff', href: '/dashboard/staff', icon: UserGroupIcon, perm: 'canViewStaff', group: 'management' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarIcon, perm: 'canViewAttendance', group: 'management' },
  { name: 'Jobs', href: '/dashboard/jobs', icon: BriefcaseIcon, perm: 'canViewJobs', group: 'management' },
  
  // Tools Group
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, perm: 'canViewReports', group: 'tools' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, perm: 'canViewNotifications', group: 'tools' },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, perm: 'canViewSettings', group: 'tools' },
];

const groupNames = {
  main: 'Main',
  management: 'Management',
  tools: 'Tools',
};

export default function SideNav() {
  const supabase = createClient();
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Fetch staff profile with permissions
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (staffProfile && isMounted) {
        // Get permissions from either role-based or individual permissions
        const isAdmin = ['CEO', 'Admin', 'Manager'].includes(staffProfile.role);
        
        setPermissions({
          canViewDashboard: isAdmin || staffProfile.permissions?.includes('view:dashboard') || true,
          canViewSales: isAdmin || staffProfile.permissions?.includes('view:sales') || false,
          canViewExpenses: isAdmin || staffProfile.permissions?.includes('view:expenses') || false,
          canViewInventory: isAdmin || staffProfile.permissions?.includes('view:inventory') || false,
          canViewTasks: isAdmin || staffProfile.permissions?.includes('view:tasks') || false,
          canViewStaff: isAdmin || staffProfile.permissions?.includes('view:staff') || false,
          canViewAttendance: isAdmin || staffProfile.permissions?.includes('view:attendance') || false,
          canViewJobs: isAdmin || staffProfile.permissions?.includes('view:jobs') || false,
          canViewNotifications: true, // Everyone can see notifications
          canViewReports: isAdmin || staffProfile.permissions?.includes('view:reports') || false,
          canViewSettings: isAdmin || staffProfile.permissions?.includes('view:settings') || false,
        });
      }

      // Get unread notifications count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (isMounted) setUnreadCount(count || 0);
    }

    fetchPermissions();

    // Subscribe to real-time notifications for badge update
    const setupSubscription = async () => {
      subscription = supabase
        .channel('nav-notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            if (isMounted) {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    // Cleanup function
    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []); // Empty dependency array - runs once on mount

  if (!permissions) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-gray-200 animate-pulse rounded" />
        <div className="h-10 bg-gray-200 animate-pulse rounded" />
        <div className="h-10 bg-gray-200 animate-pulse rounded" />
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
    <nav className="flex flex-col h-full py-4">
      {Object.entries(groupedLinks).map(([group, links]) => (
        <div key={group} className="mb-6">
          <h4 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {groupNames[group as keyof typeof groupNames]}
          </h4>
          <ul className="space-y-1 px-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const showBadge = link.name === 'Notifications' && unreadCount > 0;

              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={clsx(
                      'relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200',
                      {
                        'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm': isActive,
                        'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !isActive,
                      },
                    )}
                  >
                    <Icon className={clsx('w-5 h-5', {
                      'text-blue-600': isActive,
                      'text-gray-500': !isActive,
                    })} />
                    <span className="flex-1 hidden md:block">{link.name}</span>
                    
                    {/* Badge for notifications */}
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center md:static md:translate-y-0"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* User info at bottom */}
      <div className="mt-auto pt-4 px-4 border-t">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-gray-500">View Profile</p>
          </div>
        </div>
      </div>
    </nav>
  );
}