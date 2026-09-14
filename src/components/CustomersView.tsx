import React, { useState } from 'react';
import { Customer, Quote, Invoice, BusinessProfile } from '../types';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/formatters';

interface CustomersViewProps {
  customers: Customer[];
  quotes: Quote[];
  invoices: Invoice[];
  business: BusinessProfile;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onNewQuoteForCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  quotes,
  invoices,
  business,
  onSaveCustomer,
  onDeleteCustomer,
  onNewQuoteForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.whatsapp.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setEmail(c.email);
    setAddress(c.address);
    setNotes(c.notes);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customerObj: Customer = {
      id: editingCustomer?.id || 'cust_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      created_at: editingCustomer?.created_at || new Date().toISOString(),
    };

    onSaveCustomer(customerObj);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white">Customers ({customers.length})</h1>
          <p className="text-xs text-[#5B6D85] mt-0.5">
            Manage your client contacts, project addresses, and communication history.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, phone number, or address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E9F0] text-xs text-white placeholder-[#8C8178] focus:outline-none focus:border-[#0B192C] transition"
        />
      </div>

      {/* Customers List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-[#F4F7FB] rounded-2xl border border-dashed border-[#E5E9F0] space-y-3">
          <Users className="w-8 h-8 mx-auto text-[#61554C]" />
          <div>No customer contacts found.</div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => {
            const customerQuotes = quotes.filter((q) => q.customer_id === c.id || q.customer_name === c.name);
            const customerInvoices = invoices.filter((i) => i.customer_id === c.id || i.customer_name === c.name);

            const initials = c.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={c.id}
                className="group rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] hover:border-[#D1D8E5] p-3.5 flex flex-col justify-between transition-all duration-200 shadow-sm"
              >
                {/* Upper preview area */}
                <div className="relative w-full h-28 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-[#E5E9F0] flex items-center justify-center overflow-hidden mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-[#3D74D9] text-sm group-hover:scale-105 transition">
                    {initials || <Users className="w-5 h-5 text-[#3D74D9]" />}
                  </div>

                  {/* Top-right pill badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#5B6D85] border border-[#E5E9F0] shadow-xs">
                      {customerQuotes.length}Q • {customerInvoices.length}I
                    </span>
                  </div>

                  {/* Action buttons (Edit & Delete) top-left */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg bg-white/90 text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0] transition shadow-xs"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete customer ${c.name}?`)) {
                          onDeleteCustomer(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/90 text-[#5B6D85] hover:text-rose-600 border border-[#E5E9F0] transition shadow-xs"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-bold text-[#0B192C] group-hover:text-[#3D74D9] transition truncate">
                    {c.name}
                  </h3>

                  <div className="space-y-1 text-xs text-[#5B6D85]">
                    {c.whatsapp && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MessageCircle className="w-3 h-3 text-[#25D366] shrink-0" />
                        <span className="text-[11px]">{c.whatsapp}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-[#8F9FB5] shrink-0" />
                        <span className="text-[11px] truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-[#8F9FB5] shrink-0" />
                        <span className="text-[11px] truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="pt-3 mt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                  <a
                    href={buildWhatsAppLink(c.whatsapp || c.phone, `Hello ${c.name}, greeting from ${business.business_name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#25D366] hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </a>

                  <button
                    onClick={() => onNewQuoteForCustomer(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-xs font-bold shadow-sm shadow-[#0B192C]/20 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Quote</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
              <h3 className="text-base font-bold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5B6D85] hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="my-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alhaji Mustapha / Grace Okafor"
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">WhatsApp Number *</label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3.5 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Delivery / Project Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Estate, City, State"
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] p-2.5 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special preferences, electrical load details, key contact person..."
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] p-2.5 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#5B6D85] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
