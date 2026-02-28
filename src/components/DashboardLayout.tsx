// /src/components/dashboard/DashboardLayout.tsx
"use client";

import React from "react";
import NavLinks from "./NavLinks";
import { usePathname } from "next/navigation";
import { 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  subdomain?: string;
  industry?: string;
  address?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const supabase = createClient();

  // Fetch user and organization data
  useEffect(() => {
    const fetchUserAndOrg = async () => {
      try {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Get user profile
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("id, full_name, email, role, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (profile) setUser(profile);

        // Get organization
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, logo_url, subdomain, industry, address")
          .eq("user_id", authUser.id)
          .single();

        if (!orgError && orgData) setOrg(orgData);

        // Get unread notifications count
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", authUser.id)
          .eq("read", false);

        setUnreadCount(count || 0);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrg();

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-lg z-50 flex items-center justify-between px-4 py-3 border-b"
      >
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </button>
        
        <h1 className="font-semibold text-lg text-gray-800">
          {org?.name || 'Dashboard'}
        </h1>
        
        <div className="w-10" /> {/* Spacer for alignment */}
      </motion.div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white shadow-xl border-r transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Organization Header */}
          <div className="flex items-center justify-between px-5 h-24 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              {loading ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
                </>
              ) : org?.logo_url ? (
                <img
                  src={org.logo_url}
                  className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                  alt="Org Logo"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                  {org?.name?.charAt(0) || 'O'}
                </div>
              )}
              <div>
                <h2 className="font-bold text-gray-800">{org?.name || 'Loading...'}</h2>
                {org?.industry && (
                  <p className="text-xs text-gray-500">{org.industry}</p>
                )}
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-gray-200 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <NavLinks />
          </nav>

          {/* User Profile Section */}
          <div className="border-t p-4 bg-gray-50">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    className="h-10 w-10 rounded-full object-cover border"
                    alt="User"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                    {user?.full_name ? getInitials(user.full_name) : 'U'}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.full_name || 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'Staff'}
                  </p>
                </div>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border py-1"
                  >
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/help"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <QuestionMarkCircleIcon className="h-4 w-4" />
                      Help
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Bar for Desktop */}
      <div className="hidden md:block fixed top-0 right-0 left-72 bg-white shadow-sm z-30 h-16">
        <div className="flex items-center justify-end h-full px-6 gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <BellIcon className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border py-2"
                >
                  <div className="px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif, i) => (
                        <div key={i} className="px-4 py-2 hover:bg-gray-50 border-b last:border-0">
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No notifications
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user?.full_name || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || ''}
              </p>
            </div>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                className="h-10 w-10 rounded-full object-cover border"
                alt="User"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-72 p-6 mt-20 md:mt-20">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}