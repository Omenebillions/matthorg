// /home/user/matthorg/src/app/[subdomain]/dashboard/components/QuickActions.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface QuickActionsProps {
  orgId: string;
}

export default function QuickActions({ orgId }: QuickActionsProps) {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Add Sale
  const AddSaleModal = () => {
    const [form, setForm] = useState({ amount: "", customer: "", payment_method: "cash" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const { error } = await supabase.from("sales").insert({
        organization_id: orgId,
        amount: parseFloat(form.amount),
        customer_name: form.customer || null,
        payment_method: form.payment_method,
        sale_date: new Date().toISOString(),
      });

      if (!error) {
        setShowSaleModal(false);
        window.location.reload();
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
            placeholder="Customer Name (Optional)"
            value={form.customer}
            onChange={(e) => setForm({...form, customer: e.target.value})}
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
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? "Adding..." : "Add Sale"}
          </button>
        </form>
      </Modal>
    );
  };

  // Add Expense
  const AddExpenseModal = () => {
    const [form, setForm] = useState({ amount: "", category: "", description: "" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const { error } = await supabase.from("expenses").insert({
        organization_id: orgId,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        expense_date: new Date().toISOString(),
      });

      if (!error) {
        setShowExpenseModal(false);
        window.location.reload();
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
            <option value="other">Other</option>
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </Modal>
    );
  };

  // Add Product
  const AddProductModal = () => {
    const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "", category: "" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const { error } = await supabase.from("inventory").insert({
        organization_id: orgId,
        item_name: form.name,
        sku: form.sku,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        category: form.category,
      });

      if (!error) {
        setShowProductModal(false);
        window.location.reload();
      }
      setLoading(false);
    };

    return (
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Add Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Name"
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
          <input
            type="number"
            placeholder="Price (₦)"
            value={form.price}
            onChange={(e) => setForm({...form, price: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({...form, category: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </Modal>
    );
  };

  // Add Staff
  const AddStaffModal = () => {
    const [form, setForm] = useState({ name: "", email: "", role: "staff", permissions: [] });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      // First, invite user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(form.email, {
        data: { 
          full_name: form.name,
          organization_id: orgId 
        }
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      // Then create staff profile
      const { error } = await supabase.from("staff_profiles").insert({
        id: authData.user.id,
        full_name: form.name,
        email: form.email,
        role: form.role,
        permissions: form.permissions,
        organization_id: orgId,
      });

      if (!error) {
        setShowStaffModal(false);
        alert("Invitation sent to " + form.email);
      }
      setLoading(false);
    };

    return (
      <Modal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} title="Add Staff">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({...form, role: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {loading ? "Sending..." : "Send Invitation"}
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
          className="bg-white rounded-xl p-6 max-w-md w-full"
        >
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          {children}
          <button onClick={onClose} className="mt-4 text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaleModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Sale
        </button>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          + Add Expense
        </button>
        <button
          onClick={() => setShowProductModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Product
        </button>
        <button
          onClick={() => setShowStaffModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Add Staff
        </button>
      </div>

      <AddSaleModal />
      <AddExpenseModal />
      <AddProductModal />
      <AddStaffModal />
    </>
  );
}
