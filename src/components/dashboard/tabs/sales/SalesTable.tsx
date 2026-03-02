// /home/user/matthorg/src/components/dashboard/tabs/sales/SalesTable.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SalesTableProps {
  sales: any[];
  loading: boolean;
  orgId: string;
}

export default function SalesTable({ sales, loading, orgId }: SalesTableProps) {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      sale.product?.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      sale.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;
    
    return matchesSearch && matchesPayment;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Transaction ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Payment</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  {format(new Date(sale.created_at), 'MMM d, yyyy')}
                  <br />
                  <span className="text-xs text-gray-500">
                    {format(new Date(sale.created_at), 'h:mm a')}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-sm">
                  {sale.id.slice(0,8)}...
                </td>
                <td className="px-6 py-4">
                  {sale.product?.item_name || '—'}
                </td>
                <td className="px-6 py-4">
                  {sale.customer_name || 'Guest'}
                </td>
                <td className="px-6 py-4 text-center">
                  {sale.quantity || 1}
                </td>
                <td className="px-6 py-4 font-medium">
                  ₦{sale.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sale.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                    sale.payment_method === 'card' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {sale.payment_method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSales.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No sales found
        </div>
      )}
    </div>
  );
}