// /home/user/matthorg/src/components/dashboard/ExpenseChart.tsx
"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  vendor?: string;
  expense_date: string;
  created_at: string;
  organization_id: string;
}

interface ExpenseChartProps {
  organizationId: string;
  timeRange?: 'week' | 'month' | 'year';
}

export default function ExpenseChart({ organizationId, timeRange = 'week' }: ExpenseChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Live expenses data
  const { data: expenses = [], isLive } = useRealtime<Expense>(
    { table: 'expenses', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Filter expenses based on time range
  const getFilteredExpenses = () => {
    const now = new Date();
    const filtered = expenses.filter(exp => {
      const expenseDate = new Date(exp.expense_date || exp.created_at);
      const diffTime = now.getTime() - expenseDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      switch(timeRange) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    });

    // Filter by category if selected
    if (selectedCategory !== 'all') {
      return filtered.filter(exp => exp.category === selectedCategory);
    }
    return filtered;
  };

  // Group expenses by date for chart
  const getChartData = () => {
    const filtered = getFilteredExpenses();
    const grouped: { [key: string]: { total: number; count: number; items: Expense[] } } = {};
    
    filtered.forEach(exp => {
      const date = new Date(exp.expense_date || exp.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: timeRange === 'year' ? 'numeric' : undefined
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
      })
      .slice(-7); // Last 7 periods
  };

  // Get unique categories for filter
  const categories = ['all', ...new Set(expenses.map(e => e.category).filter(Boolean))];

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map(d => d.total), 1);

  // Calculate totals
  const totalExpenses = getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = chartData.length ? totalExpenses / chartData.length : 0;

  // Category breakdown
  const categoryBreakdown = getFilteredExpenses().reduce((acc, exp) => {
    const cat = exp.category || 'other';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      {/* Header with Live Status */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Expense Trend</h3>
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Connecting...'}</span>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                viewMode === 'chart' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Total Expenses</p>
          <p className="text-xl font-bold text-orange-600">₦{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{getFilteredExpenses().length} transactions</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Daily Average</p>
          <p className="text-xl font-bold text-blue-600">₦{Math.round(avgExpense).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Last {timeRange}</p>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Chart View */}
      {viewMode === 'chart' && (
        <>
          <div className="h-48 flex items-end gap-2 mb-4">
            {chartData.map((data, index) => {
              const height = (data.total / maxAmount) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition z-10">
                    ₦{data.total.toLocaleString()} ({data.count} items)
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t cursor-pointer"
                    style={{ height: '100%' }}
                  />
                  
                  {/* Date Label */}
                  <p className="text-xs mt-2 text-gray-600 font-medium">
                    {data.date}
                  </p>
                  
                  {/* Amount */}
                  <p className="text-xs font-bold text-gray-700">
                    ₦{data.total.toLocaleString()}
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
            <span>Hover bars for details</span>
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {getFilteredExpenses().map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{expense.description || 'Expense'}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                    {expense.category}
                  </span>
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
              <p className="font-bold text-orange-600">₦{expense.amount.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Category Breakdown (shown in both views) */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-semibold mb-2">By Category</p>
          <div className="space-y-2">
            {Object.entries(categoryBreakdown).map(([category, amount]) => {
              const percentage = (amount / totalExpenses) * 100;
              return (
                <div key={category} className="relative">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">₦{amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="bg-orange-500 h-1.5 rounded-full"
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
          <p className="text-gray-400 text-6xl mb-4">📊</p>
          <p className="text-gray-500">No expense data for this period</p>
          <p className="text-sm text-gray-400 mt-2">Add expenses to see trends</p>
        </div>
      )}
    </motion.div>
  );
}