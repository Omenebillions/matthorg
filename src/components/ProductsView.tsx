import React, { useState } from 'react';
import { Product, BusinessProfile } from '../types';
import {
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  X,
  Check,
  Sparkles,
  Star,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  business: BusinessProfile;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  business,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('unit');
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');

  // Extract categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || (p.category || 'General') === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setUnit('unit');
    setDefaultPrice(0);
    setCategory('General');
    setSku('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setUnit(p.unit || 'unit');
    setDefaultPrice(p.default_price);
    setCategory(p.category || 'General');
    setSku(p.sku || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prodObj: Product = {
      id: editingProduct?.id || 'prod_' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      unit: unit.trim() || 'unit',
      default_price: defaultPrice,
      category: category.trim() || 'General',
      sku: sku.trim(),
    };

    onSaveProduct(prodObj);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E9F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Catalogue & Services ({products.length})</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#0B192C]/20 text-[#5B6D85] px-2 py-0.5 rounded-full border border-[#0B192C]/30">
              <Sparkles className="w-3 h-3 text-[#0B192C]" /> AI Synced
            </span>
          </div>
          <p className="text-xs text-[#5B6D85] mt-0.5">
            Save standard prices and descriptions. When creating quotes or using AI, these are prioritized automatically.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Product / Service</span>
        </button>
      </div>

      {/* Filter & Search Bar with Caramel Filter Accents */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalogue by name, SKU or specification..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E9F0] text-xs text-white placeholder-[#8C8178] focus:outline-none focus:border-[#0B192C] transition"
          />
        </div>

        {/* Categories Pills matching Shou Mei, Black Tea style */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-semibold ${
                selectedCategory === cat
                  ? 'bg-[#0B192C] text-white shadow-sm shadow-[#0B192C]/20'
                  : 'bg-white text-[#5B6D85] hover:text-white border border-[#E5E9F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Exact card representation matching the middle screen in the user image */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5B6D85] bg-[#F4F7FB] rounded-2xl border border-dashed border-[#E5E9F0] space-y-3">
          <Package className="w-8 h-8 mx-auto text-[#61554C]" />
          <div>No products found matching your search.</div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl bg-[#F4F7FB] border border-[#E5E9F0] hover:border-[#D1D8E5] p-3.5 flex flex-col justify-between transition-all duration-200 shadow-sm"
            >
              {/* Top Box: Image / Preview container with Category Pill badge and Rating */}
              <div className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-[#E5E9F0] flex items-center justify-center overflow-hidden mb-3">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-center p-3">
                    <Package className="w-9 h-9 mx-auto text-cyan-600 group-hover:scale-110 transition duration-300" />
                    <span className="text-[10px] font-mono text-[#5B6D85] mt-1 block">
                      {p.sku ? `SKU: ${p.sku}` : 'Standard Item'}
                    </span>
                  </div>
                )}

                {/* Top-Left Rating Pill */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-amber-600 border border-[#E5E9F0] flex items-center gap-1 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                    <span>{p.rating || 4.8}</span>
                  </span>
                </div>

                {/* Floating Category Pill top-right */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#0B192C] border border-[#E5E9F0] shadow-xs">
                    {p.category || 'General'}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-[#0B192C] group-hover:text-[#3D74D9] transition truncate">
                  {p.name}
                </h3>
                <p className="text-[11px] text-[#5B6D85] line-clamp-2 leading-relaxed">
                  {p.description || 'Catalogue item with standard pricing.'}
                </p>
              </div>

              {/* Bottom Row */}
              <div className="pt-3 mt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase text-[#8F9FB5]">
                    per {p.unit || 'unit'}
                  </div>
                  <div className="font-mono text-base font-extrabold text-[#0B192C]">
                    {formatCurrency(p.default_price, business.currency)}
                  </div>
                </div>

                {/* Action buttons (Edit & Delete) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (confirm(`Delete product ${p.name}?`)) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    className="p-2 text-[#5B6D85] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(p)}
                    className="w-8 h-8 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white flex items-center justify-center font-bold shadow-md shadow-[#0B192C]/20 transition active:scale-90"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E9F0] p-6 shadow-2xl text-[#0B192C]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Catalogue Item' : 'Add Item to Catalogue'}
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
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Item / Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 5kVA Hybrid Inverter / Deep Cleaning Service"
                  className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Inverters, Services, Panels"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="INV-5KVA"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Default Unit Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#5B6D85]">{business.currency}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] pl-8 pr-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Pricing Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. unit, hrs, job, set, sqm"
                    className="w-full rounded-xl bg-[#F4F7FB] border border-[#E5E9F0] px-3 py-2 text-xs text-white focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6D85] mb-1">Specification / Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical details, warranty information, or service scope..."
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
                  <span>Save to Catalogue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
