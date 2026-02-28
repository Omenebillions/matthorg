// /home/user/matthorg/src/components/dashboard/RecentActivity.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import Link from 'next/link';

interface Sale {
  id: string;
  amount: number;
  customer_name?: string;
  payment_method?: string;
  created_at: string;
  organization_id: string;
}

interface Expense {
  id: string;
  amount: number;
  category?: string;
  description?: string;
  vendor?: string;
  created_at: string;
  organization_id: string;
}

interface RecentActivityProps {
  organizationId: string;
  limit?: number;
}

type ActivityType = 'all' | 'sales' | 'expenses';
type TimeRange = 'today' | 'week' | 'month';

export default function RecentActivity({ 
  organizationId, 
  limit = 10 
}: RecentActivityProps) {
  const [filter, setFilter] = useState<ActivityType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Live sales data
  const { data: sales = [], isLive: salesLive } = useRealtime<Sale>(
    { table: 'sales', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Live expenses data
  const { data: expenses = [], isLive: expensesLive } = useRealtime<Expense>(
    { table: 'expenses', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Filter by time range
  const filterByTime = (items: any[]) => {
    const now = new Date();
    const cutoff = new Date();
    
    switch(timeRange) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    return items.filter(item => new Date(item.created_at) >= cutoff);
  };

  // Combine and sort activities
  const getActivities = () => {
    let activities: any[] = [];

    if (filter === 'all' || filter === 'sales') {
      activities = [
        ...activities,
        ...filterByTime(sales).map(s => ({
          ...s,
          type: 'sale' as const,
          icon: '💰',
          color: 'green',
          title: s.customer_name ? `Sale to ${s.customer_name}` : 'New Sale',
          description: `Payment: ${s.payment_method || 'cash'}`
        }))
      ];
    }

    if (filter === 'all' || filter === 'expenses') {
      activities = [
        ...activities,
        ...filterByTime(expenses).map(e => ({
          ...e,
          type: 'expense' as const,
          icon: '💸',
          color: 'red',
          title: e.category ? `${e.category} Expense` : 'Expense',
          description: e.vendor || e.description || 'Business expense'
        }))
      ];
    }

    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  const activities = getActivities();
  const isLive = salesLive && expensesLive;

  // Calculate totals
  const totals = {
    sales: filterByTime(sales).reduce((sum, s) => sum + s.amount, 0),
    expenses: filterByTime(expenses).reduce((sum, e) => sum + e.amount, 0),
    net: filterByTime(sales).reduce((sum, s) => sum + s.amount, 0) - 
         filterByTime(expenses).reduce((sum, e) => sum + e.amount, 0)
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{isLive ? 'Live' : ''}</span>
          </div>
        </div>
        
        {/* Time Range Filter */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-sm border rounded-lg px-2 py-1"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Sales</p>
          <p className="text-sm font-bold text-green-600">₦{totals.sales.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Expenses</p>
          <p className="text-sm font-bold text-red-600">₦{totals.expenses.toLocaleString()}</p>
        </div>
        <div className={`${totals.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-2 text-center`}>
          <p className="text-xs text-gray-600">Net</p>
          <p className={`text-sm font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ₦{totals.net.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            filter === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('sales')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            filter === 'sales' 
              ? 'bg-green-600 text-white' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          Sales
        </button>
        <button
          onClick={() => setFilter('expenses')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            filter === 'expenses' 
              ? 'bg-red-600 text-white' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
              onHoverStart={() => setHoveredItem(activity.id)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <div className={`flex items-center justify-between p-3 rounded-lg transition ${
                hoveredItem === activity.id ? 'bg-gray-50' : ''
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.type === 'sale' && activity.payment_method && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {activity.payment_method}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{new Date(activity.created_at).toLocaleString()}</span>
                      {activity.description && (
                        <>
                          <span>•</span>
                          <span>{activity.description}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    activity.type === 'sale' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₦{activity.amount.toLocaleString()}
                  </p>
                  {activity.type === 'expense' && activity.category && (
                    <p className="text-xs text-gray-500 capitalize">{activity.category}</p>
                  )}
                </div>
              </div>

              {/* Quick action tooltip on hover */}
              {hoveredItem === activity.id && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 -top-8 bg-gray-800 text-white text-xs rounded px-2 py-1"
                >
                  <Link 
                    href={activity.type === 'sale' ? `/dashboard/sales/${activity.id}` : `/dashboard/expenses/${activity.id}`}
                    className="hover:underline"
                  >
                    View Details →
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {activities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-gray-400 text-5xl mb-3">📭</p>
            <p className="text-gray-600 font-medium">No activity found</p>
            <p className="text-sm text-gray-500 mt-1">
              {filter === 'all' 
                ? 'Add sales or expenses to see them here'
                : filter === 'sales' 
                ? 'No sales recorded yet'
                : 'No expenses recorded yet'}
            </p>
          </motion.div>
        )}
      </div>

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="mt-4 pt-3 border-t text-center">
          <Link 
            href={filter === 'all' ? '/dashboard/activity' : `/dashboard/${filter}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View All {filter !== 'all' ? filter : 'Activity'} →
          </Link>
        </div>
      )}

      {/* Mini Chart (optional) */}
      {activities.length > 0 && (
        <div className="mt-4 h-16 flex items-end gap-1">
          {activities.slice(0, 8).map((activity, i) => {
            const height = (activity.amount / Math.max(totals.sales, totals.expenses)) * 40;
            return (
              <div
                key={i}
                className={`flex-1 h-10 rounded-t ${
                  activity.type === 'sale' ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ 
                  height: `${Math.max(height, 4)}px`,
                  opacity: 0.6
                }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}