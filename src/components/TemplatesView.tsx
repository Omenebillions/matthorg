import React, { useState } from 'react';
import { QuoteTemplate, QuoteTemplateItem, Product, BusinessProfile } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  X,
  Check,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface TemplatesViewProps {
  templates: QuoteTemplate[];
  products: Product[];
  business: BusinessProfile;
  onSaveTemplate: (template: QuoteTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: QuoteTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  products,
  business,
  onSaveTemplate,
  onDeleteTemplate,
  onUseTemplate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<QuoteTemplateItem[]>([]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setName('');
    setDescription('');
    setCategory('');
    setItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (t: QuoteTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setDescription(t.description);
    setCategory(t.category || '');
    setItems([...t.items]);
    setIsModalOpen(true);
  };

  const handleAddItem = (prod?: Product) => {
    setItems((prev) => [
      ...prev,
      {
        id: 'tmpl_it_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        product_id: prod?.id,
        name: prod?.name || '',
        description: prod?.description || '',
        quantity: 1,
        unit_price: prod?.default_price || 0,
        unit: prod?.unit || 'unit',
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof QuoteTemplateItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || items.length === 0) return;

    const tmpl: QuoteTemplate = {
      id: editingTemplate?.id || 'tmpl_' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || 'General Packages',
      items,
    };

    onSaveTemplate(tmpl);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9F0]">
        <div>
          <h1 className="text-xl font-bold text-[#0B192C]">Quote Templates ({templates.length})</h1>
          <p className="text-xs text-[#5B6D85] mt-0.5">
            Bundle standard products & services for 1-click quotation generation.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-white/50 rounded-2xl border border-dashed border-[#E5E9F0] space-y-3">
          <Layers className="w-8 h-8 mx-auto text-[#5B6D85]" />
          <div>No quotation templates configured yet.</div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => {
            const estimatedTotal = tmpl.items.reduce(
              (acc, it) => acc + it.quantity * it.unit_price,
              0
            );

            return (
              <div
                key={tmpl.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E9F0] hover:border-[#0B192C]/40 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F4F7FB] text-[#5B6D85] border border-[#E5E9F0]">
                        {tmpl.category || 'Package'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{tmpl.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(tmpl)}
                        className="p-1.5 text-[#5B6D85] hover:text-white rounded-lg hover:bg-[#F4F7FB] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete template ${tmpl.name}?`)) {
                            onDeleteTemplate(tmpl.id);
                          }
                        }}
                        className="p-1.5 text-[#5B6D85] hover:text-rose-400 rounded-lg hover:bg-[#F4F7FB] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tmpl.description && (
                    <p className="text-xs text-[#5B6D85]">{tmpl.description}</p>
                  )}

                  {/* Bundled items summary */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                      Bundled Items ({tmpl.items.length})
                    </div>
                    <ul className="space-y-1 text-xs text-[#5B6D85]">
                      {tmpl.items.map((it) => (
                        <li key={it.id} className="flex justify-between items-center text-[11px]">
                          <span>
                            • {it.name} <span className="text-[#5B6D85]">x{it.quantity}</span>
                          </span>
                          <span className="font-mono text-[#5B6D85]">
                            {formatCurrency(it.quantity * it.unit_price, business.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#5B6D85] block uppercase font-bold">Estimated Base Total</span>
                    <span className="font-mono text-base font-extrabold text-[#0B192C]">
                      {formatCurrency(estimatedTotal, business.currency)}
                    </span>
                  </div>

                  <button
                    onClick={() => onUseTemplate(tmpl)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
                  >
                    <span>Use in Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C] my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
              <h3 className="text-base font-bold text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Quote Template'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5B6D85] hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="my-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 5kVA Complete Residential Solar System"
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Category / Group</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Solar Packages"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Overview of this bundle"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Items in template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5B6D85]">Bundle Items ({items.length})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#5B6D85]">Quick Add:</span>
                    <select
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) handleAddItem(prod);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="bg-[#F4F7FB] border border-[#E5E9F0] rounded text-xs px-2 py-1 text-[#5B6D85]"
                    >
                      <option value="" disabled>
                        + Select from Catalogue
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.default_price, business.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] items-center"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          value={it.name}
                          onChange={(e) => handleUpdateItem(it.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full bg-white border border-[#E5E9F0] rounded px-2 py-1 text-xs text-[#0B192C] focus:border-[#3D74D9] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItem(it.id, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full bg-white border border-[#E5E9F0] rounded px-2 py-1 text-xs text-center text-[#0B192C] focus:border-[#3D74D9] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.unit_price}
                          onChange={(e) => handleUpdateItem(it.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-[#E5E9F0] rounded px-2 py-1 text-xs text-right text-[#0B192C] font-mono focus:border-[#3D74D9] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(it.id)}
                          className="text-[#5B6D85] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6D85] hover:text-[#0B192C] pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Item</span>
                </button>
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
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
