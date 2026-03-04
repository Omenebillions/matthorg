// /home/user/matthorg/src/components/dashboard/tabs/operations/index.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface OperationsTabProps {
  orgId: string;
  industry: string;
  // Data from parent
  taskCount: number;
  pendingTasks: number;
  inventoryCount: number;
  lowStock: any[];
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  recentTasks: any[];
  recentExpenses: any[];
}

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
  recentExpenses = [],
}: OperationsTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
  });

  // Handle quick expense add
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          organization_id: orgId,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          description: expenseForm.description,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Reset form and close modal
      setExpenseForm({ amount: '', category: '', description: '' });
      setShowExpenseModal(false);
      
      // Refresh the page to show new data
      router.refresh();
      
    } catch (error: any) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Core feature cards
  const features = [
    {
      id: 'tasks',
      title: 'Tasks',
      icon: ClipboardDocumentListIcon,
      color: 'blue',
      stats: [
        { label: 'Total', value: taskCount },
        { label: 'Pending', value: pendingTasks },
      ],
      href: '/dashboard/tasks',
      description: 'Manage your team tasks',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: CubeIcon,
      color: 'green',
      stats: [
        { label: 'Items', value: inventoryCount },
        { label: 'Low Stock', value: lowStock.length },
      ],
      href: '/dashboard/inventory',
      description: 'Track stock levels',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      stats: [
        { label: 'Total', value: `$${totalExpenses.toLocaleString()}` },
        { label: 'This Month', value: 'View all' },
      ],
      href: '/dashboard/expenses',
      description: 'Track business expenses',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Business Operations</h2>
            <p className="text-gray-500">Manage your core business activities</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/tasks/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              New Task
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Quick Expense
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Link href={feature.href} className="block p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-${feature.color}-100 rounded-lg text-${feature.color}-600`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{feature.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {feature.stats.map((stat, i) => (
                    <div key={i} className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-green-600">${totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-blue-600">
            {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Tasks</h3>
            <Link href="/dashboard/tasks" className="text-blue-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="divide-y">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tasks yet. Create your first task.
              </div>
            ) : (
              recentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        Status: {task.status} • Priority: {task.priority}
                      </p>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-gray-400">
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Expenses</h3>
            <Link href="/dashboard/expenses" className="text-blue-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="divide-y">
            {recentExpenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No expenses yet. Add your first expense.
              </div>
            ) : (
              recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-gray-500">{expense.description || 'No description'}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      ${expense.amount.toLocaleString()}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Add Quick Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select category</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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