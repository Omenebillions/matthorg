// /home/user/matthorg/src/components/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  UserGroupIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

// DEFAULT exports (no curly braces)
import WelcomeHeader from './WelcomeHeader';
import SalesChart from './SalesChart';
import ExpenseChart from './ExpenseChart';
import RecentActivity from './RecentActivity';
import InventoryAlerts from './InventoryAlerts';
import TaskList from './TaskList';
import StaffOnline from './StaffOnline';
import QuickActions from './QuickActions';

// NAMED exports (with curly braces)
import { StatsCards } from './StatsCards';
import { PerformanceMetrics } from './PerformanceMetrics';

// Industry components
import BreederDashboard from './industries/BreederDashboard';
import LiveClock from './LiveClock'; // New extracted component

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
  const [showBreeder, setShowBreeder] = useState(false);

  // Memoize notification function to prevent recreating
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
              {/* Clock now in its own component */}
              <LiveClock />
            </div>
            <div className="flex items-center gap-4">
              {/* Breeder toggle button */}
              <button
                onClick={() => setShowBreeder(!showBreeder)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition ${
                  showBreeder 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BeakerIcon className="w-4 h-4" />
                {showBreeder ? 'Hide Breeder' : 'Show Breeder'}
              </button>

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
    first_name: user.first_name,
    last_name: user.last_name 
  }} 
  org={org} 
/>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions orgId={org?.id} />
        </div>

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

        {/* Conditional Content */}
        {showBreeder ? (
          <div className="mt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700">Breeder Module Active</span>
              </div>
              <button
                onClick={() => setShowBreeder(false)}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Close
              </button>
            </div>
            <BreederDashboard data={{
              dogCount: 24,
              femalesInHeat: 3,
              upcomingLitters: 2,
              healthDue: 5,
              dogList: [],
              litterList: [],
              healthList: []
            }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {lowStock.length > 0 && (
                <InventoryAlerts organizationId={org?.id} lowStockThreshold={5} />
              )}
              <RecentActivity organizationId={org?.id} limit={10} />
              <TaskList tasks={recentTasks} orgId={org?.id} />
            </div>

            {/* Right Column */}
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
        )}
      </div>
    </div>
  );
}

// Wrap with memo to prevent unnecessary re-renders
export default memo(DashboardClient);