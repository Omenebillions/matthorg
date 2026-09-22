import React, { useState } from 'react';
import { FollowUp, Quote, BusinessProfile } from '../types';
import { Clock, Calendar, MessageCircle, X, Check, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate, buildWhatsAppLink, createFollowUpWhatsAppText } from '../utils/formatters';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: Quote | null;
  existingFollowUp?: FollowUp | null;
  business: BusinessProfile;
  onSaveFollowUp: (followUp: FollowUp) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  quote,
  existingFollowUp,
  business,
  onSaveFollowUp,
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
  const [notes, setNotes] = useState(existingFollowUp?.notes || '');
  const [isSaved, setIsSaved] = useState(false);

  const title = existingFollowUp?.title || (quote ? `Quote ${quote.quote_number}` : 'Sales Follow-Up');
  const amount = existingFollowUp?.amount || quote?.total || 0;
  const customerName = existingFollowUp?.customer_name || quote?.customer_name || 'Customer';
  const customerWhatsapp = existingFollowUp?.customer_whatsapp || quote?.customer_whatsapp || quote?.customer_phone || '';

  const handleSave = () => {
    const fu: FollowUp = {
      id: existingFollowUp?.id || 'fu_' + Date.now(),
      quote_id: quote?.id || existingFollowUp?.quote_id || '',
      quote_number: quote?.quote_number || existingFollowUp?.quote_number || '',
      customer_id: quote?.customer_id || existingFollowUp?.customer_id || '',
      customer_name: customerName,
      customer_whatsapp: customerWhatsapp,
      title,
      amount,
      reminder_date: reminderDate,
      status: existingFollowUp?.status || 'pending',
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
      title,
      formatCurrency(amount, business.currency)
    );
    const link = buildWhatsAppLink(customerWhatsapp, text);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C] animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B192C]/20 text-[#5B6D85] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Schedule Follow-Up</h3>
              <p className="text-[11px] text-[#5B6D85]">{customerName} • {formatCurrency(amount, business.currency)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5B6D85] hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B6D85] mb-2">When should we remind you?</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(1))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center ${
                  reminderDate === getPresetDate(1)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9] font-bold'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(3))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center ${
                  reminderDate === getPresetDate(3)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9] font-bold'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => setReminderDate(getPresetDate(7))}
                className={`py-2 px-2 text-xs rounded-xl border transition text-center ${
                  reminderDate === getPresetDate(7)
                    ? 'bg-blue-50 border-[#3D74D9] text-[#3D74D9] font-bold'
                    : 'bg-[#F4F7FB] border-[#E5E9F0] text-[#5B6D85] hover:bg-slate-100'
                }`}
              >
                Next Week
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5B6D85]">Custom Date:</span>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-1.5 text-xs text-white focus:border-[#0B192C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Follow-Up Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inquire if they need extra batteries, or if board approval is required..."
              className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] p-2.5 text-xs text-white focus:border-[#0B192C] focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] flex items-center justify-between">
            <span className="text-xs text-[#5B6D85]">Need to message now?</span>
            <button
              type="button"
              onClick={handleWhatsAppNow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:text-[#25D366]/80 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send WhatsApp Now</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-[#5B6D85] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Scheduled!' : 'Save Follow-Up'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
