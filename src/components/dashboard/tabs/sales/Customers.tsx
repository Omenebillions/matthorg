// /home/user/matthorg/src/components/dashboard/tabs/sales/Customers.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CustomersProps {
  orgId: string;
}

export default function Customers({ orgId }: CustomersProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const supabase = createClient();

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchCustomers();
  }, [orgId]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    // Also fetch their total spending from sales
    const customersWithSpending = await Promise.all(
      (data || []).map(async (customer) => {
        const { data: sales } = await supabase
          .from('sales')
          .select('amount')
          .eq('organization_id', orgId)
          .eq('customer_name', customer.name);
        
        const totalSpent = sales?.reduce((sum, s) => sum + s.amount, 0) || 0;
        const orderCount = sales?.length || 0;
        
        return {
          ...customer,
          total_spent: totalSpent,
          order_count: orderCount
        };
      })
    );

    setCustomers(customersWithSpending);
    setLoading(false);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const { error } = await supabase
      .from('customers')
      .insert({
        organization_id: orgId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null
      });

    if (!error) {
      setShowAddModal(false);
      setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      showNotif('success', 'Customer added successfully');
      fetchCustomers();
    } else {
      showNotif('error', error.message);
    }
    setProcessing(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Address</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Total Spent</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {customer.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.email && (
                      <p className="text-sm">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.address || '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                      {customer.order_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ₦{customer.total_spent?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-5xl mb-4">👥</p>
            <p className="text-gray-600 font-medium">No customers yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add your first customer to get started
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t">
          <p className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Add New Customer</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="+234 123 456 7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Customer's address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {processing ? 'Adding...' : 'Add Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
    </>
  );
}