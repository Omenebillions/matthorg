"use client";

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// All links + their permission keys
const links = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, perm: "canViewDashboard" },
  { name: "Sales", href: "/dashboard/sales", icon: CurrencyDollarIcon, perm: "canViewSales" },
  { name: "Expenses", href: "/dashboard/expenses", icon: DocumentDuplicateIcon, perm: "canViewExpenses" },
  { name: "Inventory", href: "/dashboard/inventory", icon: ArchiveBoxIcon, perm: "canViewInventory" },
  { name: "Tasks", href: "/dashboard/tasks", icon: ClockIcon, perm: "canViewTasks" },
  { name: "Staff", href: "/dashboard/staff", icon: UserGroupIcon, perm: "canViewStaff" },
  { name: "Attendance", href: "/dashboard/attendance", icon: ClockIcon, perm: "canViewAttendance" },
  { name: "Jobs", href: "/dashboard/jobs", icon: DocumentDuplicateIcon, perm: "canViewJobs" },
  { name: "Notifications", href: "/dashboard/notifications", icon: BellIcon, perm: "canViewNotifications" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);

    // Get logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile with permissions
    const { data, error } = await supabase
      .from("profiles")
      .select("permissions")
      .eq("id", user.id)
      .single();

    if (!error && data?.permissions) {
      setPermissions(data.permissions); // expected array: ["canViewDashboard", "canViewSales"]
    }

    setLoading(false);
  };

  if (loading) {
    return <p className="text-gray-400 p-4">Loading menu…</p>;
  }

  return (
    <>
      {links
        .filter((link) => permissions.includes(link.perm)) // 🔥 Filter by permission
        .map((link) => {
          const LinkIcon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "flex h-[48px] items-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:px-3",
                { "bg-sky-100 text-blue-600": pathname === link.href }
              )}
            >
              <LinkIcon className="w-6" />
              <span className="hidden md:block">{link.name}</span>
            </Link>
          );
        })}
    </>
  );
}