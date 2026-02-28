'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { PlusIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import QuickActions from '@/components/dashboard/QuickActions';
import { useRealtime } from '@/hooks/useRealtime';

// Enhanced with real data structure
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor?: string;
}

export default function ExpensesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [dateRange, setDateRange] = useState('month');
  const orgId = 'b98e059f-1af6-4d47-9bf4-f1ab4d6fd1e8'; // Get from context

  // Real-time data
  const { data: expenses = [], isLive } = useRealtime<Expense>(
    { table: 'expenses', filter: `organization_id=eq.${orgId}` },
    []
  );

  // Filter expenses by date range
  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      switch(dateRange) {
        case 'week':
          return expDate >= new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return expDate.getMonth() === now.getMonth();
        case 'quarter':
          return expDate >= new Date(now.setMonth(now.getMonth() - 3));
        default:
          return true;
      }
    });
  };

  const filteredExpenses = getFilteredExpenses();
  
  // Group by category for chart
  const categoryData = Object.values(
    filteredExpenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { name: exp.category, amount: 0 };
      }
      acc[exp.category].amount += exp.amount;
      return acc;
    }, {} as Record<string, { name: string; amount: number }>)
  );

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const lastMonthTotal = expenses
    .filter(exp => new Date(exp.expense_date).getMonth() === new Date().getMonth() - 1)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const percentageChange = lastMonthTotal 
    ? ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  // FIXED: Tooltip formatter with proper type handling for undefined
  const formatTooltip = (value: any) => {
    if (typeof value === 'number') {
      return [`₦${value.toLocaleString()}`, 'Amount'];
    }
    return ['₦0', 'Amount'];
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-gray-50 pb-20 md:pb-6"
    >
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-1`} />
              <span className="text-xs text-gray-500">{isLive ? 'Live' : ''}</span>
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FunnelIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-gray-50 px-4 py-3 overflow-hidden"
            >
              <div className="space-y-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="all">All Time</option>
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Office Supplies">Office Supplies</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`flex-1 py-2 text-sm rounded-lg ${
                      viewMode === 'chart' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border text-gray-600'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-2 text-sm rounded-lg ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border text-gray-600'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} transactions • ₦{totalExpenses.toLocaleString()} total
          </p>
        </div>
        <QuickActions orgId={orgId} />
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0 md:mt-6">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">₦{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} items</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">vs Last Month</p>
          <p className={`text-lg md:text-xl font-bold ${
            percentageChange > 0 ? 'text-red-500' : 'text-green-500'
          }`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {percentageChange > 0 ? 'Increase' : 'Decrease'}
          </p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border md:hidden"
        >
          <p className="text-xs text-gray-500 mb-1">Categories</p>
          <p className="text-lg font-bold text-gray-900">{categoryData.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border md:hidden"
        >
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-bold text-gray-900">
            ₦{(totalExpenses / (filteredExpenses.length || 1)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Per expense</p>
        </motion.div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Salaries">Salaries</option>
            <option value="Marketing">Marketing</option>
            <option value="Office Supplies">Office Supplies</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 text-sm rounded-lg ${
              viewMode === 'chart' 
                ? 'bg-blue-600 text-white' 
                : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Chart View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm rounded-lg ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Chart Section - Mobile Optimized */}
      {viewMode === 'chart' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 md:px-0"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h2 className="text-base font-semibold mb-4">Expense Categories</h2>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categoryData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px' }}
                    formatter={formatTooltip}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* List View - Mobile Optimized */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 px-4 md:px-0"
        >
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold">Recent Transactions</h2>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
              {filteredExpenses.slice(0, 5).map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900">{expense.description}</h3>
                    <span className="font-bold text-blue-600">₦{expense.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        {expense.category}
                      </span>
                      {expense.vendor && (
                        <span className="text-xs text-gray-500">{expense.vendor}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.slice(0, 10).map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.vendor || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        ₦{expense.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-5xl mb-3">📊</p>
                <p className="text-gray-600 font-medium">No expenses found</p>
                <p className="text-sm text-gray-500 mt-1">Add your first expense</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Mobile FAB for adding expense */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          onClick={() => {/* This will open the QuickActions modal */}}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 flex justify-around">
        <button className="flex flex-col items-center p-2 text-blue-600">
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-600">
          <span className="text-xs">Analytics</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-600">
          <span className="text-xs">Reports</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-600">
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </motion.div>
  );
}