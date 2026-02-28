'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import QuickActions from '@/components/dashboard/QuickActions';
import { useRealtime } from '@/hooks/useRealtime';
import { createClient } from '@/utils/supabase/client';

interface InventoryItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  sale_price?: number;
  lease_price_monthly?: number;
  listing_type: 'sale' | 'lease';
  category?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const orgId = 'b98e059f-1af6-4d47-9bf4-f1ab4d6fd1e8'; // Get from context
  const supabase = createClient();

  // Real-time inventory data
  const { data: inventory = [], isLive } = useRealtime<InventoryItem>(
    { table: 'inventory', filter: `organization_id=eq.${orgId}` },
    []
  );

  // Get unique categories for filter
  const categories = ['all', ...new Set(inventory.map(item => item.category).filter(Boolean))];

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = 
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      const matchesStock = stockFilter === 'all' ? true :
                          stockFilter === 'low' ? item.quantity < 5 && item.quantity > 0 :
                          item.quantity === 0;
      
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch(sortField) {
        case 'name':
          aValue = a.item_name;
          bValue = b.item_name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.sale_price || a.lease_price_monthly || 0;
          bValue = b.sale_price || b.lease_price_monthly || 0;
          break;
        default:
          aValue = a.item_name;
          bValue = b.item_name;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Calculate stats
  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(i => i.quantity < 5 && i.quantity > 0).length,
    outOfStock: inventory.filter(i => i.quantity === 0).length,
    totalValue: inventory.reduce((sum, i) => sum + ((i.sale_price || 0) * i.quantity), 0)
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setShowDeleteConfirm(null);
    }
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { error } = await supabase
      .from('inventory')
      .update({
        item_name: editingItem.item_name,
        quantity: editingItem.quantity,
        sale_price: editingItem.sale_price,
        category: editingItem.category,
        status: editingItem.status
      })
      .eq('id', editingItem.id);

    if (!error) {
      setShowEditModal(false);
      setEditingItem(null);
    }
  };

  // Get stock status color
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    if (quantity < 5) return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    return { color: 'bg-green-100 text-green-800', text: 'In Stock' };
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
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
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
              placeholder="Search inventory..."
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
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock (&lt;5)</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {inventory.length} products • ₦{stats.totalValue.toLocaleString()} total value
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
          <p className="text-xs text-gray-500 mb-1">Total Products</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{stats.total}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Low Stock</p>
          <p className="text-lg md:text-xl font-bold text-yellow-600">{stats.lowStock}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
          <p className="text-lg md:text-xl font-bold text-red-600">{stats.outOfStock}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Value</p>
          <p className="text-lg md:text-xl font-bold text-green-600">₦{stats.totalValue.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Desktop Search & Filters */}
      <div className="hidden md:flex justify-between items-center mt-6">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="name">Name</option>
            <option value="quantity">Stock Level</option>
            <option value="price">Price</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Inventory Table - Mobile Card View */}
      <div className="md:hidden mt-4 px-4">
        <div className="space-y-3">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item.quantity);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-4 shadow-sm border"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.item_name}</h3>
                    {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-medium">
                      {item.listing_type === 'sale' 
                        ? `₦${item.sale_price?.toLocaleString()}`
                        : `₦${item.lease_price_monthly?.toLocaleString()}/mo`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className="text-sm font-medium">{item.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm">{item.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm capitalize">{item.listing_type}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block mt-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.quantity);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.item_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.listing_type === 'sale' 
                          ? `₦${item.sale_price?.toLocaleString()}`
                          : `₦${item.lease_price_monthly?.toLocaleString()}/mo`}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-3">📦</p>
              <p className="text-gray-600 font-medium">No inventory items found</p>
              <p className="text-sm text-gray-500 mt-1">Add your first product</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Edit Inventory Item</h3>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editingItem.item_name}
                    onChange={(e) => setEditingItem({...editingItem, item_name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={editingItem.sale_price || editingItem.lease_price_monthly || 0}
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      sale_price: editingItem.listing_type === 'sale' ? parseFloat(e.target.value) : undefined,
                      lease_price_monthly: editingItem.listing_type === 'lease' ? parseFloat(e.target.value) : undefined
                    })}
                    className="w-full p-2 border rounded-lg"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({...editingItem, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
              <h3 className="text-lg font-bold mb-2">Delete Item</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this item? This action cannot be undone.
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
        <button className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 flex justify-around">
        <button className="flex flex-col items-center p-2 text-blue-600">
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-600">
          <span className="text-xs">Inventory</span>
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