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
  CurrencyDollarIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useOrganization } from '@/hooks/useOrganization';
import QuickActions from '@/components/dashboard/QuickActions';
import SalesChart from '@/components/dashboard/SalesChart';

// Type definitions
interface Sale {
  id: string;
  organization_id: string;
  item_name: string;
  inventory_item_id?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  payment_method: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'credit' | 'other';
  payment_status: 'paid' | 'pending' | 'refunded' | 'partially_paid';
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  sale_price?: number | null;
  sku?: string | null;
}

// Updated to include 'refunded' to match the Sale interface
interface SaleFormData {
  item_name: string;
  inventory_item_id: string;
  quantity: string;
  unit_price: string;
  amount: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'credit' | 'other';
  payment_status: 'paid' | 'pending' | 'refunded' | 'partially_paid'; // Added 'refunded'
  notes: string;
}

// Payment methods with icons
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'credit', label: 'Credit', icon: '📝' },
  { value: 'other', label: 'Other', icon: '🔄' },
];

// Payment status options - now includes 'refunded'
const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'blue' },
  { value: 'refunded', label: 'Refunded', color: 'red' },
];

// Loading skeleton
function SalesSkeleton() {
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

// Sale Form Modal
function SaleFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  inventoryItems,
  mode = 'add' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: SaleFormData) => Promise<void>;
  initialData?: Sale | null;
  inventoryItems: InventoryItem[];
  mode?: 'add' | 'edit';
}) {
  const [formData, setFormData] = useState<SaleFormData>({
    item_name: '',
    inventory_item_id: '',
    quantity: '1',
    unit_price: '',
    amount: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    payment_method: 'cash',
    payment_status: 'paid',
    notes: '',
  });

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Calculate amount when quantity or unit price changes
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const total = quantity * unitPrice;
    setFormData(prev => ({ ...prev, amount: total.toString() }));
  }, [formData.quantity, formData.unit_price]);

  // Update when inventory item is selected
  const handleItemSelect = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setFormData(prev => ({
        ...prev,
        inventory_item_id: itemId,
        item_name: item.item_name,
        unit_price: item.sale_price?.toString() || '',
      }));
    }
  };

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        item_name: initialData.item_name || '',
        inventory_item_id: initialData.inventory_item_id || '',
        quantity: initialData.quantity?.toString() || '1',
        unit_price: initialData.unit_price?.toString() || '',
        amount: initialData.amount?.toString() || '',
        customer_name: initialData.customer_name || '',
        customer_email: initialData.customer_email || '',
        customer_phone: initialData.customer_phone || '',
        payment_method: initialData.payment_method || 'cash',
        payment_status: initialData.payment_status || 'paid',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        item_name: '',
        inventory_item_id: '',
        quantity: '1',
        unit_price: '',
        amount: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        payment_method: 'cash',
        payment_status: 'paid',
        notes: '',
      });
      setSelectedItem(null);
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
            {mode === 'add' ? 'Record New Sale' : 'Edit Sale'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Inventory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select from Inventory <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={formData.inventory_item_id}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Manual Entry (not in inventory)</option>
              {inventoryItems
                .filter(item => item.quantity > 0)
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} - ₦{item.sale_price?.toLocaleString()} ({item.quantity} in stock)
                  </option>
              ))}
            </select>
          </div>

          {/* Item Details */}
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
                placeholder="Product or service name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedItem?.quantity || undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              {selectedItem && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {selectedItem.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 mb-1">Total Amount</label>
            <p className="text-2xl font-bold text-blue-700">
              ₦{parseFloat(formData.amount || '0').toLocaleString()}
            </p>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
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
                Payment Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                {PAYMENT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {mode === 'add' ? 'Record Sale' : 'Update Sale'}
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
function DeleteConfirmModal({ isOpen, onClose, onConfirm, saleInfo }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Sale</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete the sale of <strong>{saleInfo?.item_name}</strong> for 
          ₦{saleInfo?.amount?.toLocaleString()}? This action cannot be undone.
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
export default function SalesPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // State
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('month');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch sales
  const fetchSales = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      showToast(error.message || 'Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, showToast, supabase]);

  // Fetch inventory items for selection
  const fetchInventory = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, item_name, quantity, sale_price, sku')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .gt('quantity', 0);

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
    }
  }, [organization?.id, supabase]);

  // Initial load
  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, [fetchSales, fetchInventory]);

  // Real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSales(prev => [payload.new as Sale, ...prev]);
            showToast('New sale recorded', 'success');
          } else if (payload.eventType === 'UPDATE') {
            setSales(prev => prev.map(sale => 
              sale.id === payload.new.id ? payload.new as Sale : sale
            ));
            showToast('Sale updated', 'success');
          } else if (payload.eventType === 'DELETE') {
            setSales(prev => prev.filter(sale => sale.id !== payload.old.id));
            showToast('Sale deleted', 'info');
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

  // Filter sales
  const getFilteredSales = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      
      // Date filter
      let dateMatch = true;
      switch(dateFilter) {
        case 'today':
          dateMatch = saleDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateMatch = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateMatch = saleDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          dateMatch = saleDate >= yearAgo;
          break;
        default:
          dateMatch = true;
      }

      // Search filter
      const searchMatch = search === '' || 
        sale.item_name.toLowerCase().includes(search.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        sale.customer_email?.toLowerCase().includes(search.toLowerCase());

      // Payment method filter
      const paymentMatch = paymentFilter === 'all' || sale.payment_method === paymentFilter;

      // Status filter - Fixed the comparison
      const statusMatch = statusFilter === 'all' || sale.payment_status === statusFilter;

      return dateMatch && searchMatch && paymentMatch && statusMatch;
    });
  }, [sales, search, dateFilter, paymentFilter, statusFilter]);

  const filteredSales = getFilteredSales()
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
  const pendingPayments = filteredSales.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + s.amount, 0);

  // CRUD Operations
  const handleAddSale = async (formData: SaleFormData) => {
    if (!organization?.id) {
      showToast('Organization not found', 'error');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const quantity = parseInt(formData.quantity) || 1;
      const unitPrice = parseFloat(formData.unit_price) || 0;
      const totalAmount = quantity * unitPrice;

      // Start a transaction
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          organization_id: organization.id,
          item_name: formData.item_name,
          inventory_item_id: formData.inventory_item_id || null,
          quantity: quantity,
          unit_price: unitPrice,
          amount: totalAmount,
          customer_name: formData.customer_name || null,
          customer_email: formData.customer_email || null,
          customer_phone: formData.customer_phone || null,
          payment_method: formData.payment_method,
          payment_status: formData.payment_status,
          status: formData.payment_status === 'paid' ? 'completed' : 
                 formData.payment_status === 'refunded' ? 'refunded' : 'pending',
          notes: formData.notes || null,
          created_by: user.user.id,
          created_at: new Date().toISOString(),
        });

      if (saleError) throw saleError;

      // Update inventory quantity if item was selected
      if (formData.inventory_item_id) {
        const { error: inventoryError } = await supabase
          .rpc('decrement_inventory', {
            item_id: formData.inventory_item_id,
            quantity_to_remove: quantity
          });

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Don't throw - sale was already recorded
        }
      }

      showToast('Sale recorded successfully', 'success');
      setShowAddModal(false);
      fetchSales(); // Refresh sales
      fetchInventory(); // Refresh inventory
    } catch (error: any) {
      console.error('Error adding sale:', error);
      showToast(error.message || 'Failed to record sale', 'error');
    }
  };

  const handleUpdateSale = async (formData: SaleFormData) => {
    if (!editingSale) return;

    try {
      const quantity = parseInt(formData.quantity) || 1;
      const unitPrice = parseFloat(formData.unit_price) || 0;
      const totalAmount = quantity * unitPrice;

      const { error } = await supabase
        .from('sales')
        .update({
          item_name: formData.item_name,
          inventory_item_id: formData.inventory_item_id || null,
          quantity: quantity,
          unit_price: unitPrice,
          amount: totalAmount,
          customer_name: formData.customer_name || null,
          customer_email: formData.customer_email || null,
          customer_phone: formData.customer_phone || null,
          payment_method: formData.payment_method,
          payment_status: formData.payment_status,
          status: formData.payment_status === 'paid' ? 'completed' : 
                 formData.payment_status === 'refunded' ? 'refunded' : 'pending',
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSale.id);

      if (error) throw error;

      showToast('Sale updated successfully', 'success');
      setShowAddModal(false);
      setEditingSale(null);
      fetchSales();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      showToast(error.message || 'Failed to update sale', 'error');
    }
  };

  const handleDeleteSale = async () => {
    if (!showDeleteConfirm) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', showDeleteConfirm);

      if (error) throw error;

      showToast('Sale deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      showToast(error.message || 'Failed to delete sale', 'error');
    }
  };

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setShowAddModal(true);
  };

  const handleDuplicateClick = (sale: Sale) => {
    const { id, created_at, updated_at, ...saleData } = sale;
    setEditingSale({ ...saleData, id: '' } as Sale);
    setShowAddModal(true);
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid': return 'bg-blue-100 text-blue-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || orgLoading) {
    return <SalesSkeleton />;
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
                  <option value="year">This Year</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Payments</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.icon} {method.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  {PAYMENT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as typeof sortField)}
                    className="flex-1 p-2 border rounded-lg text-sm"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-white border rounded-lg"
                  >
                    {sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
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
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredSales.length} transactions • ₦{totalSales.toLocaleString()} total
          </p>
        </div>
        <div className="flex items-center gap-4">
          <QuickActions orgId={organization?.id || ''} />
          <button
            onClick={() => {
              setEditingSale(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Record Sale
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-0 md:mt-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Total Sales</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">₦{totalSales.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Today</p>
          <p className="text-lg md:text-xl font-bold text-blue-600">₦{todaySales.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg md:text-xl font-bold text-green-600">₦{averageSale.toLocaleString()}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-xs text-gray-500 mb-1">Pending Payments</p>
          <p className="text-lg md:text-xl font-bold text-yellow-600">₦{pendingPayments.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex justify-between items-center mt-6">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
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
            className="p-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="p-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="all">All Payments</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.icon} {method.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="all">All Status</option>
            {PAYMENT_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
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

      {/* Sales Chart - FIXED: Removed the orgId prop */}
      <div className="mt-6 px-4 md:px-0">
      <SalesChart orgId={organization?.id || ''} />
      </div>

      {/* Sales Table - Mobile Card View */}
      <div className="md:hidden mt-4 px-4">
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const paymentMethod = PAYMENT_METHODS.find(m => m.value === sale.payment_method);
            
            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-4 shadow-sm border"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{sale.item_name}</h3>
                    {sale.customer_name && (
                      <p className="text-xs text-gray-500">{sale.customer_name}</p>
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
                    <p className="text-sm">
                      {paymentMethod?.icon} {paymentMethod?.label || sale.payment_method}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-sm">{sale.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unit Price</p>
                    <p className="text-sm">₦{sale.unit_price?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(sale.payment_status)}`}>
                    {sale.payment_status?.replace('_', ' ')}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDuplicateClick(sale)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditClick(sale)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(sale.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-3">💰</p>
              <p className="text-gray-600 font-medium">No sales found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || dateFilter !== 'all' || paymentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Record your first sale'}
              </p>
              {(search || dateFilter !== 'all' || paymentFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setDateFilter('month');
                    setPaymentFilter('all');
                    setStatusFilter('all');
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => {
                  const paymentMethod = PAYMENT_METHODS.find(m => m.value === sale.payment_method);
                  
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{sale.item_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.customer_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{sale.quantity}</td>
                      <td className="px-4 py-3 text-sm">₦{sale.unit_price?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        ₦{sale.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {paymentMethod?.icon} {paymentMethod?.label || sale.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(sale.payment_status)}`}>
                          {sale.payment_status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicateClick(sale)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(sale.id)}
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

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-5xl mb-3">💰</p>
              <p className="text-gray-600 font-medium">No sales found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || dateFilter !== 'all' || paymentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Record your first sale'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaleFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSale(null);
        }}
        onSubmit={editingSale ? handleUpdateSale : handleAddSale}
        initialData={editingSale}
        inventoryItems={inventoryItems}
        mode={editingSale ? 'edit' : 'add'}
      />

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteSale}
        saleInfo={sales.find(s => s.id === showDeleteConfirm)}
      />

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          onClick={() => {
            setEditingSale(null);
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}