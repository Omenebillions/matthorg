// /home/user/matthorg/src/components/InventoryTable.tsx
"use client";

import { useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { createClient } from '@/utils/supabase/client';  // ✅ FIXED IMPORT

interface InventoryItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  sale_price?: number;
  lease_price_monthly?: number;
  listing_type: 'sale' | 'lease';
  status: 'active' | 'inactive';
  category?: string;
}

interface InventoryTableProps {
  organizationId: string;
}

export default function InventoryTable({ organizationId }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const supabase = createClient();

  // Live inventory data
  const { data: inventory = [], isLive } = useRealtime<InventoryItem>(
    { table: 'inventory', filter: `organization_id=eq.${organizationId}` },
    []
  );

  const filteredInventory = inventory.filter(item =>
    item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const updateQuantity = async (id: string, newQuantity: number) => {
    await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', id);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Inventory</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
              <span className="text-sm text-gray-600">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 w-full p-2 border rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{item.item_name}</td>
                <td className="p-3 text-sm">{item.sku || '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.listing_type === 'sale' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.listing_type}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {item.listing_type === 'sale' ? (
                    <span>₦{item.sale_price?.toLocaleString()}</span>
                  ) : (
                    <span>₦{item.lease_price_monthly?.toLocaleString()}/mo</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                    className="w-20 p-1 text-right border rounded"
                    min="0"
                  />
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.quantity === 0 ? 'bg-red-100 text-red-800' :
                    item.quantity < 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.quantity === 0 ? 'Out' :
                     item.quantity < 5 ? 'Low' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}