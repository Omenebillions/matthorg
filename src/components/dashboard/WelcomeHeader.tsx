// /home/user/matthorg/src/components/dashboard/WelcomeHeader.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  SunIcon,
  SparklesIcon,
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  CubeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

interface WelcomeHeaderProps {
  user: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
  };
  org: {
    id?: string;
    name: string;
    logo_url?: string;
    industry?: string;
    plan?: string;
    subscription_status?: string;
  };
  stats?: {
    todaySales: number;
    lowStock: number;
    pendingTasks: number;
    staffOnline: number;
    totalStaff: number;
    unreadNotifications?: number;
    monthlyRevenue?: number;
    weeklyGrowth?: number;
  };
  onRefresh?: () => void;
  showStats?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

// Loading skeleton
function WelcomeHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 mb-8">
      <div className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
            <div>
              <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-48"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-32 h-10 bg-white/20 rounded-full"></div>
            <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
            <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
            <div className="w-10 h-10 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Greeting component with time-based messages
function GreetingMessage({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState('☀️');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setIcon('🌅');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      setIcon('☀️');
    } else {
      setGreeting('Good evening');
      setIcon('🌙');
    }
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <h1 className="text-3xl font-bold">
        {greeting}, {name}!
      </h1>
      <span className="text-2xl animate-bounce">{icon}</span>
    </div>
  );
}

// Live clock component
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center text-blue-100">
      <ClockIcon className="w-4 h-4 mr-1" />
      {format(time, 'h:mm:ss a')}
    </div>
  );
}

// Date display
function DateDisplay() {
  const [date] = useState(new Date());
  return (
    <div className="flex items-center text-blue-100">
      <CalendarIcon className="w-4 h-4 mr-1" />
      {format(date, 'EEEE, MMMM d, yyyy')}
    </div>
  );
}

// Motivational quote component
function MotivationalQuote() {
  const quotes = [
    { text: "Ready to crush your goals today? 🚀", author: "MatthOrg" },
    { text: "Making progress, one task at a time! 💪", author: "Your Dashboard" },
    { text: "Your command center is ready 🎯", author: "System" },
    { text: "Let's make today productive! ⚡", author: "Team" },
    { text: "Business is looking good! 📈", author: "Analytics" },
    { text: "Small steps every day lead to big results 🌱", author: "Motivation" },
    { text: "Your future is created by what you do today ✨", author: "Inspiration" },
  ];
  
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <p className="text-blue-200 text-sm flex items-center">
      <SparklesIcon className="w-4 h-4 mr-1 text-yellow-300" />
      "{quote.text}" — <span className="text-blue-300 ml-1">{quote.author}</span>
    </p>
  );
}

// Notifications dropdown
function NotificationsDropdown({ 
  isOpen, 
  onClose,
  userId,
  orgId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  userId?: string;
  orgId?: string;
}) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border overflow-hidden z-50"
    >
      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : notifications.length > 0 ? (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${
                !notif.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-50 border-t text-center">
        <Link 
          href="/dashboard/notifications"
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={onClose}
        >
          View all notifications →
        </Link>
      </div>
    </motion.div>
  );
}

// Profile menu dropdown
function ProfileMenu({ 
  isOpen, 
  onClose, 
  user,
  onSignOut 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  user: WelcomeHeaderProps['user'];
  onSignOut: () => void;
}) {
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.first_name?.[0]?.toUpperCase() || 'U';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border overflow-hidden z-50"
    >
      {/* User info */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <p className="font-medium text-gray-900">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-gray-600 mt-1">{user.email}</p>
        {user.role && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            {user.role}
          </span>
        )}
      </div>

      {/* Menu items */}
      <div className="py-1">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={onClose}
        >
          <UserCircleIcon className="w-4 h-4" />
          Your Profile
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={onClose}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Settings
        </Link>
        <hr className="my-1" />
        <button
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
}

export default function WelcomeHeader({ 
  user, 
  org, 
  stats: initialStats,
  onRefresh,
  showStats = true 
}: WelcomeHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [unreadCount, setUnreadCount] = useState(0);
  const [greeting, setGreeting] = useState('');

  // Get display name
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.last_name || 'there';

  // Load real stats if not provided
  useEffect(() => {
    if (!initialStats && org.id) {
      loadStats();
    }
  }, [initialStats, org.id]);

  // Load unread notifications count
  useEffect(() => {
    if (!user.id) return;

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    };

    loadUnreadCount();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          setUnreadCount(prev => prev + 1);
          showToast('🔔 New notification', 'info');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadStats = async () => {
    try {
      // This would fetch real stats from your database
      // For now, using provided stats or defaults
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showToast('Signed out successfully', 'success');
      router.push('/login');
    } catch (error: any) {
      showToast(error.message || 'Error signing out', 'error');
    }
  };

  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.first_name?.[0]?.toUpperCase() || 'U';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Top row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left section - Greeting and org info */}
          <div className="flex items-center space-x-4">
            {/* Organization Logo/Icon */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
            >
              {org.logo_url ? (
                <img 
                  src={org.logo_url} 
                  alt={org.name} 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              )}
            </motion.div>

            <div>
              <GreetingMessage name={displayName} />
              
              <div className="flex items-center space-x-4 mt-2 flex-wrap gap-y-2">
                <p className="text-blue-100 flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                  {org.name} {org.industry && `· ${org.industry}`}
                </p>
                
                <div className="h-4 w-px bg-blue-400 hidden sm:block" />
                
                <DateDisplay />
                
                <div className="h-4 w-px bg-blue-400 hidden sm:block" />
                
                <LiveClock />

                {org.plan && (
                  <>
                    <div className="h-4 w-px bg-blue-400 hidden sm:block" />
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      org.subscription_status === 'active' 
                        ? 'bg-green-500/20 text-green-200' 
                        : 'bg-yellow-500/20 text-yellow-200'
                    }`}>
                      {org.plan} Plan
                    </span>
                  </>
                )}
              </div>

              <MotivationalQuote />
            </div>
          </div>

          {/* Right section - Actions & Profile */}
          <div className="flex items-center space-x-2">
            {/* Quick Stats Pill */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 flex items-center space-x-3 border border-white/20"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <ChartBarIcon className="w-4 h-4" />
              <span className="text-sm">Real-time</span>
            </motion.div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 border-2 border-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <NotificationsDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    userId={user.id}
                    orgId={org.id}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Settings */}
            <Link 
              href="/dashboard/settings" 
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Link>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 hover:bg-white/10 rounded-lg transition group"
              >
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={displayName}
                    className="w-8 h-8 rounded-full border-2 border-white/50 group-hover:border-white transition"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm border-2 border-white/50">
                    {getInitials()}
                  </div>
                )}
                <ChevronDownIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <ProfileMenu
                    isOpen={showProfileMenu}
                    onClose={() => setShowProfileMenu(false)}
                    user={user}
                    onSignOut={handleSignOut}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/20"
          >
            <div className="flex items-center space-x-2 group hover:bg-white/5 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <CurrencyDollarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Today's Sales</p>
                <p className="text-sm font-semibold">₦{stats.todaySales?.toLocaleString() || '0'}</p>
                {stats.weeklyGrowth && (
                  <p className={`text-xs ${stats.weeklyGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {stats.weeklyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.weeklyGrowth)}%
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 group hover:bg-white/5 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <CubeIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Low Stock</p>
                <p className="text-sm font-semibold">{stats.lowStock || 0} items</p>
                <p className="text-xs text-blue-300">Need attention</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 group hover:bg-white/5 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Pending Tasks</p>
                <p className="text-sm font-semibold">{stats.pendingTasks || 0}</p>
                <p className="text-xs text-blue-300">Ready to work</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 group hover:bg-white/5 p-2 rounded-lg transition">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <UserGroupIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Staff Online</p>
                <p className="text-sm font-semibold">{stats.staffOnline || 0}/{stats.totalStaff || 0}</p>
                <p className="text-xs text-blue-300">Currently active</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}