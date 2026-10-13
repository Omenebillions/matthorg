import React, { useState } from 'react';
import { FollowUp, Quote, Lead, Invoice, BusinessProfile } from '../types';
import { Clock, Calendar, MessageCircle, X, Check, ArrowRight, Trash2, Phone, Mail } from 'lucide-react';
import { formatCurrency, formatDate, buildWhatsAppLink, createFollowUpWhatsAppText } from '../utils/formatters';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: Quote | null;
  lead?: Lead | null;
  invoice?: Invoice | null;
  existingFollowUp?: FollowUp | null;
  business: BusinessProfile;
  onSaveFollowUp: (followUp: FollowUp) => void;
  onDeleteFollowUp?: (id: string) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  quote,
  lead,
  invoice,
  existingFollowUp,
  business,
  onSaveFollowUp,
  onDeleteFollowUp,
}) => {
  if (!isOpen) return null;

  const getPresetDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };

  const [reminderDate, setReminderDate] = useState(
    existingFollowUp?.reminder_date || getPresetDate(3)
  );
  const [channel, setChannel] = useState<'whatsapp' | 'call' | 'email' | 'sms'>(
    existingFollowUp?.channel || 'whatsapp'
  );
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    existingFollowUp?.priority || 'high'
  );
  const [notes, setNotes] = useState(existingFollowUp?.notes || '');
  const [isSaved, setIsSaved] = useState(false);

  const defaultTitle = existingFollowUp?.title ||
    (quote ? `Follow-up on Quote ${quote.quote_number}` :
     lead ? `Follow-up with Lead ${lead.customer_name}` :
     invoice ? `Payment Reminder for Inv ${invoice.invoice_number}` :
     'Client Follow-Up');

  const [customTitle, setCustomTitle] = useState(defaultTitle);

  const amount = existingFollowUp?.amount || quote?.total || invoice?.total || (lead ? (lead.estimated_value || 0) : 0);
  const customerName = existingFollowUp?.customer_name || quote?.customer_name || lead?.customer_name || invoice?.customer_name || 'Valued Customer';
  const customerWhatsapp = existingFollowUp?.customer_whatsapp || quote?.customer_whatsapp || lead?.whatsapp || invoice?.customer_whatsapp || quote?.customer_phone || lead?.phone || '';
  const customerPhone = existingFollowUp?.customer_phone || quote?.customer_phone || lead?.phone || invoice?.customer_phone || '';

  const handleSave = () => {
    const fu: FollowUp = {
      id: existingFollowUp?.id || 'fu_' + Date.now(),
      quote_id: quote?.id || existingFollowUp?.quote_id || '',
      quote_number: quote?.quote_number || existingFollowUp?.quote_number || '',
      lead_id: lead?.id || existingFollowUp?.lead_id || '',
      lead_number: lead?.lead_number || existingFollowUp?.lead_number || '',
      invoice_id: invoice?.id || existingFollowUp?.invoice_id || '',
      invoice_number: invoice?.invoice_number || existingFollowUp?.invoice_number || '',
      customer_id: quote?.customer_id || lead?.customer_id || invoice?.customer_id || existingFollowUp?.customer_id || '',
      customer_name: customerName,
      customer_whatsapp: customerWhatsapp,
      customer_phone: customerPhone,
      title: customTitle,
      amount,
      reminder_date: reminderDate,
      status: existingFollowUp?.status || 'pending',
      priority,
      channel,
      notes,
      created_at: existingFollowUp?.created_at || new Date().toISOString(),
    };

    onSaveFollowUp(fu);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  const handleWhatsAppNow = () => {
    const text = createFollowUpWhatsAppText(
      customerName,
      business.business_name,
      quote?.quote_number || existingFollowUp?.quote_number || 'Quotation',
      customTitle,
      formatCurrency(amount, business.currency)
    );
    const link = buildWhatsAppLink(customerWhatsapp, text);
    window.open(link, '_blank');
  };

  const handleDelete = () => {
    if (existingFollowUp && onDeleteFollowUp) {
      if (window.confirm('Are you sure you want to remove this follow-up reminder?')) {
        onDeleteFollowUp(existingFollowUp.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C] animate-in zoom-in-95 my-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-white flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B192C]">
                {existingFollowUp ? 'Edit Follow-Up Reminder' : 'Schedule Deal Follow-Up'}
              </h3>
              <p className="text-[11px] text-[#5B6D85]">
                {customerName} {amount > 0 ? `• ${formatCurrency(amount, business.currency)}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5B6D85] hover:text-[#0B192C] p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1">Follow-Up Title / Purpose</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-xs text-[#0B192C] font-semibold focus:border-[#3D74D9] focus:outline-none"
              placeholder="e.g. Check on solar quotation approval"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-2">When should we remind you?</label>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(1))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center font-bold ${
                  reminderDate === getPresetDate(1)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9]'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(3))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center font-bold ${
                  reminderDate === getPresetDate(3)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9]'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(7))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center font-bold ${
                  reminderDate === getPresetDate(7)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9]'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                Next Week
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5B6D85] font-medium shrink-0">Custom Date:</span>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs text-[#0B192C] font-mono focus:border-[#3D74D9] focus:outline-none"
              />
            </div>
          </div>

          {/* Follow-up Channel */}
          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1.5">Action Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
                { id: 'call' as const, label: 'Phone Call', icon: Phone, color: 'text-blue-600' },
                { id: 'email' as const, label: 'Email', icon: Mail, color: 'text-purple-600' },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      channel === c.id
                        ? 'border-[#3D74D9] bg-blue-50 text-[#0B192C]'
                        : 'border-[#CBD5E1] bg-white text-[#5B6D85] hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1">Follow-Up Strategy & Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Confirm if they need extra battery inverter capacity, or if board approval has been signed..."
              className="w-full rounded-xl bg-white border border-[#CBD5E1] p-2.5 text-xs text-[#0B192C] placeholder-[#8F9FB5] focus:border-[#3D74D9] focus:outline-none"
            />
          </div>

          {customerWhatsapp && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-between">
              <span className="text-xs text-[#5B6D85]">Need to message now?</span>
              <button
                type="button"
                onClick={handleWhatsAppNow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] hover:text-emerald-700 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Now</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between">
          {existingFollowUp && onDeleteFollowUp ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[#5B6D85] hover:text-[#0B192C] transition font-semibold"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2 text-xs font-bold shadow-md transition active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Scheduled!' : 'Save Follow-Up'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
