// /home/user/matthorg/src/components/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import {
  BellIcon,
  UserGroupIcon,
  ArrowPathIcon,
  WifiIcon,
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

// Tab imports
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read?: boolean;
  link?: string;
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
  const { showToast } = useToast();
  
  const [isLive, setIsLive] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const showNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      title,
      message,
      type,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    setUnreadNotifications(prev => prev + 1);
    
    showToast(message, type);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, [showToast]);

  const markNotificationsAsRead = useCallback(() => {
    setUnreadNotifications(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!org?.id) return;

    const channels: any[] = [];
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const handleConnectionStatus = (status: string) => {
      const isConnected = status === 'SUBSCRIBED';
      setIsLive(isConnected);
      
      if (isConnected) {
        setConnectionQuality('good');
        reconnectAttempts = 0;
        setLastSync(new Date());
      } else if (reconnectAttempts < maxReconnectAttempts) {
        setConnectionQuality('poor');
        reconnectAttempts++;
      } else {
        setConnectionQuality('offline');
        showNotification('Connection Lost', 'Reconnecting...', 'warning');
      }
    };

    // Sales channel
    const salesChannel = supabase
      .channel('dashboard-sales')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          const amount = payload.new.amount;
          showNotification(
            'New Sale! 💰',
            `Sale of ₦${amount?.toLocaleString() || '0'} recorded`,
            'success'
          );
          setLastSync(new Date());
        }
      )
      .subscribe((status) => handleConnectionStatus(status));
    
    channels.push(salesChannel);

    // Inventory channel
    const inventoryChannel = supabase
      .channel('dashboard-inventory')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          if (newData?.quantity < 10 && (!oldData || oldData.quantity >= 10)) {
            showNotification(
              '⚠️ Low Stock Alert',
              `${newData?.item_name || 'Item'} is running low (${newData?.quantity} left)`,
              'warning'
            );
          }
          setLastSync(new Date());
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inventory', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          showNotification(
            'New Inventory Item',
            `${payload.new.item_name} added to inventory`,
            'info'
          );
          setLastSync(new Date());
        }
      )
      .subscribe();
    
    channels.push(inventoryChannel);

    // Expenses channel
    const expensesChannel = supabase
      .channel('dashboard-expenses')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          const amount = payload.new.amount;
          showNotification(
            'Expense Recorded 📤',
            `Expense of ₦${amount?.toLocaleString() || '0'} added`,
            'info'
          );
          setLastSync(new Date());
        }
      )
      .subscribe();
    
    channels.push(expensesChannel);

    // Tasks channel
    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          showNotification(
            'New Task Created',
            `"${payload.new.title}" has been added`,
            'info'
          );
          setLastSync(new Date());
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          if (payload.new.status !== payload.old.status) {
            showNotification(
              'Task Updated',
              `"${payload.new.title}" is now ${payload.new.status}`,
              'info'
            );
          }
          setLastSync(new Date());
        }
      )
      .subscribe();
    
    channels.push(tasksChannel);

    // Staff channel
    const staffChannel = supabase
      .channel('dashboard-staff')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'staff_profiles', filter: `organization_id=eq.${org.id}` },
        (payload) => {
          if (payload.new.last_seen !== payload.old.last_seen) {
            // Could update online status here
          }
          setLastSync(new Date());
        }
      )
      .subscribe();
    
    channels.push(staffChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [org?.id, showNotification]);

  // Define tabs based on industry - REORDERED: Overview -> Operations -> Staff -> Sales
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'operations', label: 'Operations', icon: getIndustryIcon(org?.industry) },
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'sales', label: 'Sales', icon: '💰' },
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

  // Get connection status color and icon
  const getConnectionStatus = () => {
    switch (connectionQuality) {
      case 'good':
        return { color: 'bg-green-500', icon: WifiIcon, text: 'Connected' };
      case 'poor':
        return { color: 'bg-yellow-500', icon: WifiIcon, text: 'Poor connection' };
      case 'offline':
        return { color: 'bg-red-500', icon: WifiIcon, text: 'Offline' };
    }
  };

  const ConnectionIcon = getConnectionStatus().icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Live Status Bar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatus().color} ${
                  connectionQuality === 'good' ? 'animate-pulse' : ''
                }`} />
                <ConnectionIcon className={`w-4 h-4 ${
                  connectionQuality === 'good' ? 'text-green-600' :
                  connectionQuality === 'poor' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getConnectionStatus().text}
                </span>
              </div>
              
              <span className="text-gray-300">|</span>
              
              {/* Live Clock */}
              <LiveClock />
              
              {/* Last Sync */}
              <span className="text-xs text-gray-400 hidden lg:inline">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Online Staff */}
              <span className="text-sm text-gray-600 hidden md:flex items-center">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                {activeStaff} online
              </span>
              
              {/* Manual Refresh */}
              <button 
                onClick={() => window.location.reload()}
                className="p-1 hover:bg-gray-100 rounded-full transition"
                title="Refresh"
              >
                <ArrowPathIcon className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Notifications Bell */}
              <div className="relative">
                <button 
                  className="relative p-1 hover:bg-gray-100 rounded-full transition"
                  onClick={markNotificationsAsRead}
                >
                  <BellIcon className="w-5 h-5 text-gray-600 hover:text-blue-600" />
                  <AnimatePresence>
                    {unreadNotifications > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1"
                      >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                
                {/* Notifications Dropdown */}
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
                    <div className="p-2 bg-gray-50 border-b text-xs font-medium text-gray-500 flex justify-between">
                      <span>Recent Notifications</span>
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-3 border-b hover:bg-gray-50">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notif.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2 w-80">
        <AnimatePresence>
          {notifications.slice(0, 3).map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-lg shadow-lg border-l-4 ${
                notif.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                notif.type === 'success' ? 'bg-green-50 border-green-500' :
                notif.type === 'error' ? 'bg-red-50 border-red-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
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

        {/* Tab Navigation - Updated order */}
        <div className="border-b mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
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
                    {/* FIXED: Add fallback empty string for orgId */}
                    <SalesChart orgId={org?.id || ''} />
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
                      organizationId={org?.id || ''} 
                      limit={5}
                      showFilters={false}
                    />
                    <PerformanceMetrics
                      organizationId={org?.id || ''}
                      timeframe="month"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <OperationsTab 
                orgId={org?.id}
                industry={org?.industry}
                taskCount={taskCount}
                pendingTasks={pendingTasks}
                inventoryCount={inventoryCount}
                lowStock={lowStock}
                totalSales={totalSales}
                totalExpenses={totalExpenses}
                netProfit={netProfit}
                recentTasks={recentTasks}
                recentExpenses={recentExpenses}
              />
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(DashboardClient);
