'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  CheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useOrganization } from '@/hooks/useOrganization';
import QuickActions from '@/components/dashboard/QuickActions';

// Type definitions
interface InventoryItem {
  id: string;
  organization_id: string;
  item_name: string;
  sku?: string | null;
  quantity: number;
  sale_price?: number | null;
  lease_price_monthly?: number | null;
  listing_type: 'sale' | 'lease' | 'both';
  category?: string | null;
  description?: string | null;
  reorder_point?: number | null;
  supplier?: string | null;
  location?: string | null;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface InventoryFormData {
  item_name: string;
  sku: string;
  quantity: string;
  sale_price: string;
  lease_price_monthly: string;
  listing_type: 'sale' | 'lease' | 'both';
  category: string;
  description: string;
  reorder_point: string;
  supplier: string;
  location: string;
  status: 'active' | 'inactive';
}

// Categories with icons
const INVENTORY_CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'food', label: 'Food & Beverage', icon: '🍎' },
  { value: 'equipment', label: 'Equipment', icon: '⚙️' },
  { value: 'supplies', label: 'Office Supplies', icon: '📎' },
  { value: 'machinery', label: 'Machinery', icon: '🏭' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { value: 'raw_materials', label: 'Raw Materials', icon: '⛏️' },
  { value: 'finished_goods', label: 'Finished Goods', icon: '📦' },
  { value: 'other', label: 'Other', icon: '📌' },
];

// Loading skeleton
function InventorySkeleton() {
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

// Inventory Form Modal
function InventoryFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  mode = 'add' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: InventoryFormData) => Promise<void>;
  initialData?: InventoryItem | null;
  mode?: 'add' | 'edit';
}) {
  const [formData, setFormData] = useState<InventoryFormData>({
    item_name: '',
    sku: '',
    quantity: '',
    sale_price: '',
    lease_price_monthly: '',
    listing_type: 'sale',
    category: '',
    description: '',
    reorder_point: '',
    supplier: '',
    location: '',
    status: 'active',
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        item_name: initialData.item_name || '',
        sku: initialData.sku || '',
        quantity: initialData.quantity?.toString() || '',
        sale_price: initialData.sale_price?.toString() || '',
        lease_price_monthly: initialData.lease_price_monthly?.toString() || '',
        listing_type: initialData.listing_type || 'sale',
        category: initialData.category || '',
        description: initialData.description || '',
        reorder_point: initialData.reorder_point?.toString() || '',
        supplier: initialData.supplier || '',
        location: initialData.location || '',
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        item_name: '',
        sku: '',
        quantity: '',
        sale_price: '',
        lease_price_monthly: '',
        listing_type: 'sale',
        category: '',
        description: '',
        reorder_point: '',
        supplier: '',
        location: '',
        status: 'active',
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
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'add' ? 'Add New Inventory Item' : 'Edit Inventory Item'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="e.g., Office Chair, Laptop, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="SKU-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select category</option>
                {INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
              <input
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Minimum stock alert"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Listing Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sale"
                  checked={formData.listing_type === 'sale'}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as 'sale' })}
                  className="mr-2"
                />
                For Sale Only
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="lease"
                  checked={formData.listing_type === 'lease'}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as 'lease' })}
                  className="mr-2"
                />
                For Lease Only
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="both"
                  checked={formData.listing_type === 'both'}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as 'both' })}
                  className="mr-2"
                />
                Both
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(formData.listing_type === 'sale' || formData.listing_type === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    placeholder="0.00"
                  />
                </div>
              )}

              {(formData.listing_type === 'lease' || formData.listing_type === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Lease (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.lease_price_monthly}
                    onChange={(e) => setFormData({ ...formData, lease_price_monthly: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Warehouse A, Shelf 3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Item description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {mode === 'add' ? 'Add Item' : 'Save Changes'}
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

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "{itemName}"? This action cannot be undone.
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

// Main Component
export default function InventoryPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      showToast(error.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, showToast, supabase]);

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [payload.new as InventoryItem, ...prev]);
            showToast('New item added', 'success');
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as InventoryItem : item
            ));
            showToast('Item updated', 'success');
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => prev.filter(item => item.id !== payload.old.id));
            showToast('Item deleted', 'info');
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

  // Get unique categories for filter
  const categories = ['all', ...new Set(inventory.map(item => item.category).filter(Boolean))];

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = 
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(search.toLowerCase());
      
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

  // CRUD Operations
  const handleAddItem = async (formData: InventoryFormData) => {
    if (!organization?.id) {
      showToast('Organization not found', 'error');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('inventory')
        .insert({
          organization_id: organization.id,
          item_name: formData.item_name,
          sku: formData.sku || null,
          quantity: parseInt(formData.quantity) || 0,
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          lease_price_monthly: formData.lease_price_monthly ? parseFloat(formData.lease_price_monthly) : null,
          listing_type: formData.listing_type,
          category: formData.category || null,
          description: formData.description || null,
          reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
          supplier: formData.supplier || null,
          location: formData.location || null,
          status: formData.status,
          created_by: user.user.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast('Item added successfully', 'success');
      setShowFormModal(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error adding item:', error);
      showToast(error.message || 'Failed to add item', 'error');
    }
  };

  const handleUpdateItem = async (formData: InventoryFormData) => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          item_name: formData.item_name,
          sku: formData.sku || null,
          quantity: parseInt(formData.quantity) || 0,
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          lease_price_monthly: formData.lease_price_monthly ? parseFloat(formData.lease_price_monthly) : null,
          listing_type: formData.listing_type,
          category: formData.category || null,
          description: formData.description || null,
          reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
          supplier: formData.supplier || null,
          location: formData.location || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      showToast('Item updated successfully', 'success');
      setShowFormModal(false);
      setEditingItem(null);
      fetchInventory();
    } catch (error: any) {
      console.error('Error updating item:', error);
      showToast(error.message || 'Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async () => {
    if (!showDeleteConfirm) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', showDeleteConfirm);

      if (error) throw error;

      showToast('Item deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting item:', error);
      showToast(error.message || 'Failed to delete item', 'error');
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setFormMode('edit');
    setShowFormModal(true);
  };

  const handleDuplicateClick = (item: InventoryItem) => {
    const { id, created_at, updated_at, ...itemWithoutId } = item;
    setEditingItem({ ...itemWithoutId, id: '', item_name: `${item.item_name} (Copy)` } as InventoryItem);
    setFormMode('add');
    setShowFormModal(true);
  };

  // Get stock status color
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    if (quantity < 5) return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    return { color: 'bg-green-100 text-green-800', text: 'In Stock' };
  };

  if (loading || orgLoading) {
    return <InventorySkeleton />;
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
                  <option value="all">All Categories</option>
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
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
        <div className="flex items-center gap-4">
          <QuickActions orgId={organization?.id || ''} />
          <button
            onClick={() => {
              setFormMode('add');
              setEditingItem(null);
              setShowFormModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0 md:mt-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Products</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{stats.total}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Low Stock</p>
          <p className="text-lg md:text-xl font-bold text-yellow-600">{stats.lowStock}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
          <p className="text-lg md:text-xl font-bold text-red-600">{stats.outOfStock}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Value</p>
          <p className="text-lg md:text-xl font-bold text-green-600">₦{stats.totalValue.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Desktop Search & Filters */}
      <div className="hidden md:flex justify-between items-center mt-6">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, category, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded-lg text-sm min-w-[140px]"
          >
            <option value="all">All Categories</option>
            {INVENTORY_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="p-2 border rounded-lg text-sm min-w-[120px]"
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
            const category = INVENTORY_CATEGORIES.find(c => c.value === item.category);
            
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
                      {item.listing_type === 'sale' && item.sale_price && `₦${item.sale_price.toLocaleString()}`}
                      {item.listing_type === 'lease' && item.lease_price_monthly && `₦${item.lease_price_monthly.toLocaleString()}/mo`}
                      {item.listing_type === 'both' && (
                        <>
                          ₦{item.sale_price?.toLocaleString()} / 
                          ₦{item.lease_price_monthly?.toLocaleString()}/mo
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className="text-sm font-medium">{item.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm">{category ? `${category.icon} ${category.label}` : item.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm capitalize">{item.listing_type}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleDuplicateClick(item)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-3">📦</p>
              <p className="text-gray-600 font-medium">No inventory items found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || categoryFilter !== 'all' || stockFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first product'}
              </p>
              {(search || categoryFilter !== 'all' || stockFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('all');
                    setStockFilter('all');
                  }}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
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
                  const category = INVENTORY_CATEGORIES.find(c => c.value === item.category);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.item_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {category ? `${category.icon} ${category.label}` : item.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.listing_type === 'sale' && item.sale_price && `₦${item.sale_price.toLocaleString()}`}
                        {item.listing_type === 'lease' && item.lease_price_monthly && `₦${item.lease_price_monthly.toLocaleString()}/mo`}
                        {item.listing_type === 'both' && (
                          <>
                            ₦{item.sale_price?.toLocaleString()} / 
                            ₦{item.lease_price_monthly?.toLocaleString()}/mo
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{item.quantity}</span>
                          {item.reorder_point && item.quantity <= item.reorder_point && (
                            <span className="text-xs text-yellow-600">(Reorder)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicateClick(item)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
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
              <p className="text-sm text-gray-500 mt-1">
                {search || categoryFilter !== 'all' || stockFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first product'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <InventoryFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingItem(null);
        }}
        onSubmit={formMode === 'add' ? handleAddItem : handleUpdateItem}
        initialData={editingItem}
        mode={formMode}
      />

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
        itemName={inventory.find(i => i.id === showDeleteConfirm)?.item_name || ''}
      />

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          onClick={() => {
            setFormMode('add');
            setEditingItem(null);
            setShowFormModal(true);
          }}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}