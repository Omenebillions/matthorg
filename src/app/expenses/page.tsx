'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  PlusIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import QuickActions from '@/components/dashboard/QuickActions';
import { useToast } from '@/hooks/useToast';
import { useOrganization } from '@/hooks/useOrganization';

// Type definitions
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor?: string | null;
  payment_method?: string;
  notes?: string | null;
  receipt_url?: string | null;
  created_by: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  expense_date: string;
  vendor: string;
  payment_method: string;
  notes: string;
}

// Categories with icons
const EXPENSE_CATEGORIES = [
  { value: 'Salaries & Wages', label: 'Salaries & Wages', icon: '👥' },
  { value: 'Rent & Utilities', label: 'Rent & Utilities', icon: '🏢' },
  { value: 'Marketing & Ads', label: 'Marketing & Ads', icon: '📢' },
  { value: 'Office Supplies', label: 'Office Supplies', icon: '📎' },
  { value: 'Equipment', label: 'Equipment', icon: '🖥️' },
  { value: 'Travel', label: 'Travel', icon: '✈️' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment', icon: '🍽️' },
  { value: 'Professional Services', label: 'Professional Services', icon: '⚖️' },
  { value: 'Insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'Taxes', label: 'Taxes', icon: '📊' },
  { value: 'Maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'Software', label: 'Software', icon: '💻' },
  { value: 'Other', label: 'Other', icon: '📦' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'check', label: 'Check', icon: '📝' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
];

// Date range options
const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

// Loading skeleton
function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

// Confirmation Modal
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, expenseDescription }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Expense</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "{expenseDescription}"? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Expense Form Modal
function ExpenseFormModal({ isOpen, onClose, onSubmit, initialData, mode = 'add' }: any) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    payment_method: 'bank_transfer',
    notes: '',
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        description: initialData.description || '',
        amount: initialData.amount?.toString() || '',
        category: initialData.category || '',
        expense_date: initialData.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        vendor: initialData.vendor || '',
        payment_method: initialData.payment_method || 'bank_transfer',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        payment_method: 'bank_transfer',
        notes: '',
      });
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'add' ? 'Add New Expense' : 'Edit Expense'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Office supplies, rent, etc."
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Category & Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor/Payee
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Vendor name"
              />
            </div>
          </div>

          {/* Payment Method & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Additional details"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {mode === 'add' ? 'Add Expense' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ExpensesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [dateRange, setDateRange] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      showToast(error.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, showToast, supabase]);

  // Initial load
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          // Handle different events
          if (payload.eventType === 'INSERT') {
            setExpenses(prev => [payload.new as Expense, ...prev]);
            showToast('New expense added', 'success');
          } else if (payload.eventType === 'UPDATE') {
            setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new as Expense : e));
            showToast('Expense updated', 'success');
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
            showToast('Expense deleted', 'info');
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, showToast, supabase]);

  // Filter expenses
  const getFilteredExpenses = useCallback(() => {
    let filtered = [...expenses];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description.toLowerCase().includes(query) ||
        exp.category.toLowerCase().includes(query) ||
        exp.vendor?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }

    // Apply date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(exp => {
      const expDate = new Date(exp.expense_date);
      switch(dateRange) {
        case 'today':
          return expDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return expDate >= weekAgo;
        case 'month':
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        case 'quarter':
          const quarterAgo = new Date(today);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          return expDate >= quarterAgo;
        case 'year':
          return expDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    return filtered;
  }, [expenses, searchQuery, selectedCategory, dateRange]);

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
  ).sort((a, b) => b.amount - a.amount);

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Calculate previous period for comparison
  const getPreviousPeriodTotal = () => {
    const now = new Date();
    const currentStart = new Date(now);
    const previousStart = new Date(now);
    
    switch(dateRange) {
      case 'today':
        previousStart.setDate(previousStart.getDate() - 1);
        return expenses
          .filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate >= previousStart && expDate < currentStart;
          })
          .reduce((sum, exp) => sum + exp.amount, 0);
      case 'week':
        previousStart.setDate(previousStart.getDate() - 14);
        currentStart.setDate(currentStart.getDate() - 7);
        return expenses
          .filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate >= previousStart && expDate < currentStart;
          })
          .reduce((sum, exp) => sum + exp.amount, 0);
      case 'month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenses
          .filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate >= lastMonth && expDate < thisMonthStart;
          })
          .reduce((sum, exp) => sum + exp.amount, 0);
      default:
        return 0;
    }
  };

  const previousTotal = getPreviousPeriodTotal();
  const percentageChange = previousTotal 
    ? ((totalExpenses - previousTotal) / previousTotal) * 100 
    : 0;

  // CRUD Operations
  const handleAddExpense = async (formData: ExpenseFormData) => {
    if (!organization?.id) {
      showToast('Organization not found', 'error');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('expenses')
        .insert({
          organization_id: organization.id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          vendor: formData.vendor || null,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          created_by: user.user.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast('Expense added successfully', 'success');
      setShowFormModal(false);
      fetchExpenses(); // Refresh to be safe
    } catch (error: any) {
      console.error('Error adding expense:', error);
      showToast(error.message || 'Failed to add expense', 'error');
    }
  };

  const handleUpdateExpense = async (formData: ExpenseFormData) => {
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          vendor: formData.vendor || null,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedExpense.id);

      if (error) throw error;

      showToast('Expense updated successfully', 'success');
      setShowFormModal(false);
      setSelectedExpense(null);
      fetchExpenses(); // Refresh to be safe
    } catch (error: any) {
      console.error('Error updating expense:', error);
      showToast(error.message || 'Failed to update expense', 'error');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', selectedExpense.id);

      if (error) throw error;

      showToast('Expense deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      showToast(error.message || 'Failed to delete expense', 'error');
    }
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormMode('edit');
    setShowFormModal(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  // Tooltip formatter
  const formatTooltip = (value: any) => {
    if (typeof value === 'number') {
      return [`₦${value.toLocaleString()}`, 'Amount'];
    }
    return ['₦0', 'Amount'];
  };

  if (loading || orgLoading) {
    return <ExpensesSkeleton />;
  }

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
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>

                {/* Date Range */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  {DATE_RANGES.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>

                {/* View Toggle */}
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
        <QuickActions orgId={organization?.id || ''} />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex justify-between items-center mt-4 mb-6">
        <div className="flex gap-2 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2 border rounded-lg text-sm min-w-[120px]"
          >
            {DATE_RANGES.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg text-sm min-w-[140px]"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => {
            setFormMode('add');
            setSelectedExpense(null);
            setShowFormModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0 md:mt-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">₦{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} items</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">vs Previous Period</p>
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
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Categories</p>
          <p className="text-lg font-bold text-gray-900">{categoryData.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-bold text-gray-900">
            ₦{(totalExpenses / (filteredExpenses.length || 1)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Per expense</p>
        </motion.div>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 md:px-0"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold">Expense Categories</h2>
              <button
                onClick={fetchExpenses}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            {categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No expense data available
              </div>
            ) : (
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
            )}
          </div>
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 px-4 md:px-0"
        >
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-semibold">Recent Transactions</h2>
              <button
                onClick={fetchExpenses}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-5xl mb-3">📊</p>
                <p className="text-gray-600 font-medium">No expenses found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Add your first expense'}
                </p>
                {(searchQuery || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setDateRange('month');
                    }}
                    className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                  {filteredExpenses.map((expense) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{expense.description}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                              {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon} {expense.category}
                            </span>
                            {expense.vendor && (
                              <span className="text-xs text-gray-500">{expense.vendor}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">₦{expense.amount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(expense.expense_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs whitespace-nowrap">
                              {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon} {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {expense.vendor || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                            ₦{expense.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(expense)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition mr-1"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(expense)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination could be added here */}
                {filteredExpenses.length > 10 && (
                  <div className="p-4 border-t flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Showing 1-10 of {filteredExpenses.length} expenses
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
                      <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          onClick={() => {
            setFormMode('add');
            setSelectedExpense(null);
            setShowFormModal(true);
          }}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Modals */}
      <ExpenseFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedExpense(null);
        }}
        onSubmit={formMode === 'add' ? handleAddExpense : handleUpdateExpense}
        initialData={selectedExpense}
        mode={formMode}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeleteExpense}
        expenseDescription={selectedExpense?.description}
      />
    </motion.div>
  );
}