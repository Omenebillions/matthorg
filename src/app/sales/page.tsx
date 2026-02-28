'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import QuickActions from '@/components/dashboard/QuickActions';
import SalesChart from '@/components/dashboard/SalesChart';

interface Sale {
  id: string;
  item: string;
  amount: number;
  customer_name?: string;
  payment_method?: string;
  status?: 'completed' | 'pending' | 'refunded';
  created_at: string;
  organization_id: string;
  creator_id?: string;
}

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    customer_name: '',
    payment_method: 'cash',
    status: 'completed'
  });

  const orgId = 'b98e059f-1af6-4d47-9bf4-f1ab4d6fd1e8'; // Get from context
  const supabase = createClient();

  // Real-time sales data
  const { data: sales = [], isLive } = useRealtime<Sale>(
    { table: 'sales', filter: `organization_id=eq.${orgId}` },
    []
  );

  // Filter sales based on date
  const getFilteredSales = () => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      switch(dateFilter) {
        case 'today':
          return saleDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          return saleDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          return saleDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredSales = getFilteredSales()
    .filter(sale => 
      sale.item.toLowerCase().includes(search.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return sortOrder === 'asc' 
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });

  // Calculate stats
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const todaySales = filteredSales.filter(s => 
    new Date(s.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum, sale) => sum + sale.amount, 0);
  const averageSale = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // Handle add/edit sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const saleData = {
      item: formData.item,
      amount: parseFloat(formData.amount),
      customer_name: formData.customer_name || null,
      payment_method: formData.payment_method,
      status: formData.status,
      organization_id: orgId,
      creator_id: user.id,
      created_at: new Date().toISOString()
    };

    if (editingSale) {
      // Update existing sale
      const { error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', editingSale.id);

      if (!error) {
        setShowAddModal(false);
        setEditingSale(null);
        resetForm();
      }
    } else {
      // Add new sale
      const { error } = await supabase
        .from('sales')
        .insert([saleData]);

      if (!error) {
        setShowAddModal(false);
        resetForm();
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (!error) {
      setShowDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      item: '',
      amount: '',
      customer_name: '',
      payment_method: 'cash',
      status: 'completed'
    });
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
          <h1 className="text-xl font-bold text-gray-900">Sales</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-1`} />
              <span className="text-xs text-gray-500">{isLive ? 'Live' : ''}</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FunnelIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
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
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as typeof sortField)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full py-2 bg-white border rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredSales.length} transactions • ₦{totalSales.toLocaleString()} total
          </p>
        </div>
        <QuickActions orgId={orgId} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0 md:mt-6">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Sales</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">₦{totalSales.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Today</p>
          <p className="text-lg md:text-xl font-bold text-blue-600">₦{todaySales.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg md:text-xl font-bold text-green-600">₦{averageSale.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <p className="text-lg md:text-xl font-bold text-purple-600">{filteredSales.length}</p>
        </motion.div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex justify-between items-center mt-6">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="mt-6 px-4 md:px-0">
        <SalesChart orgId={orgId} />
      </div>

      {/* Sales Table - Mobile Card View */}
      <div className="md:hidden mt-4 px-4">
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-4 shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{sale.item}</h3>
                  {sale.customer_name && (
                    <p className="text-xs text-gray-500">Customer: {sale.customer_name}</p>
                  )}
                </div>
                <span className="text-lg font-bold text-green-600">₦{sale.amount.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm">{new Date(sale.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="text-sm capitalize">{sale.payment_method || 'cash'}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => {
                    setEditingSale(sale);
                    setFormData({
                      item: sale.item,
                      amount: sale.amount.toString(),
                      customer_name: sale.customer_name || '',
                      payment_method: sale.payment_method || 'cash',
                      status: sale.status || 'completed'
                    });
                    setShowAddModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(sale.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block mt-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{sale.item}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">₦{sale.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm capitalize">{sale.payment_method || 'cash'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSale(sale);
                            setFormData({
                              item: sale.item,
                              amount: sale.amount.toString(),
                              customer_name: sale.customer_name || '',
                              payment_method: sale.payment_method || 'cash',
                              status: sale.status || 'completed'
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(sale.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-3">💰</p>
              <p className="text-gray-600 font-medium">No sales found</p>
              <p className="text-sm text-gray-500 mt-1">Add your first sale</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Sale Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setEditingSale(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                {editingSale ? 'Edit Sale' : 'Record New Sale'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Item/Service *</label>
                  <input
                    type="text"
                    value={formData.item}
                    onChange={(e) => setFormData({...formData, item: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., Product name, Service type"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSale ? 'Update' : 'Save'} Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSale(null);
                      resetForm();
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-2">Delete Sale</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this sale? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}