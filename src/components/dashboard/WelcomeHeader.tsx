// /home/user/matthorg/src/components/dashboard/WelcomeHeader.tsx
'use client';

import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  SunIcon,
  SparklesIcon,
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface WelcomeHeaderProps {
  user: {
    first_name?: string;
    last_name?: string;
    role?: string;
    avatar_url?: string;
  };
  org: {
    name: string;
    logo_url?: string;
    industry?: string;
  };
  stats?: {
    todaySales: number;
    lowStock: number;
    pendingTasks: number;
    staffOnline: number;
    totalStaff: number;
  };
}

export default function WelcomeHeader({ user, org, stats }: WelcomeHeaderProps) {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Get display name (combine first and last name)
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.last_name || 'there';

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get random motivational quote
  const quotes = [
    "Ready to crush your goals today? 🚀",
    "Making progress, one task at a time! 💪",
    "Your dashboard, your command center 🎯",
    "Let's make today productive! ⚡",
    "Business is looking good! 📈",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 mb-8 text-white"
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Greeting */}
        <div className="flex items-center space-x-4">
          {/* Organization Logo/Icon */}
          <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-lg flex items-center justify-center">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-10 h-10 object-contain" />
            ) : (
              <BuildingOfficeIcon className="w-8 h-8 text-white" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold">
                {greeting}, {displayName}!
              </h1>
              <SparklesIcon className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-blue-100">
                {org.name} {org.industry && `· ${org.industry}`}
              </p>
              
              <div className="h-4 w-px bg-blue-400" />
              
              <p className="text-blue-100 flex items-center">
                <SunIcon className="w-4 h-4 mr-1" />
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>

            {/* Motivational Message */}
            <p className="text-blue-200 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              {randomQuote}
            </p>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Stats Pill */}
          <div className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              <span className="text-sm">Online</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Live</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Settings */}
          <Link href="/settings" className="p-2 hover:bg-white/10 rounded-lg transition">
            <Cog6ToothIcon className="w-5 h-5" />
          </Link>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition"
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={displayName}
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 text-gray-700 z-50"
              >
                <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                  Your Profile
                </Link>
                <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                  Settings
                </Link>
                <hr className="my-1" />
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <div>
            <p className="text-xs text-blue-200">Today's Sales</p>
            <p className="text-sm font-semibold">₦{stats?.todaySales?.toLocaleString() || '0'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm">📦</span>
          </div>
          <div>
            <p className="text-xs text-blue-200">Low Stock</p>
            <p className="text-sm font-semibold">{stats?.lowStock || 0} items</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm">✅</span>
          </div>
          <div>
            <p className="text-xs text-blue-200">Pending Tasks</p>
            <p className="text-sm font-semibold">{stats?.pendingTasks || 0}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-sm">👥</span>
          </div>
          <div>
            <p className="text-xs text-blue-200">Staff Online</p>
            <p className="text-sm font-semibold">{stats?.staffOnline || 0}/{stats?.totalStaff || 0}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}