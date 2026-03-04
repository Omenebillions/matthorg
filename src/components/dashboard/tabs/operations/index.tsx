// /home/user/matthorg/src/components/dashboard/tabs/operations/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

interface OperationsTabProps {
  orgId: string;
  industry: string;
  // Pass through data from parent
  taskCount?: number;
  pendingTasks?: number;
  inventoryCount?: number;
  lowStock?: any[];
  totalSales?: number;
  totalExpenses?: number;
  netProfit?: number;
  recentTasks?: any[];
  recentExpenses?: any[];
}

// Attendance Widget Component
const AttendanceWidget = ({ orgId }: { orgId: string }) => {
  const [todayCount, setTodayCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!orgId) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('attendance')
          .select('clock_out')
          .eq('organization_id', orgId)
          .gte('clock_in', `${today}T00:00:00.000Z`);
        
        if (error) {
          console.error('Error fetching attendance:', error);
          return;
        }
        
        if (data) {
          setTodayCount(data.length);
          setActiveCount(data.filter(r => !r.clock_out).length);
        }
      } catch (error) {
        console.error('Error in attendance fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();

    // Set up real-time subscription for attendance updates
    const subscription = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance',
          filter: `organization_id=eq.${orgId}`
        }, 
        () => {
          fetchAttendance(); // Refresh when attendance changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orgId, supabase]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <Link href="/attendance" className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <ClockIcon className="w-5 h-5" />
        </div>
        <span className="text-xs text-purple-600 font-medium">
          {activeCount} active
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mt-2">Today's Attendance</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{todayCount}</p>
      <p className="text-sm text-gray-500 mt-1">staff members</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <UserGroupIcon className="w-3 h-3" />
        <span>{activeCount} currently on site</span>
      </div>
    </Link>
  );
};

export default function OperationsTab({ 
  orgId, 
  industry,
  taskCount = 0,
  pendingTasks = 0,
  inventoryCount = 0,
  lowStock = [],
  totalSales = 0,
  totalExpenses = 0,
  netProfit = 0,
  recentTasks = [],
  recentExpenses = []
}: OperationsTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
  });

  // Core feature cards that work for EVERY industry
  const coreFeatures = [
    {
      id: 'tasks',
      title: 'Tasks',
      icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
      color: 'blue',
      stats: [
        { label: 'Total', value: taskCount },
        { label: 'Pending', value: pendingTasks },
      ],
      href: `/dashboard/tasks`,
      description: 'Manage your team tasks',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: <CubeIcon className="w-6 h-6" />,
      color: 'green',
      stats: [
        { label: 'Items', value: inventoryCount },
        { label: 'Low Stock', value: lowStock.length },
      ],
      href: `/dashboard/inventory`,
      description: 'Track stock levels',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: <CurrencyDollarIcon className="w-6 h-6" />,
      color: 'yellow',
      stats: [
        { label: 'Total', value: `$${totalExpenses.toLocaleString()}` },
        { label: 'This Month', value: 'View all' },
      ],
      href: `/dashboard/expenses`,
      description: 'Track business expenses',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  // Quick expense input
  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate amount
      const amount = parseFloat(expenseForm.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          organization_id: orgId,
          amount: amount,
          category: expenseForm.category,
          description: expenseForm.description || 'Quick expense',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast('Expense added successfully', 'success');
      setExpenseForm({ amount: '', category: '', description: '' });
      setShowExpenseModal(false);
      
      // Refresh the page to show new data
      router.refresh();
      
    } catch (error: any) {
      console.error('Error adding expense:', error);
      showToast(error.message || 'Failed to add expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Business Operations</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your core business activities</p>
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow flex items-center gap-2"
          >
            <CurrencyDollarIcon className="w-5 h-5" />
            Quick Expense
          </button>
        </div>
      </div>

      {/* Stats Grid with Attendance Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
          <p className="text-sm text-green-700 font-medium mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-green-800">${(totalSales - totalExpenses).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2">
            {totalSales > 0 ? ((totalSales - totalExpenses) / totalSales * 100).toFixed(1) : 0}% margin
          </p>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-1">Revenue</p>
          <p className="text-2xl font-bold text-blue-800">${totalSales.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-2">Total sales</p>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-sm border border-red-200">
          <p className="text-sm text-red-700 font-medium mb-1">Expenses</p>
          <p className="text-2xl font-bold text-red-800">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-2">Total costs</p>
        </div>

        {/* Attendance Widget - Takes the 4th spot */}
        <AttendanceWidget orgId={orgId} />
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coreFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
          >
            <Link href={feature.href} className="block p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${feature.bgColor} rounded-lg ${feature.textColor}`}>
                  {feature.icon}
                </div>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{feature.description}</p>
              
              <div className="grid grid-cols-2 gap-2">
                {feature.stats.map((stat, i) => (
                  <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
            <Link href="/dashboard/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tasks yet</p>
                <Link 
                  href="/dashboard/tasks/new" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-block mt-2"
                >
                  Create your first task →
                </Link>
              </div>
            ) : (
              recentTasks.slice(0, 5).map((task) => (
                <Link 
                  key={task.id} 
                  href={`/dashboard/tasks/${task.id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Status: <span className="capitalize">{task.status}</span> • Priority: {task.priority}
                      </p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
            <Link href="/dashboard/expenses" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No expenses yet</p>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-block mt-2"
                >
                  Add your first expense →
                </button>
              </div>
            ) : (
              recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{expense.category}</p>
                      <p className="text-sm text-gray-500 mt-1">{expense.description || 'No description'}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -${expense.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-xl font-bold mb-4">Add Quick Expense</h3>
            <form onSubmit={handleQuickExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
                >
                  <option value="">Select category</option>
                  <option value="supplies">Supplies</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="payroll">Payroll</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
                  placeholder="What was this for?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}