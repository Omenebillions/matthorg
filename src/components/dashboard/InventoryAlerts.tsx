// /home/user/matthorg/src/components/dashboard/InventoryAlerts.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import {
  ExclamationTriangleIcon,
  BellAlertIcon,
  ShoppingCartIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CubeIcon,
  TruckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface InventoryItem {
  id: string;
  organization_id: string;
  item_name: string;
  sku?: string | null;
  quantity: number;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  listing_type: 'sale' | 'lease' | 'both';
  category?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  status: 'active' | 'inactive';
  location?: string | null;
  last_ordered?: string | null;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  lead_time?: number;
}

interface InventoryAlertsProps {
  organizationId: string;
  lowStockThreshold?: number;
  onAlertAction?: () => void;
}

type AlertType = 'low_stock' | 'out_of_stock' | 'expiring' | 'reorder' | 'inactive';

interface AlertItem extends InventoryItem {
  alertType: AlertType;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  suggestedAction?: string;
}

// Loading skeleton
function AlertsSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Alert Badge Component
function AlertBadge({ type, count }: { type: AlertType; count: number }) {
  const config = {
    out_of_stock: { bg: 'bg-red-100', text: 'text-red-600', hover: 'hover:bg-red-200', icon: '🔴' },
    low_stock: { bg: 'bg-yellow-100', text: 'text-yellow-600', hover: 'hover:bg-yellow-200', icon: '🟡' },
    reorder: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-200', icon: '📦' },
    expiring: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-200', icon: '⏰' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', hover: 'hover:bg-gray-200', icon: '⚪' },
  };

  const cfg = config[type] || config.inactive;

  return (
    <button
      className={`px-3 py-1 text-xs rounded-full transition ${cfg.bg} ${cfg.text} ${cfg.hover} flex items-center gap-1`}
    >
      <span>{cfg.icon}</span>
      <span className="capitalize">{type.replace('_', ' ')}</span>
      {count > 0 && <span className="ml-1 font-bold">({count})</span>}
    </button>
  );
}

export default function InventoryAlerts({ 
  organizationId, 
  lowStockThreshold = 5,
  onAlertAction 
}: InventoryAlertsProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | 'all'>('all');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch inventory and suppliers
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (inventoryError) throw inventoryError;
      setInventory(inventoryData || []);

      // Fetch suppliers
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, email, phone, lead_time')
        .eq('organization_id', organizationId);

      if (supplierError) throw supplierError;
      setSuppliers(supplierData || []);

      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      showToast(error.message || 'Failed to load inventory alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [organizationId]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('inventory-alerts')
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

    // Also listen for supplier updates
    const supplierChannel = supabase
      .channel('supplier-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          fetchData(); // Refresh suppliers
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(supplierChannel);
    };
  }, [organizationId]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setInventory(prev => [payload.new, ...prev]);
        showToast(`New item added: ${payload.new.item_name}`, 'success');
        break;
      case 'UPDATE':
        setInventory(prev => 
          prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item)
        );
        // Check if this update affects alerts
        if (payload.new.quantity <= lowStockThreshold && payload.old.quantity > lowStockThreshold) {
          showToast(`⚠️ ${payload.new.item_name} is now low stock`, 'warning');
        }
        break;
      case 'DELETE':
        setInventory(prev => prev.filter(item => item.id !== payload.old.id));
        showToast('Item removed from inventory', 'info');
        break;
    }
    setLastUpdated(new Date());
    if (onAlertAction) onAlertAction();
  };

  // Generate alerts based on inventory data
  const alerts = useMemo((): AlertItem[] => {
    const items: AlertItem[] = [];

    inventory.forEach(item => {
      // Only active items
      if (item.status !== 'active') {
        items.push({
          ...item,
          alertType: 'inactive',
          message: `${item.item_name} is inactive`,
          priority: 'low',
          actionRequired: false,
        });
        return;
      }

      // Out of stock alerts (HIGH priority)
      if (item.quantity === 0) {
        items.push({
          ...item,
          alertType: 'out_of_stock',
          message: `${item.item_name} is out of stock`,
          priority: 'high',
          actionRequired: true,
          suggestedAction: 'Create purchase order'
        });
      }
      // Low stock alerts (MEDIUM priority)
      else if (item.quantity <= lowStockThreshold) {
        items.push({
          ...item,
          alertType: 'low_stock',
          message: `${item.item_name} is low (${item.quantity} left)`,
          priority: 'medium',
          actionRequired: true,
          suggestedAction: 'Reorder soon'
        });
      }
      // Reorder point alerts (MEDIUM priority)
      else if (item.reorder_point && item.quantity <= item.reorder_point) {
        items.push({
          ...item,
          alertType: 'reorder',
          message: `${item.item_name} has reached reorder point (${item.quantity} left)`,
          priority: 'medium',
          actionRequired: true,
          suggestedAction: `Order ${item.reorder_quantity || 10} units`
        });
      }
    });

    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [inventory, lowStockThreshold]);

  // Filter alerts based on selection
  const filteredAlerts = useMemo(() => {
    return selectedAlert === 'all' 
      ? alerts 
      : alerts.filter(a => a.alertType === selectedAlert);
  }, [alerts, selectedAlert]);

  // Group by priority
  const highPriorityAlerts = filteredAlerts.filter(a => a.priority === 'high');
  const mediumPriorityAlerts = filteredAlerts.filter(a => a.priority === 'medium');
  const lowPriorityAlerts = filteredAlerts.filter(a => a.priority === 'low');

  // Alert type counts
  const alertCounts = useMemo(() => ({
    low_stock: alerts.filter(a => a.alertType === 'low_stock').length,
    out_of_stock: alerts.filter(a => a.alertType === 'out_of_stock').length,
    reorder: alerts.filter(a => a.alertType === 'reorder').length,
    expiring: alerts.filter(a => a.alertType === 'expiring').length,
    inactive: alerts.filter(a => a.alertType === 'inactive').length,
    total: alerts.length,
    actionable: alerts.filter(a => a.actionRequired).length,
  }), [alerts]);

  // Handle restock
  const handleRestock = async () => {
    if (!selectedItem || restockQuantity <= 0) return;
    
    setProcessing(true);
    const newQuantity = selectedItem.quantity + restockQuantity;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      showToast(`Stock updated for ${selectedItem.item_name}`, 'success');
      setShowRestockModal(false);
      setSelectedItem(null);
      setRestockQuantity(0);
      
    } catch (error: any) {
      console.error('Error updating stock:', error);
      showToast(error.message || 'Failed to update stock', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'reorder' | 'restock') => {
    if (selectedItems.length === 0) return;
    
    setProcessing(true);
    
    try {
      if (action === 'reorder') {
        // Create purchase orders for selected items
        window.location.href = `/dashboard/purchases/bulk?items=${selectedItems.join(',')}`;
      } else {
        // Restock selected items
        // This would open a bulk restock modal
        setShowBulkActionModal(false);
      }
      
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      showToast(error.message || 'Failed to perform bulk action', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle item selection for bulk actions
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Get supplier name
  const getSupplierName = (supplierId?: string | null) => {
    if (!supplierId) return null;
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name;
  };

  if (loading) {
    return <AlertsSkeleton />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border p-6"
      >
        {/* Header with Live Status */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold">Inventory Alerts</h3>
            {alertCounts.total > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                {alertCounts.total} alert{alertCounts.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 hidden sm:inline">
                {isLive ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            {/* Bulk Actions (when items selected) */}
            {selectedItems.length > 0 && (
              <button
                onClick={() => setShowBulkActionModal(true)}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
              >
                Bulk Actions ({selectedItems.length})
              </button>
            )}

            <Link 
              href="/dashboard/inventory" 
              className="text-sm text-blue-600 hover:underline"
            >
              Manage Inventory
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        {alertCounts.actionable > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              {alertCounts.actionable} item{alertCounts.actionable !== 1 ? 's' : ''} require attention
            </p>
          </div>
        )}

        {/* Alert Type Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedAlert('all')}
            className={`px-3 py-1 text-xs rounded-full transition ${
              selectedAlert === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({alertCounts.total})
          </button>
          <AlertBadge type="out_of_stock" count={alertCounts.out_of_stock} />
          <AlertBadge type="low_stock" count={alertCounts.low_stock} />
          <AlertBadge type="reorder" count={alertCounts.reorder} />
          {alertCounts.inactive > 0 && (
            <AlertBadge type="inactive" count={alertCounts.inactive} />
          )}
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          <AnimatePresence>
            {/* High Priority Alerts */}
            {highPriorityAlerts.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.alertType}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Selection Checkbox for bulk actions */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className={`pl-8 p-3 rounded-lg border-l-4 ${
                  item.alertType === 'out_of_stock'
                    ? 'border-red-500 bg-red-50'
                    : item.alertType === 'low_stock'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.item_name}</span>
                        <span className={`text-xs px-2 py-0.5 bg-white rounded-full`}>
                          {item.alertType.replace('_', ' ')}
                        </span>
                        {item.sku && (
                          <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                        )}
                      </div>
                      
                      <p className="text-sm mt-1">{item.message}</p>
                      
                      {/* Additional Details */}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                        {item.category && (
                          <span>Category: {item.category}</span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <CubeIcon className="w-3 h-3" />
                            {item.location}
                          </span>
                        )}
                        {item.supplier_id && getSupplierName(item.supplier_id) && (
                          <span className="flex items-center gap-1">
                            <TruckIcon className="w-3 h-3" />
                            {getSupplierName(item.supplier_id)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setRestockQuantity(item.reorder_quantity || 10);
                            setShowRestockModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <PlusIcon className="w-3 h-3" />
                          Add Stock
                        </button>
                        <button
                          onClick={() => window.location.href = `/dashboard/purchases/new?item=${item.id}&quantity=${item.reorder_quantity || 10}`}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition flex items-center gap-1"
                        >
                          <ShoppingCartIcon className="w-3 h-3" />
                          Create PO
                        </button>
                      </div>
                    </div>

                    {/* Quantity Badge */}
                    <div className="text-right ml-4">
                      <div className={`text-xl font-bold ${
                        item.quantity === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {item.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.reorder_point ? `Min: ${item.reorder_point}` : 'Low stock'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Medium Priority Alerts */}
            {mediumPriorityAlerts.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.alertType}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="pl-8 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.item_name}</span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                          {item.alertType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                      {item.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                      {item.suggestedAction && (
                        <p className="text-xs text-blue-600 mt-1">{item.suggestedAction}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-gray-600 font-bold">{item.quantity}</div>
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          setRestockQuantity(item.reorder_quantity || 10);
                          setShowRestockModal(true);
                        }}
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Low Priority Alerts */}
            {lowPriorityAlerts.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.alertType}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="pl-8 p-3 bg-white border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">{item.item_name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {item.alertType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredAlerts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">All clear!</p>
              <p className="text-sm text-gray-500 mt-1">
                No {selectedAlert !== 'all' ? selectedAlert.replace('_', ' ') : ''} alerts
              </p>
            </motion.div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/purchases/new"
            className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm text-center transition flex items-center justify-center gap-1"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            Create PO
          </Link>
          <Link
            href="/dashboard/inventory/add"
            className="py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm text-center transition flex items-center justify-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        {/* Last Updated */}
        <div className="mt-3 text-xs text-gray-400 flex justify-between items-center">
          <span>Last updated: {lastUpdated.toLocaleString()}</span>
          {selectedItems.length > 0 && (
            <span>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
          )}
        </div>
      </motion.div>

      {/* Restock Modal */}
      <AnimatePresence>
        {showRestockModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRestockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Restock Item</h3>
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedItem.item_name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-500">Current stock:</span>
                    <span className="ml-2 font-bold">{selectedItem.quantity}</span>
                  </div>
                  {selectedItem.reorder_point && (
                    <div>
                      <span className="text-gray-500">Reorder at:</span>
                      <span className="ml-2 font-bold">{selectedItem.reorder_point}</span>
                    </div>
                  )}
                </div>
                {selectedItem.sku && (
                  <p className="text-xs text-gray-500 mt-1">SKU: {selectedItem.sku}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Quantity to add
                </label>
                <input
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRestock}
                  disabled={processing || restockQuantity <= 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Stock'
                  )}
                </button>
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Action Modal */}
      <AnimatePresence>
        {showBulkActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowBulkActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Bulk Actions</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </p>

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => handleBulkAction('reorder')}
                  className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <p className="font-medium">Create Purchase Orders</p>
                  <p className="text-xs text-gray-500">Generate POs for selected items</p>
                </button>
                <button
                  onClick={() => handleBulkAction('restock')}
                  className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition"
                >
                  <p className="font-medium">Bulk Restock</p>
                  <p className="text-xs text-gray-500">Add stock to multiple items</p>
                </button>
              </div>

              <button
                onClick={() => setShowBulkActionModal(false)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}