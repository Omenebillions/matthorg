// /home/user/matthorg/src/components/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// DEFAULT exports
import WelcomeHeader from './WelcomeHeader';
import SalesChart from './SalesChart';
import ExpenseChart from './ExpenseChart';
import RecentActivity from './RecentActivity';
import InventoryAlerts from './InventoryAlerts';
import TaskList from './TaskList';
import StaffOnline from './StaffOnline';
import QuickActions from './QuickActions';
import LiveClock from './LiveClock';

// NAMED exports
import { StatsCards } from './StatsCards';
import { PerformanceMetrics } from './PerformanceMetrics';

// NEW: Operations Tab (replaces BreederDashboard toggle)
import OperationsTab from './tabs/operations';
import StaffTab from './tabs/staff/StaffTab';
import SalesTab from './tabs/sales/SalesTab';

interface DashboardClientProps {
  user: any;
  org: any;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesTrend: { percentage: string; direction: string };
  expenseTrend: { percentage: string; direction: string };
  inventoryCount: number;
  staffCount: number;
  activeStaff: number;
  pendingTasks: number;
  taskCount: number;
  milestoneCount: number;
  jobCount: number;
  recentSales: any[];
  recentExpenses: any[];
  lowStock: any[];
  recentStaff: any[];
  recentTasks: any[];
  recentMilestones: any[];
  recentJobs: any[];
  attendanceToday: any[];
  recentActivity: any[];
  chartData: any[];
}

function DashboardClient({
  user,
  org,
  totalSales,
  totalExpenses,
  netProfit,
  salesTrend,
  expenseTrend,
  inventoryCount,
  staffCount,
  activeStaff,
  pendingTasks,
  taskCount,
  milestoneCount,
  jobCount,
  recentSales,
  recentExpenses,
  lowStock,
  recentStaff,
  recentTasks,
  recentMilestones,
  recentJobs,
  attendanceToday,
  recentActivity,
  chartData,
}: DashboardClientProps) {
  const supabase = createClient();
  const [isLive, setIsLive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview'); // Add tab state

  const showNotification = useCallback((title: string, message: string, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!org?.id) return;

    const channel = supabase
      .channel('dashboard-all')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `organization_id=eq.${org.id}` },
        () => showNotification('Sales Updated', 'New sale recorded')
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          const newData = payload.new as any;
          if (newData?.quantity < 10) {
            showNotification('Low Stock Alert', `${newData?.item_name || 'Item'} is running low`, 'warning');
          }
        }
      )
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [org?.id, showNotification]);

  // Define tabs based on industry
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'operations', label: 'Operations', icon: getIndustryIcon(org?.industry) }, // Dynamic icon
  ];

  // Helper function for industry icon
  function getIndustryIcon(industry: string) {
    const icons: Record<string, string> = {
      'dog breeding': '🐕',
      'restaurant': '🍽️',
      'real estate': '🏠',
      'retail': '🛍️',
      'construction': '🏗️',
      'healthcare': '🏥',
    };
    return icons[industry?.toLowerCase()] || '⚙️';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Live Status Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isLive ? 'Live' : 'Reconnecting...'}
                </span>
              </div>
              <span className="text-gray-300">|</span>
              <LiveClock />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                <UserGroupIcon className="w-4 h-4 inline mr-1" />
                {activeStaff} online
              </span>
              <button className="relative">
                <BellIcon className="w-5 h-5 text-gray-600 hover:text-blue-600" />
                <AnimatePresence>
                  {notifications.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    >
                      {notifications.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-lg shadow-lg ${
                notif.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-white border-l-4 border-blue-500'
              }`}
            >
              <p className="font-semibold">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <WelcomeHeader 
          user={{ 
            first_name: user?.first_name,
            last_name: user?.last_name 
          }} 
          org={org} 
        />

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions orgId={org?.id} />
        </div>

        {/* Tab Navigation */}
        <div className="border-b mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div>
                {/* Stats Cards */}
                <div className="mb-8">
                  <StatsCards organizationId={org?.id} />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <SalesChart orgId={org?.id} />
                  </div>
                  <div>
                    <ExpenseChart organizationId={org?.id} timeRange="week" />
                  </div>
                </div>

                {/* Activity & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {lowStock.length > 0 && (
                      <InventoryAlerts organizationId={org?.id} lowStockThreshold={5} />
                    )}
                    <RecentActivity organizationId={org?.id} limit={10} />
                  </div>
                  <div className="space-y-6">
                    <StaffOnline 
                      staff={recentStaff}
                      attendance={attendanceToday}
                      totalStaff={staffCount}
                      activeStaff={activeStaff}
                    />
                    <PerformanceMetrics
                      taskCompletion={taskCount > 0 ? ((taskCount - pendingTasks) / taskCount * 100) : 0}
                      salesTarget={totalSales}
                      inventoryValue={inventoryCount * 1000}
                      staffProductivity={85}
                    />
                  </div>
                </div>
              </div>
            )}

{activeTab === 'staff' && (
  <StaffTab 
    orgId={org?.id} 
    currentUserId={user?.id}
  />
            )}

{activeTab === 'sales' && (
  <SalesTab 
    orgId={org?.id}
    initialSales={recentSales}
    totalSales={totalSales}
  />
            )}

            {activeTab === 'operations' && (
              <OperationsTab 
                orgId={org?.id} 
                industry={org?.industry}
           
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(DashboardClient);