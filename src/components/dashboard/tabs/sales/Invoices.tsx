// /home/user/matthorg/src/components/dashboard/tabs/sales/Invoices.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  PrinterIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  payment_method?: string;
  payment_date?: string;
  created_at: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoicesProps {
  orgId: string;
}

export default function Invoices({ orgId }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  const supabase = createClient();

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchInvoices();
  }, [orgId]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    setInvoices(data || []);
    
    // Calculate stats
    const total = data?.reduce((sum, inv) => sum + inv.total, 0) || 0;
    const paid = data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) || 0;
    const pending = data?.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + inv.total, 0) || 0;
    const overdue = data?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0) || 0;

    setStats({ total, paid, pending, overdue });
    setLoading(false);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_email?.toLowerCase().includes(search.toLowerCase())
  ).filter(inv => statusFilter === 'all' || inv.status === statusFilter);

  const CreateInvoiceModal = () => {
    const [form, setForm] = useState({
      customer_name: '',
      customer_email: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
      tax_rate: 7.5,
      discount: 0,
      notes: '',
    });

    const calculateItemAmount = (index: number, quantity: number, price: number) => {
      const newItems = [...form.items];
      newItems[index].quantity = quantity;
      newItems[index].unit_price = price;
      newItems[index].amount = quantity * price;
      setForm({ ...form, items: newItems });
    };

    const addItem = () => {
      setForm({
        ...form,
        items: [...form.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]
      });
    };

    const removeItem = (index: number) => {
      if (form.items.length > 1) {
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
      }
    };

    const calculateSubtotal = () => {
      return form.items.reduce((sum, item) => sum + item.amount, 0);
    };

    const calculateTax = () => {
      return calculateSubtotal() * (form.tax_rate / 100);
    };

    const calculateTotal = () => {
      return calculateSubtotal() + calculateTax() - form.discount;
    };

    const generateInvoiceNumber = () => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = String(invoices.length + 1).padStart(4, '0');
      return `INV-${year}${month}-${count}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);

      const invoiceData = {
        organization_id: orgId,
        invoice_number: generateInvoiceNumber(),
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        issue_date: form.issue_date,
        due_date: form.due_date,
        items: form.items,
        subtotal: calculateSubtotal(),
        tax_rate: form.tax_rate,
        tax_amount: calculateTax(),
        discount: form.discount,
        total: calculateTotal(),
        status: 'draft',
        notes: form.notes || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('invoices')
        .insert(invoiceData);

      if (!error) {
        setShowCreateModal(false);
        showNotif('success', 'Invoice created successfully');
        fetchInvoices();
      } else {
        showNotif('error', error.message);
      }
      setProcessing(false);
    };

    return (
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Invoice">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Customer Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({...form, customer_name: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Customer Email</label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm({...form, customer_email: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({...form, issue_date: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({...form, due_date: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            {form.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[index].description = e.target.value;
                    setForm({...form, items: newItems});
                  }}
                  className="col-span-6 p-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => calculateItemAmount(index, parseFloat(e.target.value), item.unit_price)}
                  className="col-span-2 p-2 border rounded-lg"
                  min="1"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) => calculateItemAmount(index, item.quantity, parseFloat(e.target.value))}
                  className="col-span-2 p-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
                <div className="col-span-1 p-2 text-right font-medium">
                  ₦{item.amount.toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="col-span-1 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">₦{calculateSubtotal().toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Tax Rate (%):</span>
              <input
                type="number"
                value={form.tax_rate}
                onChange={(e) => setForm({...form, tax_rate: parseFloat(e.target.value)})}
                className="w-20 p-1 border rounded text-right"
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Tax Amount:</span>
              <span>₦{calculateTax().toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Discount:</span>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({...form, discount: parseFloat(e.target.value)})}
                className="w-24 p-1 border rounded text-right"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₦{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
              className="w-full p-2 border rounded-lg"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {processing ? 'Creating...' : 'Create Invoice'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  const ViewInvoiceModal = ({ invoice }: { invoice: Invoice }) => {
    const [updating, setUpdating] = useState(false);

    const updateStatus = async (newStatus: string) => {
      setUpdating(true);
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          ...(newStatus === 'paid' ? { payment_date: new Date().toISOString() } : {})
        })
        .eq('id', invoice.id);

      if (!error) {
        showNotif('success', `Invoice marked as ${newStatus}`);
        setShowViewModal(false);
        fetchInvoices();
      }
      setUpdating(false);
    };

    return (
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Invoice ${invoice.invoice_number}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{invoice.customer_name}</p>
              {invoice.customer_email && (
                <p className="text-sm text-gray-600">{invoice.customer_email}</p>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
              invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
              invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {invoice.status.toUpperCase()}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Issue Date</p>
              <p className="font-medium">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-medium mb-2">Items</h4>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">₦{item.unit_price.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">₦{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₦{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
              <span>₦{invoice.tax_amount.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span>-₦{invoice.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total:</span>
              <span>₦{invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={() => updateStatus('sent')}
                  disabled={updating}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Send to Customer
                </button>
              </>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => updateStatus('paid')}
                disabled={updating}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <button
                onClick={() => updateStatus('cancelled')}
                disabled={updating}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center gap-2"
              >
                <XCircleIcon className="w-4 h-4" />
                Cancel
              </button>
            )}
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <PrinterIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
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
          className="bg-white rounded-xl p-6 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto"
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

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-gray-600">Total Invoiced</p>
            <p className="text-2xl font-bold text-blue-700">₦{stats.total.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-700">₦{stats.paid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">₦{stats.pending.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-700">₦{stats.overdue.toLocaleString()}</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Invoices</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Invoice
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Invoice #</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Issue Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{invoice.customer_name}</p>
                          {invoice.customer_email && (
                            <p className="text-xs text-gray-500">{invoice.customer_email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-red-600' : ''}>
                            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          ₦{invoice.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowViewModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800" title="Download">
                              <DocumentArrowDownIcon className="w-5 h-5" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800" title="Email">
                              <EnvelopeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredInvoices.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-5xl mb-4">🧾</p>
                  <p className="text-gray-600 font-medium">No invoices found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {search ? 'Try adjusting your search' : 'Create your first invoice'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal />
      {selectedInvoice && (
        <ViewInvoiceModal invoice={selectedInvoice} />
      )}
    </>
  );
}