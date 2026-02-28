// /home/user/matthorg/src/components/dashboard/QuickActions.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface QuickActionsProps {
  orgId: string;  // Still need orgId from session/context
}

export default function QuickActions({ orgId }: QuickActionsProps) {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const supabase = createClient();

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Sale Modal
  const AddSaleModal = () => {
    const [form, setForm] = useState({ 
      amount: "", 
      customer_name: "",
      payment_method: "cash",
      notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const { error } = await supabase.from("sales").insert({
        organization_id: orgId,
        amount: parseFloat(form.amount),
        customer_name: form.customer_name || null,
        payment_method: form.payment_method,
        notes: form.notes || null,
        sale_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (!error) {
        setShowSaleModal(false);
        setForm({ amount: "", customer_name: "", payment_method: "cash", notes: "" });
        showNotif('success', '✅ Sale added! Dashboard updating...');
      } else {
        console.error('Sale error:', error);
        showNotif('error', `❌ Error: ${error.message}`);
      }
      setLoading(false);
    };

    return (
      <Modal isOpen={showSaleModal} onClose={() => setShowSaleModal(false)} title="Add Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Amount (₦)"
            value={form.amount}
            onChange={(e) => setForm({...form, amount: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Customer Name"
            value={form.customer_name}
            onChange={(e) => setForm({...form, customer_name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <select
            value={form.payment_method}
            onChange={(e) => setForm({...form, payment_method: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
          <textarea
            placeholder="Notes (Optional)"
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Adding..." : "Add Sale"}
          </button>
        </form>
      </Modal>
    );
  };

  // Add Expense Modal
  const AddExpenseModal = () => {
    const [form, setForm] = useState({ 
      amount: "", 
      category: "", 
      description: "",
      vendor: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const { error } = await supabase.from("expenses").insert({
        organization_id: orgId,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        vendor: form.vendor || null,
        expense_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (!error) {
        setShowExpenseModal(false);
        setForm({ amount: "", category: "", description: "", vendor: "" });
        showNotif('success', '✅ Expense added! Dashboard updating...');
      } else {
        console.error('Expense error:', error);
        showNotif('error', `❌ Error: ${error.message}`);
      }
      setLoading(false);
    };

    return (
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Amount (₦)"
            value={form.amount}
            onChange={(e) => setForm({...form, amount: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({...form, category: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="">Select Category</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="salaries">Salaries</option>
            <option value="supplies">Supplies</option>
            <option value="marketing">Marketing</option>
            <option value="equipment">Equipment</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Vendor (Optional)"
            value={form.vendor}
            onChange={(e) => setForm({...form, vendor: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </Modal>
    );
  };

  // Add Product Modal (Simplified)
  const AddProductModal = () => {
    const [form, setForm] = useState({ 
      name: "", 
      sku: "", 
      sale_price: "", 
      lease_price: "",
      listing_type: "sale",
      quantity: "1", 
      category: "",
      description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const productData: any = {
        organization_id: orgId,
        item_name: form.name,
        sku: form.sku || null,
        listing_type: form.listing_type,
        quantity: parseInt(form.quantity),
        category: form.category || null,
        description: form.description || null,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      if (form.listing_type === 'sale') {
        productData.sale_price = parseFloat(form.sale_price);
      } else {
        productData.lease_price_monthly = parseFloat(form.lease_price);
      }
      
      const { error } = await supabase.from("inventory").insert(productData);

      if (!error) {
        setShowProductModal(false);
        setForm({ 
          name: "", sku: "", sale_price: "", lease_price: "",
          listing_type: "sale", quantity: "1", category: "", description: ""
        });
        showNotif('success', '✅ Product added! Dashboard updating...');
      } else {
        console.error('Product error:', error);
        showNotif('error', `❌ Error: ${error.message}`);
      }
      setLoading(false);
    };

    return (
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Add Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Name *"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          
          <input
            type="text"
            placeholder="SKU (Optional)"
            value={form.sku}
            onChange={(e) => setForm({...form, sku: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <textarea
            placeholder="Description (Optional)"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
          />

          <div className="flex gap-4 p-2 bg-gray-50 rounded-lg">
            <label className="flex items-center">
              <input
                type="radio"
                value="sale"
                checked={form.listing_type === 'sale'}
                onChange={(e) => setForm({...form, listing_type: e.target.value})}
                className="mr-2"
              />
              For Sale
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="lease"
                checked={form.listing_type === 'lease'}
                onChange={(e) => setForm({...form, listing_type: e.target.value})}
                className="mr-2"
              />
              For Lease
            </label>
          </div>

          {form.listing_type === 'sale' ? (
            <input
              type="number"
              placeholder="Sale Price (₦) *"
              value={form.sale_price}
              onChange={(e) => setForm({...form, sale_price: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
              min="0"
              step="0.01"
            />
          ) : (
            <input
              type="number"
              placeholder="Monthly Lease Price (₦) *"
              value={form.lease_price}
              onChange={(e) => setForm({...form, lease_price: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
              min="0"
              step="0.01"
            />
          )}

          <input
            type="number"
            placeholder="Quantity *"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
            min="0"
          />

          <input
            type="text"
            placeholder="Category (Optional)"
            value={form.category}
            onChange={(e) => setForm({...form, category: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </Modal>
    );
  };

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-6 max-w-md w-full relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          {children}
        </motion.div>
      </div>
    );
  };

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

      {/* Quick Actions Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowSaleModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>💰</span> Add Sale
        </button>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
        >
          <span>📤</span> Add Expense
        </button>
        <button
          onClick={() => setShowProductModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>📦</span> Add Product
        </button>
        <button
          onClick={() => setShowStaffModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <span>👥</span> Add Staff
        </button>
      </div>

      {/* Modals */}
      <AddSaleModal />
      <AddExpenseModal />
      <AddProductModal />
    </>
  );
}