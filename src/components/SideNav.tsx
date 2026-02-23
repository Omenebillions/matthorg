'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

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
}

const allLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, perm: 'canViewDashboard' },
  { name: 'Sales', href: '/dashboard/sales', icon: CurrencyDollarIcon, perm: 'canViewSales' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: DocumentDuplicateIcon, perm: 'canViewExpenses' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ArchiveBoxIcon, perm: 'canViewInventory' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClockIcon, perm: 'canViewTasks' },
  { name: 'Staff', href: '/dashboard/staff', icon: UserGroupIcon, perm: 'canViewStaff' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: ClockIcon, perm: 'canViewAttendance' },
  { name: 'Jobs', href: '/dashboard/jobs', icon: DocumentDuplicateIcon, perm: 'canViewJobs' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, perm: 'canViewNotifications' },
];

export default function SideNav() {
  const supabase = createClient();
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      // Fetch staff profile
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (staffProfile) {
        setPermissions({
          canViewDashboard: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewDashboard,
          canViewSales: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewSales,
          canViewExpenses: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewExpenses,
          canViewInventory: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewInventory,
          canViewTasks: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewTasks,
          canViewStaff: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewStaff,
          canViewAttendance: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewAttendance,
          canViewJobs: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewJobs,
          canViewNotifications: staffProfile.role === 'CEO' || staffProfile.role === 'Admin' || staffProfile.canViewNotifications,
        });
      }
    }

    fetchPermissions();
  }, []);

  if (!permissions) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <ul className="space-y-1 px-2">
      {allLinks
        .filter((link) => permissions[link.perm as keyof StaffPermissions])
        .map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <li key={link.name}>
              <Link
                href={link.href}
                className={clsx(
                  'flex items-center gap-2 rounded-md p-3 text-sm font-medium transition-colors hover:bg-sky-100 hover:text-blue-600',
                  {
                    'bg-sky-100 text-blue-600': isActive,
                    'text-gray-700': !isActive,
                  },
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="hidden md:block">{link.name}</span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}