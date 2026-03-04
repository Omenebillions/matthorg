// /home/user/matthorg/src/components/dashboard/ExpenseChart.tsx
"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import {
  ArrowPathIcon,
  FunnelIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string | null;
  vendor?: string | null;
  expense_date: string;
  payment_method?: string;
  notes?: string | null;
  created_at: string;
  organization_id: string;
}

interface ExpenseChartProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'year';
  onDataUpdate?: () => void;
}

// Category colors for consistent theming
const CATEGORY_COLORS: Record<string, string> = {
  'Salaries & Wages': 'from-purple-500 to-purple-600',
  'Rent & Utilities': 'from-blue-500 to-blue-600',
  'Marketing & Ads': 'from-green-500 to-green-600',
  'Office Supplies': 'from-yellow-500 to-yellow-600',
  'Equipment': 'from-orange-500 to-orange-600',
  'Travel': 'from-pink-500 to-pink-600',
  'Meals & Entertainment': 'from-red-500 to-red-600',
  'Professional Services': 'from-indigo-500 to-indigo-600',
  'Insurance': 'from-teal-500 to-teal-600',
  'Taxes': 'from-gray-500 to-gray-600',
  'Maintenance': 'from-cyan-500 to-cyan-600',
  'Software': 'from-violet-500 to-violet-600',
  'Other': 'from-stone-500 to-stone-600',
};

// Loading skeleton
function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
        <div className="h-48 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subtitle, color, icon }: any) {
  return (
    <div className={`bg-${color}-50 rounded-lg p-3 border border-${color}-200`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-600">{title}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold text-${color}-600">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ExpenseChart({ organizationId, timeRange = 'week', onDataUpdate }: ExpenseChartProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>(timeRange);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organizationId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showToast(error.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchExpenses();
  }, [organizationId]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('expense-chart')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setExpenses(prev => [payload.new, ...prev]);
        showToast('New expense added', 'success');
        if (onDataUpdate) onDataUpdate();
        break;
      case 'UPDATE':
        setExpenses(prev => 
          prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e)
        );
        showToast('Expense updated', 'info');
        if (onDataUpdate) onDataUpdate();
        break;
      case 'DELETE':
        setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
        showToast('Expense deleted', 'info');
        if (onDataUpdate) onDataUpdate();
        break;
    }
    setLastUpdated(new Date());
  };

  // Filter expenses based on time range and search
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch(dateRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let filtered = expenses.filter(exp => {
      const expenseDate = new Date(exp.expense_date || exp.created_at);
      return expenseDate >= cutoffDate;
    });

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description?.toLowerCase().includes(term) ||
        exp.vendor?.toLowerCase().includes(term) ||
        exp.category?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [expenses, dateRange, selectedCategory, searchTerm]);

  // Group expenses by date for chart
  const chartData = useMemo(() => {
    const grouped: { [key: string]: { total: number; count: number; items: Expense[] } } = {};
    
    filteredExpenses.forEach(exp => {
      const date = new Date(exp.expense_date || exp.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateRange === 'year' ? 'numeric' : undefined
      });
      
      if (!grouped[date]) {
        grouped[date] = { total: 0, count: 0, items: [] };
      }
      grouped[date].total += exp.amount;
      grouped[date].count += 1;
      grouped[date].items.push(exp);
    });

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredExpenses, dateRange]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return ['all', ...new Set(expenses.map(e => e.category).filter(Boolean))];
  }, [expenses]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = chartData.length ? total / chartData.length : 0;
    const max = Math.max(...chartData.map(d => d.total), 0);
    const min = Math.min(...chartData.map(d => d.total), 0);
    const categoryBreakdown = filteredExpenses.reduce((acc, exp) => {
      const cat = exp.category || 'other';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      average: avg,
      max,
      min,
      count: filteredExpenses.length,
      categoryBreakdown,
    };
  }, [filteredExpenses, chartData]);

  const maxAmount = stats.max || 1;

  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      {/* Header with Live Status */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h3 className="text-lg font-bold">Expense Analytics</h3>
        
        <div className="flex items-center gap-3">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {isLive ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchExpenses}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition ${
              showFilters ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Toggle filters"
          >
            <FunnelIcon className="w-4 h-4" />
          </button>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-sm rounded-md transition flex items-center gap-1 ${
                viewMode === 'chart' ? 'bg-white shadow' : 'text-gray-600'
              }`}
              title="Chart view"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'
              }`}
              title="List view"
            >
              <TableCellsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-4 space-y-3 overflow-hidden"
        >
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-xs rounded-full capitalize ${
                    dateRange === range
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-400"
          />

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full capitalize ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatCard
          title="Total Expenses"
          value={`₦${stats.total.toLocaleString()}`}
          subtitle={`${stats.count} transactions`}
          color="orange"
          icon="💰"
        />
        <StatCard
          title="Daily Average"
          value={`₦${Math.round(stats.average).toLocaleString()}`}
          subtitle={`Last ${dateRange}`}
          color="blue"
          icon="📊"
        />
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <>
          <div className="h-48 flex items-end gap-1 sm:gap-2 mb-4">
            {chartData.map((data, index) => {
              const height = (data.total / maxAmount) * 100;
              const percentage = ((data.total / stats.total) * 100).toFixed(1);
              
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition z-10 pointer-events-none">
                    <p className="font-semibold">{data.date}</p>
                    <p>₦{data.total.toLocaleString()}</p>
                    <p>{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
                    <p className="text-gray-300">{percentage}% of total</p>
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t cursor-pointer hover:from-orange-600 hover:to-orange-500 transition-all"
                    style={{ height: '100%' }}
                  />
                  
                  {/* Date Label */}
                  <p className="text-xs mt-2 text-gray-600 font-medium hidden sm:block">
                    {data.date}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-1" />
              Daily expenses
            </span>
            <span>•</span>
            <span>Hover for details</span>
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {filteredExpenses.map((expense) => {
            const category = expense.category || 'other';
            const colorClass = CATEGORY_COLORS[category] || 'from-gray-500 to-gray-600';
            
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {expense.description || 'Unnamed Expense'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${colorClass} text-white`}>
                      {category}
                    </span>
                    {expense.payment_method && (
                      <span className="text-xs text-gray-400">
                        {expense.payment_method}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(expense.expense_date || expense.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    {expense.vendor && ` • ${expense.vendor}`}
                  </p>
                </div>
                <p className="font-bold text-orange-600 ml-2">
                  ₦{expense.amount.toLocaleString()}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Category Breakdown</p>
            <p className="text-xs text-gray-500">Total: ₦{stats.total.toLocaleString()}</p>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {Object.entries(stats.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / stats.total) * 100;
                const colorClass = CATEGORY_COLORS[category]?.split(' ')[0].replace('from-', '') || 'gray';
                
                return (
                  <div key={category} className="relative group">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="font-medium">
                        ₦{amount.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-2 rounded-full bg-${colorClass}-500`}
                        style={{ backgroundColor: `var(--color-${colorClass})` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {chartData.length === 0 && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No expenses found</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : `Add expenses to see trends for this ${dateRange}`}
          </p>
        </div>
      )}

      {/* Footer with Summary */}
      {filteredExpenses.length > 0 && (
        <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between items-center">
          <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
          <button
            onClick={fetchExpenses}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ArrowPathIcon className="w-3 h-3" />
            Refresh
          </button>
        </div>
      )}
    </motion.div>
  );
}