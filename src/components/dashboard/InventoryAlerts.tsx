// /home/user/matthorg/src/components/dashboard/InventoryAlerts.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";

interface InventoryItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  reorder_point?: number;
  reorder_quantity?: number;
  listing_type: 'sale' | 'lease';
  category?: string;
  supplier_id?: string;
  status: string;
}

interface InventoryAlertsProps {
  organizationId: string;
  lowStockThreshold?: number;
}

type AlertType = 'low_stock' | 'out_of_stock' | 'expiring' | 'reorder';

interface AlertItem extends InventoryItem {
  alertType: AlertType;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export default function InventoryAlerts({ 
  organizationId, 
  lowStockThreshold = 5 
}: InventoryAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertType | 'all'>('all');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const supabase = createClient();

  // Live inventory data
  const { data: inventory = [], isLive } = useRealtime<InventoryItem>(
    { table: 'inventory', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Generate alerts based on inventory data
  const generateAlerts = (): AlertItem[] => {
    const alerts: AlertItem[] = [];

    inventory.forEach(item => {
      // Out of stock alerts (HIGH priority)
      if (item.quantity === 0) {
        alerts.push({
          ...item,
          alertType: 'out_of_stock',
          message: `${item.item_name} is out of stock`,
          priority: 'high'
        });
      }
      // Low stock alerts (MEDIUM priority)
      else if (item.quantity <= lowStockThreshold) {
        alerts.push({
          ...item,
          alertType: 'low_stock',
          message: `${item.item_name} is low (${item.quantity} left)`,
          priority: 'medium'
        });
      }
      // Reorder point alerts (MEDIUM priority)
      else if (item.reorder_point && item.quantity <= item.reorder_point) {
        alerts.push({
          ...item,
          alertType: 'reorder',
          message: `${item.item_name} has reached reorder point`,
          priority: 'medium'
        });
      }
    });

    return alerts;
  };

  const allAlerts = generateAlerts();
  
  // Filter alerts based on selection
  const filteredAlerts = selectedAlert === 'all' 
    ? allAlerts 
    : allAlerts.filter(a => a.alertType === selectedAlert);

  // Group by priority
  const highPriorityAlerts = filteredAlerts.filter(a => a.priority === 'high');
  const mediumPriorityAlerts = filteredAlerts.filter(a => a.priority === 'medium');

  // Handle restock
  const handleRestock = async () => {
    if (!selectedItem || restockQuantity <= 0) return;
    
    setProcessing(true);
    const newQuantity = selectedItem.quantity + restockQuantity;
    
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', selectedItem.id);

    if (!error) {
      setShowRestockModal(false);
      setSelectedItem(null);
      setRestockQuantity(0);
    }
    setProcessing(false);
  };

  // Handle quick order
  const createPurchaseOrder = async (item: InventoryItem) => {
    // Navigate to purchase order creation
    window.location.href = `/dashboard/purchases/new?item=${item.id}&quantity=${item.reorder_quantity || 10}`;
  };

  // Alert type counts
  const alertCounts = {
    low_stock: allAlerts.filter(a => a.alertType === 'low_stock').length,
    out_of_stock: allAlerts.filter(a => a.alertType === 'out_of_stock').length,
    reorder: allAlerts.filter(a => a.alertType === 'reorder').length,
    total: allAlerts.length
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border p-6"
      >
        {/* Header with Live Status */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">Inventory Alerts</h3>
            {alertCounts.total > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                {alertCounts.total} alerts
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Connecting...'}</span>
            </div>
            <Link 
              href="/dashboard/inventory" 
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
        </div>

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
          <button
            onClick={() => setSelectedAlert('out_of_stock')}
            className={`px-3 py-1 text-xs rounded-full transition ${
              selectedAlert === 'out_of_stock'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Out of Stock ({alertCounts.out_of_stock})
          </button>
          <button
            onClick={() => setSelectedAlert('low_stock')}
            className={`px-3 py-1 text-xs rounded-full transition ${
              selectedAlert === 'low_stock'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            }`}
          >
            Low Stock ({alertCounts.low_stock})
          </button>
          <button
            onClick={() => setSelectedAlert('reorder')}
            className={`px-3 py-1 text-xs rounded-full transition ${
              selectedAlert === 'reorder'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Reorder ({alertCounts.reorder})
          </button>
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
                className={`p-3 rounded-lg border-l-4 ${
                  item.alertType === 'out_of_stock'
                    ? 'border-red-500 bg-red-50'
                    : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.item_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                        {item.alertType === 'out_of_stock' ? '🔴' : '🟡'} {item.alertType.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-1">{item.message}</p>
                    
                    {/* SKU & Category */}
                    <div className="flex gap-3 mt-2 text-xs text-gray-600">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      {item.category && <span>Category: {item.category}</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowRestockModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        + Add Stock
                      </button>
                      <button
                        onClick={() => createPurchaseOrder(item)}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition"
                      >
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
                className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.item_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                        {item.alertType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                    {item.sku && (
                      <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 font-bold">{item.quantity}</div>
                    <button 
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRestockModal(true);
                      }}
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      Update
                    </button>
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
              <p className="text-gray-400 text-5xl mb-3">✅</p>
              <p className="text-gray-600 font-medium">All clear!</p>
              <p className="text-sm text-gray-500 mt-1">No {selectedAlert !== 'all' ? selectedAlert.replace('_', ' ') : ''} alerts</p>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/purchases/new"
            className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm text-center transition"
          >
            + Create PO
          </Link>
          <Link
            href="/dashboard/inventory/add"
            className="py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm text-center transition"
          >
            + Add Product
          </Link>
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
              <h3 className="text-lg font-bold mb-4">Restock Item</h3>
              
              <div className="mb-4">
                <p className="font-medium">{selectedItem.item_name}</p>
                <p className="text-sm text-gray-600">Current stock: {selectedItem.quantity}</p>
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
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                  min="1"
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRestock}
                  disabled={processing || restockQuantity <= 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {processing ? 'Updating...' : 'Update Stock'}
                </button>
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}