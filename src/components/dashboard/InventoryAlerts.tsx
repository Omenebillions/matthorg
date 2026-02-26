// /home/user/matthorg/src/app/[subdomain]/dashboard/components/InventoryAlerts.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface InventoryAlertsProps {
  lowStock: any[];
}

export default function InventoryAlerts({ lowStock }: InventoryAlertsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Low Stock Alerts</h3>
        <Link href="/inventory" className="text-sm text-blue-600 hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {lowStock.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium">{item.item_name}</p>
              <p className="text-xs text-gray-600">SKU: {item.sku || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-red-600 font-bold">{item.quantity} left</p>
              <p className="text-xs text-gray-500">
                Min: {item.min_stock || 10}
              </p>
            </div>
          </div>
        ))}

        {lowStock.length === 0 && (
          <p className="text-gray-500 text-center py-4">All stock levels are healthy</p>
        )}
      </div>

      <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        + Add Stock
      </button>
    </motion.div>
  );
}