// /home/user/matthorg/src/components/dashboard/RecentActivity.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import {
  ArrowPathIcon,
  FunnelIcon,
  CalendarIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ShoppingCartIcon,
  ReceiptRefundIcon,
  BanknotesIcon,
  UserIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface Sale {
  id: string;
  amount: number;
  customer_name?: string | null;
  payment_method?: string | null;
  payment_status?: 'paid' | 'pending' | 'refunded';
  status?: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  organization_id: string;
  created_by?: string;
  items?: any[];
}

interface Expense {
  id: string;
  amount: number;
  category?: string | null;
  description?: string | null;
  vendor?: string | null;
  payment_method?: string | null;
  status?: 'approved' | 'pending' | 'rejected';
  created_at: string;
  organization_id: string;
  created_by?: string;
}

interface RecentActivityProps {
  organizationId: string;
  limit?: number;
  showFilters?: boolean;
  onActivityClick?: (activity: any) => void;
}

type ActivityType = 'all' | 'sales' | 'expenses';
type TimeRange = 'today' | 'week' | 'month' | 'year';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

// Loading skeleton
function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded"></div>)}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ activity, onHover, isHovered, onClick }: any) {
  const isSale = activity.type === 'sale';
  
  const getIcon = () => {
    if (isSale) {
      if (activity.payment_method === 'card') return '💳';
      if (activity.payment_method === 'transfer') return '🏦';
      return '💰';
    }
    if (activity.category === 'rent') return '🏠';
    if (activity.category === 'utilities') return '💡';
    if (activity.category === 'salaries') return '👥';
    return '💸';
  };

  const getStatusBadge = () => {
    if (isSale && activity.payment_status) {
      const status = activity.payment_status;
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status === 'paid' ? 'bg-green-100 text-green-700' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
      );
    }
    if (!isSale && activity.status) {
      const status = activity.status;
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status === 'approved' ? 'bg-green-100 text-green-700' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`relative cursor-pointer transition-all duration-200 ${
        isHovered ? 'scale-[1.02] shadow-md' : ''
      }`}
      onMouseEnter={() => onHover?.(activity.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(activity)}
    >
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        isHovered ? 'bg-gray-50 border-gray-300' : 'border-transparent hover:border-gray-200'
      }`}>
        {/* Left side - Icon and Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
            isSale ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm truncate">
                {isSale 
                  ? (activity.customer_name || 'Anonymous Customer')
                  : (activity.description || activity.category || 'Expense')
                }
              </p>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {new Date(activity.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {activity.vendor && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-3 h-3" />
                    {activity.vendor}
                  </span>
                </>
              )}

              {isSale && activity.payment_method && (
                <>
                  <span>•</span>
                  <span className="capitalize">{activity.payment_method}</span>
                </>
              )}

              {!isSale && activity.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{activity.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Amount */}
        <div className="text-right ml-4 flex-shrink-0">
          <p className={`font-bold text-lg ${
            isSale ? 'text-green-600' : 'text-red-600'
          }`}>
            {isSale ? '+' : '-'}₦{Math.abs(activity.amount).toLocaleString()}
          </p>
          {activity.items && (
            <p className="text-xs text-gray-500">{activity.items.length} items</p>
          )}
        </div>
      </div>

      {/* Quick Actions Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-2 -top-8 bg-gray-800 text-white text-xs rounded px-2 py-1 flex items-center gap-2 z-10"
        >
          <Link 
            href={isSale ? `/dashboard/sales/${activity.id}` : `/dashboard/expenses/${activity.id}`}
            className="hover:underline flex items-center gap-1"
          >
            <EyeIcon className="w-3 h-3" />
            View Details
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function RecentActivity({ 
  organizationId, 
  limit = 10,
  showFilters = true,
  onActivityClick 
}: RecentActivityProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [filter, setFilter] = useState<ActivityType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [organizationId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!organizationId) return;

    const salesChannel = supabase
      .channel('recent-sales')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          handleRealtimeUpdate(payload, 'sale');
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('recent-expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          handleRealtimeUpdate(payload, 'expense');
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (salesError) throw salesError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (expensesError) throw expensesError;

      setSales(salesData || []);
      setExpenses(expensesData || []);
      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('Error fetching activities:', error);
      showToast(error.message || 'Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any, type: 'sale' | 'expense') => {
    if (payload.eventType === 'INSERT') {
      if (type === 'sale') {
        setSales(prev => [payload.new, ...prev].slice(0, 50));
        showToast('💰 New sale recorded!', 'success');
      } else {
        setExpenses(prev => [payload.new, ...prev].slice(0, 50));
        showToast('💸 New expense added', 'info');
      }
    } else if (payload.eventType === 'UPDATE') {
      if (type === 'sale') {
        setSales(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s));
      } else {
        setExpenses(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
      }
    }
    setLastUpdated(new Date());
  };

  // Filter by time range
  const filterByTime = useMemo(() => {
    return (items: any[]) => {
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
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }

      return items.filter(item => new Date(item.created_at) >= cutoff);
    };
  }, [timeRange]);

  // Filter by search
  const filterBySearch = useMemo(() => {
    return (items: any[], type: 'sale' | 'expense') => {
      if (!searchTerm) return items;
      
      const term = searchTerm.toLowerCase();
      return items.filter(item => {
        if (type === 'sale') {
          return item.customer_name?.toLowerCase().includes(term) ||
                 item.payment_method?.toLowerCase().includes(term);
        } else {
          return item.description?.toLowerCase().includes(term) ||
                 item.category?.toLowerCase().includes(term) ||
                 item.vendor?.toLowerCase().includes(term);
        }
      });
    };
  }, [searchTerm]);

  // Combine and sort activities
  const activities = useMemo(() => {
    let combined: any[] = [];

    if (filter === 'all' || filter === 'sales') {
      const filteredSales = filterBySearch(filterByTime(sales), 'sale');
      combined = [
        ...combined,
        ...filteredSales.map(s => ({
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
      const filteredExpenses = filterBySearch(filterByTime(expenses), 'expense');
      combined = [
        ...combined,
        ...filteredExpenses.map(e => ({
          ...e,
          type: 'expense' as const,
          icon: '💸',
          color: 'red',
          title: e.category ? `${e.category} Expense` : 'Expense',
          description: e.vendor || e.description || 'Business expense'
        }))
      ];
    }

    // Sort
    return combined.sort((a, b) => {
      switch(sortOrder) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }).slice(0, limit);
  }, [sales, expenses, filter, timeRange, searchTerm, sortOrder, limit, filterByTime, filterBySearch]);

  // Calculate totals
  const totals = useMemo(() => {
    const filteredSales = filterByTime(sales);
    const filteredExpenses = filterByTime(expenses);
    
    return {
      sales: filteredSales.reduce((sum, s) => sum + s.amount, 0),
      expenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      salesCount: filteredSales.length,
      expensesCount: filteredExpenses.length,
      net: filteredSales.reduce((sum, s) => sum + s.amount, 0) - 
           filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    };
  }, [sales, expenses, filterByTime]);

  if (loading) {
    return <ActivitySkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      {/* Header with Live Status */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {isLive ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="text-sm border rounded-lg px-2 py-1.5"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="text-sm border rounded-lg px-2 py-1.5"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest</option>
            <option value="lowest">Lowest</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Sales</p>
          <p className="text-lg font-bold text-green-600">₦{totals.sales.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{totals.salesCount} transactions</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-600">₦{totals.expenses.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{totals.expensesCount} transactions</p>
        </div>
        <div className={`${totals.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-3 col-span-2`}>
          <p className="text-xs text-gray-600 mb-1">Net {timeRange === 'today' ? 'Today' : `This ${timeRange}`}</p>
          <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {totals.net >= 0 ? '+' : '-'}₦{Math.abs(totals.net).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3 mb-4">
          {/* Type Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                filter === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({totals.salesCount + totals.expensesCount})
            </button>
            <button
              onClick={() => setFilter('sales')}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                filter === 'sales' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              Sales ({totals.salesCount})
            </button>
            <button
              onClick={() => setFilter('expenses')}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                filter === 'expenses' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              Expenses ({totals.expensesCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer, vendor, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg pl-8"
            />
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {/* Chart Toggle */}
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showChart ? <EyeSlashIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
            {showChart ? 'Hide' : 'Show'} mini chart
          </button>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-1 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityCard
                key={`${activity.type}-${activity.id}`}
                activity={activity}
                onHover={setHoveredItem}
                isHovered={hoveredItem === activity.id}
                onClick={onActivityClick}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 font-medium">No activity found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm 
                  ? 'Try adjusting your search' 
                  : filter === 'all' 
                    ? 'Add sales or expenses to see them here'
                    : filter === 'sales' 
                    ? 'No sales recorded yet'
                    : 'No expenses recorded yet'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini Chart */}
      {showChart && activities.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t"
        >
          <div className="h-16 flex items-end gap-1">
            {activities.slice(0, 15).map((activity, i) => {
              const maxAmount = Math.max(...activities.map(a => a.amount));
              const height = (activity.amount / maxAmount) * 40;
              return (
                <div
                  key={i}
                  className="group relative flex-1"
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      activity.type === 'sale' ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ 
                      height: `${Math.max(height, 4)}px`,
                      opacity: 0.7
                    }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                    {activity.type === 'sale' ? '💰' : '💸'} ₦{activity.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Last 15 transactions</p>
        </motion.div>
      )}

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Showing {activities.length} of {filter === 'all' ? sales.length + expenses.length : filter === 'sales' ? sales.length : expenses.length} total
          </span>
          <Link 
            href={filter === 'all' ? '/dashboard/activity' : `/dashboard/${filter}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All {filter !== 'all' ? filter : 'Activity'} →
          </Link>
        </div>
      )}
    </motion.div>
  );
}