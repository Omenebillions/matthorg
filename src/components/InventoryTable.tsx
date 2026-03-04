// /home/user/matthorg/src/components/InventoryTable.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface InventoryItem {
  id: string;
  organization_id: string;
  item_name: string;
  sku?: string | null;
  quantity: number;
  sale_price?: number | null;
  lease_price_monthly?: number | null;
  listing_type: 'sale' | 'lease' | 'both';
  status: 'active' | 'inactive';
  category?: string | null;
  reorder_point?: number | null;
  supplier?: string | null;
  location?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryTableProps {
  organizationId: string;
  onItemUpdate?: () => void;
  showFilters?: boolean;
  limit?: number;
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      <div className="p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center space-x-4 mb-4">
            <div className="h-12 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Edit Modal Component
function EditItemModal({ 
  isOpen, 
  onClose, 
  item,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  item: InventoryItem | null;
  onSave: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    item_name: '',
    sku: '',
    quantity: 0,
    sale_price: '',
    lease_price_monthly: '',
    listing_type: 'sale' as 'sale' | 'lease' | 'both',
    category: '',
    reorder_point: '',
    supplier: '',
    location: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        sku: item.sku || '',
        quantity: item.quantity || 0,
        sale_price: item.sale_price?.toString() || '',
        lease_price_monthly: item.lease_price_monthly?.toString() || '',
        listing_type: item.listing_type || 'sale',
        category: item.category || '',
        reorder_point: item.reorder_point?.toString() || '',
        supplier: item.supplier || '',
        location: item.location || '',
        status: item.status || 'active',
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const updates: Partial<InventoryItem> = {
      item_name: formData.item_name,
      sku: formData.sku || null,
      quantity: formData.quantity,
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      lease_price_monthly: formData.lease_price_monthly ? parseFloat(formData.lease_price_monthly) : null,
      listing_type: formData.listing_type,
      category: formData.category || null,
      reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
      supplier: formData.supplier || null,
      location: formData.location || null,
      status: formData.status,
    };
    
    await onSave(item.id, updates);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Item</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reorder Point</label>
              <input
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({...formData, reorder_point: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Listing Type</label>
            <select
              value={formData.listing_type}
              onChange={(e) => setFormData({...formData, listing_type: e.target.value as any})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="sale">For Sale</option>
              <option value="lease">For Lease</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(formData.listing_type === 'sale' || formData.listing_type === 'both') && (
              <div>
                <label className="block text-sm font-medium mb-1">Sale Price (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
            {(formData.listing_type === 'lease' || formData.listing_type === 'both') && (
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Lease (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lease_price_monthly}
                  onChange={(e) => setFormData({...formData, lease_price_monthly: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function InventoryTable({ 
  organizationId, 
  onItemUpdate,
  showFilters = true,
  limit = 50 
}: InventoryTableProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInventory(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      showToast(error.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, categoryFilter, statusFilter, limit, supabase, showToast]);

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('inventory-table')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
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
  }, [organizationId, supabase]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setInventory(prev => [payload.new, ...prev].slice(0, limit));
        showToast('New item added', 'success');
        if (onItemUpdate) onItemUpdate();
        break;
      case 'UPDATE':
        setInventory(prev => 
          prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item)
        );
        showToast('Item updated', 'success');
        if (onItemUpdate) onItemUpdate();
        break;
      case 'DELETE':
        setInventory(prev => prev.filter(item => item.id !== payload.old.id));
        showToast('Item deleted', 'info');
        if (onItemUpdate) onItemUpdate();
        break;
    }
  };

  // Update quantity
  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      showToast('Quantity updated', 'success');
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      showToast(error.message || 'Failed to update quantity', 'error');
    }
  };

  // Update item
  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      showToast('Item updated successfully', 'success');
    } catch (error: any) {
      console.error('Error updating item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
  };

  // Filter inventory by search
  const filteredInventory = inventory.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.sku?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.supplier?.toLowerCase().includes(searchLower)
    );
  });

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    }
    if (item.reorder_point && item.quantity <= item.reorder_point) {
      return { label: 'Reorder', color: 'bg-orange-100 text-orange-800' };
    }
    if (item.quantity < 5) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Inventory</h2>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
              <span className="text-sm text-gray-600">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchInventory}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-500">
              {filteredInventory.length} items
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[150px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* Table - Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{item.item_name}</td>
                    <td className="p-3 text-sm text-gray-600">{item.sku || '—'}</td>
                    <td className="p-3 text-sm">{item.category || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.listing_type === 'sale' 
                          ? 'bg-green-100 text-green-800' 
                          : item.listing_type === 'lease'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.listing_type}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.listing_type === 'sale' && item.sale_price && (
                        <span>₦{item.sale_price.toLocaleString()}</span>
                      )}
                      {item.listing_type === 'lease' && item.lease_price_monthly && (
                        <span>₦{item.lease_price_monthly.toLocaleString()}/mo</span>
                      )}
                      {item.listing_type === 'both' && (
                        <span className="text-xs">
                          Sale: ₦{item.sale_price?.toLocaleString()}<br/>
                          Lease: ₦{item.lease_price_monthly?.toLocaleString()}/mo
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 p-1 text-right border rounded focus:ring-2 focus:ring-blue-400"
                          min="0"
                        />
                        {item.reorder_point && item.quantity <= item.reorder_point && (
                          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" title="Reorder point reached" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y">
        <AnimatePresence>
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.item_name}</h3>
                    {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p>{item.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="capitalize">{item.listing_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p>
                      {item.listing_type === 'sale' && item.sale_price && `₦${item.sale_price.toLocaleString()}`}
                      {item.listing_type === 'lease' && item.lease_price_monthly && `₦${item.lease_price_monthly.toLocaleString()}/mo`}
                      {item.listing_type === 'both' && 'Multiple'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 p-1 text-right border rounded"
                        min="0"
                      />
                      {item.reorder_point && item.quantity <= item.reorder_point && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="ml-1 text-sm">Edit</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-sm text-gray-500">
            {search || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first item to get started'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
        Showing {filteredInventory.length} of {inventory.length} items
      </div>

      {/* Edit Modal */}
      <EditItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={updateItem}
      />
    </div>
  );
}