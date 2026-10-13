import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Flame,
  Phone,
  MessageSquare,
  Mail,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  Layers,
  Wrench,
  Clock,
  Package,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Lead, LeadSource, LeadStatus, AppState, BusinessProfile, Product } from '../types';
import { SERVICE_CATEGORIES, POPULAR_LOCATIONS, calculateIntentScore } from '../data/marketplaceData';
import { NIGERIA_LOCATIONS } from '../data/nigeriaLocations';

interface LeadEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  state?: AppState;
  business?: BusinessProfile;
  existingProducts?: Product[];
  onSaveLead: (lead: Lead) => void;
  onConvertToQuote?: (lead: Lead) => void;
  onSaveProduct?: (product: Product) => void;
}

export const LeadEditorModal: React.FC<LeadEditorModalProps> = ({
  isOpen,
  onClose,
  lead,
  state,
  business,
  existingProducts,
  onSaveLead,
  onConvertToQuote,
  onSaveProduct,
}) => {
  const isEditing = Boolean(lead);

  // Available catalogue products from state or props
  const catalogueProducts: Product[] = useMemo(() => {
    if (existingProducts && existingProducts.length > 0) return existingProducts;
    if (state?.products && state.products.length > 0) return state.products;
    return [];
  }, [existingProducts, state?.products]);

  // Form Fields
  const [customerName, setCustomerName] = useState(lead?.customer_name || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [whatsapp, setWhatsapp] = useState(lead?.whatsapp || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [company, setCompany] = useState(lead?.company || '');

  // Simple & Easy Address Fields
  const [streetAddress, setStreetAddress] = useState(lead?.address || '');
  const [cityArea, setCityArea] = useState(lead?.city || '');
  const [stateName, setStateName] = useState(lead?.state || business?.state || 'Lagos');
  const [location, setLocation] = useState(lead?.location || business?.city || 'Lagos');

  // Service Details
  const [serviceCategory, setServiceCategory] = useState(lead?.service_category || 'Power & Technology');
  const [serviceRequired, setServiceRequired] = useState(lead?.service_required || '');
  const [propertyType, setPropertyType] = useState(lead?.property_type || 'Residential (Duplex/House)');
  const [estimatedValue, setEstimatedValue] = useState<string>(
    lead?.estimated_value ? String(lead.estimated_value) : ''
  );
  const [budgetFormatted, setBudgetFormatted] = useState(lead?.budget_formatted || '₦1,000,000 – ₦2,500,000');
  const [timeline, setTimeline] = useState<'immediate' | 'within_7_days' | 'within_30_days' | 'flexible'>(
    lead?.timeline || 'within_7_days'
  );
  const [source, setSource] = useState<LeadSource>(lead?.source || 'manual');
  const [sourceName, setSourceName] = useState(lead?.source_name || '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'New');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(lead?.next_follow_up || '');
  const [isVerified, setIsVerified] = useState(lead?.is_verified ?? true);

  // Attached Catalogue Products for this Lead
  const [attachedProducts, setAttachedProducts] = useState<
    Array<{
      product_id: string;
      name: string;
      category?: string;
      unit?: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>
  >(lead?.attached_products || []);

  // Product Selection & Creation State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Power & Technology');
  const [newProdUnit, setNewProdUnit] = useState('unit');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [productFeedback, setProductFeedback] = useState<string | null>(null);

  // Validation feedback
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync when lead or open prop changes
  useEffect(() => {
    if (lead) {
      setCustomerName(lead.customer_name || '');
      setPhone(lead.phone || '');
      setWhatsapp(lead.whatsapp || lead.phone || '');
      setEmail(lead.email || '');
      setCompany(lead.company || '');
      setStreetAddress(lead.address || '');
      setCityArea(lead.city || '');
      setStateName(lead.state || business?.state || 'Lagos');
      setLocation(lead.location || business?.city || 'Lagos');
      setServiceCategory(lead.service_category || 'Power & Technology');
      setServiceRequired(lead.service_required || '');
      setPropertyType(lead.property_type || 'Residential (Duplex/House)');
      setEstimatedValue(lead.estimated_value ? String(lead.estimated_value) : '');
      setBudgetFormatted(lead.budget_formatted || '₦1,000,000 – ₦2,500,000');
      setTimeline(lead.timeline || 'within_7_days');
      setSource(lead.source || 'manual');
      setSourceName(lead.source_name || '');
      setStatus(lead.status || 'New');
      setNotes(lead.notes || '');
      setNextFollowUp(lead.next_follow_up || '');
      setIsVerified(lead.is_verified ?? true);
      setAttachedProducts(lead.attached_products || []);
    } else {
      setCustomerName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setCompany('');
      setStreetAddress('');
      setCityArea('');
      const defaultState = business?.state || 'Lagos';
      setStateName(defaultState);
      setLocation(business?.city || 'Lagos');
      setServiceCategory('Power & Technology');
      setServiceRequired('');
      setPropertyType('Residential (Duplex/House)');
      setEstimatedValue('');
      setBudgetFormatted('₦1,000,000 – ₦2,500,000');
      setTimeline('within_7_days');
      setSource('manual');
      setSourceName('');
      setStatus('New');
      setNotes('');
      setNextFollowUp('');
      setIsVerified(true);
      setAttachedProducts([]);
    }
    setValidationError(null);
    setIsCreatingProduct(false);
    setSelectedProductId('');
    setProductFeedback(null);
  }, [lead, isOpen, business]);

  // Keep location synced with City/Area and State
  const handleAddressChange = (street: string, area: string, stateVal: string) => {
    setStreetAddress(street);
    setCityArea(area);
    setStateName(stateVal);

    const parts = [area.trim(), stateVal.trim()].filter(Boolean);
    const combined = parts.join(', ') || stateVal || 'Nigeria';
    setLocation(combined);
  };

  // Find cities/areas for the currently selected state
  const selectedStateObj = useMemo(() => {
    return (
      NIGERIA_LOCATIONS.find((s) => s.name.toLowerCase() === stateName.toLowerCase()) ||
      NIGERIA_LOCATIONS[0]
    );
  }, [stateName]);

  // Live calculation of intent score
  const { score: computedScore, level: computedLevel } = calculateIntentScore({
    service_required: serviceRequired,
    phone: phone || whatsapp,
    whatsapp: whatsapp || phone,
    location,
    budget_formatted: budgetFormatted,
    timeline,
    is_verified: isVerified,
    notes,
  });

  // Calculate sum of attached products
  const attachedProductsTotal = useMemo(() => {
    return attachedProducts.reduce((sum, item) => sum + item.total, 0);
  }, [attachedProducts]);

  if (!isOpen) return null;

  const currentCategoryObj =
    SERVICE_CATEGORIES.find((c) => c.name === serviceCategory) || SERVICE_CATEGORIES[0];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(val);
    }
    if (validationError) setValidationError(null);
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsapp(val);
    if (!phone) {
      setPhone(val);
    }
    if (validationError) setValidationError(null);
  };

  const handleEstimatedValueChange = (val: string) => {
    const cleanNum = val.replace(/[^0-9]/g, '');
    setEstimatedValue(cleanNum);
    if (cleanNum) {
      const num = parseInt(cleanNum, 10);
      setBudgetFormatted(`₦${num.toLocaleString()}`);
    }
  };

  // Add existing product from catalogue to attached products list
  const handleAddExistingProduct = () => {
    if (!selectedProductId) return;
    const prod = catalogueProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = attachedProducts.findIndex((p) => p.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...attachedProducts];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setAttachedProducts(updated);
    } else {
      const newItem = {
        product_id: prod.id,
        name: prod.name,
        category: prod.category,
        unit: prod.unit || 'unit',
        quantity: 1,
        unit_price: prod.default_price || 0,
        total: prod.default_price || 0,
      };
      setAttachedProducts([...attachedProducts, newItem]);
    }

    setSelectedProductId('');
    setProductFeedback(`Added "${prod.name}" from catalogue.`);
    setTimeout(() => setProductFeedback(null), 3500);
  };

  // Create new catalogue product inline and immediately attach it to lead
  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      setValidationError('Please enter a product or catalogue item name.');
      return;
    }

    const priceNum = newProdPrice ? parseInt(newProdPrice.replace(/[^0-9]/g, ''), 10) : 0;
    const newId = `prod_${Date.now()}`;

    const newProduct: Product = {
      id: newId,
      name: newProdName.trim(),
      description: newProdDescription.trim() || `Catalogue item for ${newProdCategory}`,
      unit: newProdUnit.trim() || 'unit',
      default_price: priceNum,
      category: newProdCategory.trim() || serviceCategory,
    };

    // Save permanently to catalogue via parent callback if provided
    if (onSaveProduct) {
      onSaveProduct(newProduct);
    }

    // Immediately attach to this lead
    const newAttached = {
      product_id: newId,
      name: newProduct.name,
      category: newProduct.category,
      unit: newProduct.unit,
      quantity: 1,
      unit_price: priceNum,
      total: priceNum,
    };

    setAttachedProducts((prev) => [...prev, newAttached]);

    // Reset form
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDescription('');
    setIsCreatingProduct(false);
    setProductFeedback(`Created "${newProduct.name}" and saved to Catalogue & Lead!`);
    setTimeout(() => setProductFeedback(null), 4000);
  };

  // Update attached product quantity
  const handleUpdateProductQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveAttachedProduct(index);
      return;
    }
    const updated = [...attachedProducts];
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].unit_price;
    setAttachedProducts(updated);
  };

  // Update attached product price
  const handleUpdateProductPrice = (index: number, newPriceStr: string) => {
    const cleanNum = parseInt(newPriceStr.replace(/[^0-9]/g, ''), 10) || 0;
    const updated = [...attachedProducts];
    updated[index].unit_price = cleanNum;
    updated[index].total = updated[index].quantity * cleanNum;
    setAttachedProducts(updated);
  };

  // Remove attached product
  const handleRemoveAttachedProduct = (index: number) => {
    const updated = attachedProducts.filter((_, i) => i !== index);
    setAttachedProducts(updated);
  };

  // Sync attached products total to estimated value
  const handleApplyCatalogueTotalToEstimate = () => {
    if (attachedProductsTotal > 0) {
      setEstimatedValue(String(attachedProductsTotal));
      setBudgetFormatted(`₦${attachedProductsTotal.toLocaleString()}`);
      setProductFeedback(`Updated lead estimated value to ₦${attachedProductsTotal.toLocaleString()}`);
      setTimeout(() => setProductFeedback(null), 3000);
    }
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      setValidationError('Please enter the customer or prospect name.');
      return false;
    }
    if (!phone.trim() && !whatsapp.trim() && !email.trim()) {
      setValidationError('Please provide at least one contact method (Phone or WhatsApp).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const constructLeadObject = (): Lead => {
    const rawNum = estimatedValue ? parseInt(estimatedValue.replace(/[^0-9]/g, ''), 10) : 0;
    const finalVal = rawNum > 0 ? rawNum : attachedProductsTotal > 0 ? attachedProductsTotal : 0;
    const finalPhone = phone.trim() || whatsapp.trim() || 'N/A';
    const finalWhatsapp = whatsapp.trim() || phone.trim() || finalPhone;
    const existingCount = state?.leads?.length ?? 12;

    const fullLocation = location.trim() || [cityArea.trim(), stateName.trim()].filter(Boolean).join(', ') || 'Nigeria';

    return {
      id: lead?.id || `lead_${Date.now()}`,
      lead_number: lead?.lead_number || `MAT-${String(120 + existingCount).padStart(6, '0')}`,
      customer_name: customerName.trim() || 'Prospective Client',
      phone: finalPhone,
      whatsapp: finalWhatsapp,
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      location: fullLocation,
      address: streetAddress.trim() || undefined,
      city: cityArea.trim() || undefined,
      state: stateName.trim() || undefined,
      service_required:
        serviceRequired.trim() ||
        (attachedProducts.length > 0
          ? attachedProducts.map((p) => p.name).slice(0, 2).join(' + ')
          : `${serviceCategory} Project Inquiry`),
      service_category: serviceCategory,
      property_type: propertyType.trim() || 'Residential',
      budget_formatted:
        budgetFormatted.trim() || (finalVal > 0 ? `₦${finalVal.toLocaleString()}` : 'Budget upon inspection'),
      estimated_value: finalVal > 0 ? finalVal : lead?.estimated_value || 0,
      budget_min: finalVal > 0 ? Math.round(finalVal * 0.85) : lead?.budget_min,
      budget_max: finalVal > 0 ? Math.round(finalVal * 1.15) : lead?.budget_max,
      timeline,
      source,
      source_name: sourceName.trim() || (source === 'manual' ? 'Direct Entry' : undefined),
      status,
      intent_score: computedScore,
      intent_level: computedLevel,
      is_verified: isVerified,
      verified_at: isVerified ? lead?.verified_at || new Date().toISOString() : undefined,
      freshness: 'active',
      freshness_label: '🔥 Active — verified today',
      is_locked: false, // User leads are ALWAYS 100% unlocked and free
      notes: notes.trim(),
      next_follow_up: nextFollowUp || undefined,
      attached_products: attachedProducts.length > 0 ? attachedProducts : undefined,
      quote_id: lead?.quote_id,
      customer_id: lead?.customer_id,
      created_at: lead?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newLead = constructLeadObject();
      onSaveLead(newLead);
      onClose();
    } catch (err) {
      console.error('Failed to save lead:', err);
      setValidationError('Failed to save lead. Please verify the entered information.');
    }
  };

  const handleSaveAndQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const newLead = constructLeadObject();
      onSaveLead(newLead);
      onClose();
      if (onConvertToQuote) {
        setTimeout(() => {
          onConvertToQuote(newLead);
        }, 100);
      }
    } catch (err) {
      console.error('Failed to save lead and generate quote:', err);
      setValidationError('Failed to proceed. Please check the entered information.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E9F0] bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {isEditing ? 'Edit Lead' : 'Add New Lead (100% Free)'}
              </span>
              <span className="text-xs text-[#5B6D85] font-mono">
                {isEditing ? lead?.lead_number : 'Pipeline Entry'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#0B192C] mt-1">
              {isEditing ? `Update Lead: ${lead?.customer_name}` : 'Record New Customer Inquiry / Prospect'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#E2E8F0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intent Score Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#F0FDF4] border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-950">Calculated Intent:</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              {computedScore}/100 — {computedLevel} Intent
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">
            ✓ Your leads are never locked and free to contact
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Customer Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <User className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Customer & Contact Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Customer / Prospect Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alhaji Mansur Bello or Chief Obi"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Company / Organization (Optional)
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Bello Logistics Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="0803 000 0000"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="0803 000 0000"
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Simple & Easy Address Form */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                  Project Location & Simple Address Form
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Simple & Easy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* State */}
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  State in Nigeria
                </label>
                <select
                  value={stateName}
                  onChange={(e) => handleAddressChange(streetAddress, cityArea, e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  {NIGERIA_LOCATIONS.map((loc) => (
                    <option key={loc.slug} value={loc.name}>
                      {loc.name} {loc.isFct ? '(FCT)' : 'State'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area / District / City */}
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  City / Area / District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 1, Wuse 2, Ikeja"
                  value={cityArea}
                  onChange={(e) => handleAddressChange(streetAddress, e.target.value, stateName)}
                  list="area-suggestions"
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
                <datalist id="area-suggestions">
                  {selectedStateObj?.majorCities.map((c) => (
                    <option key={c.slug} value={c.name} />
                  ))}
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              {/* Property / Facility Type */}
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Property / Facility Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5-Bedroom Duplex, Commercial Store"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Street / Site Address */}
            <div>
              <label className="block text-xs font-bold text-[#0B192C] mb-1">
                Street Address / Site Location / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 14 Admiralty Way, near Zenith Bank or 24 Ikorodu Road"
                value={streetAddress}
                onChange={(e) => handleAddressChange(e.target.value, cityArea, stateName)}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>

            {/* Quick Area Pill Suggestions for selected state */}
            {selectedStateObj && selectedStateObj.majorCities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[#5B6D85] font-semibold">Popular {selectedStateObj.name} areas:</span>
                {selectedStateObj.majorCities.slice(0, 5).map((city) => (
                  <button
                    type="button"
                    key={city.slug}
                    onClick={() => handleAddressChange(streetAddress, city.name, stateName)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                      cityArea === city.name
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-[#F1F5F9] hover:bg-blue-50 text-[#334155] border-[#CBD5E1]'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Product / Catalogue Addition */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                  Products & Catalogue Items
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingProduct(!isCreatingProduct)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3 h-3" />
                <span>{isCreatingProduct ? 'Close New Form' : 'Create New Product / Catalogue'}</span>
              </button>
            </div>

            {/* Product Feedback message */}
            {productFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{productFeedback}</span>
              </div>
            )}

            {/* Option A: Select Existing Product from Catalogue */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <label className="block text-xs font-bold text-[#0B192C]">
                Attach Existing Item from Your Product Catalogue ({catalogueProducts.length} available)
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#0B192C] focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                  >
                    <option value="">-- Choose from existing catalogue products --</option>
                    {catalogueProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₦{Number(p.default_price || 0).toLocaleString()} / {p.unit || 'unit'} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!selectedProductId}
                  onClick={handleAddExistingProduct}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach to Lead</span>
                </button>
              </div>
            </div>

            {/* Option B: Inline Form to Create New Catalogue Item */}
            {isCreatingProduct && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      Add New Product / Catalogue Item
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                    Saved to Catalogue & Attached to Lead
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0B192C] mb-1">
                      Product / Service Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5kVA Hybrid Solar Inverter"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs text-[#0B192C] focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0B192C] mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Inverters, Solar Panels, CCTV, Plumbing"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      list="category-suggestions"
                      className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs text-[#0B192C] focus:border-blue-600 focus:outline-none"
                    />
                    <datalist id="category-suggestions">
                      {SERVICE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                      <option value="Inverters" />
                      <option value="Batteries" />
                      <option value="Solar Panels" />
                      <option value="Labor & Installation" />
                      <option value="Hardware Fixtures" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0B192C] mb-1">
                      Unit Price (₦)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 450,000"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs font-bold text-[#0B192C] focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0B192C] mb-1">
                      Unit (unit, pcs, set, job, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. unit, pcs, set, job"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full rounded-xl bg-white border border-[#CBD5E1] px-3 py-1.5 text-xs text-[#0B192C] focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCreateNewProduct}
                      className="w-full py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Attach</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Attached Products */}
            {attachedProducts.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#5B6D85]">
                  <span>Attached Items ({attachedProducts.length})</span>
                  <span>Line Total</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {attachedProducts.map((item, idx) => (
                    <div
                      key={item.product_id + '_' + idx}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#0B192C] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#5B6D85] flex items-center gap-2">
                          {item.category && (
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              {item.category}
                            </span>
                          )}
                          <span>₦{item.unit_price.toLocaleString()} / {item.unit || 'unit'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1 bg-white border border-[#CBD5E1] rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateProductQty(idx, item.quantity - 1)}
                            className="px-1.5 text-[#5B6D85] hover:text-[#0B192C] font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-[#0B192C]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateProductQty(idx, item.quantity + 1)}
                            className="px-1.5 text-[#5B6D85] hover:text-[#0B192C] font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="font-black text-[#0B192C] text-xs min-w-[70px] text-right">
                          ₦{item.total.toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachedProduct(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Bar */}
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-950">Catalogue Items Total:</span>
                    <span className="text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                      ₦{attachedProductsTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCatalogueTotalToEstimate}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                  >
                    <span>Use as Lead Estimate (₦{attachedProductsTotal.toLocaleString()})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-[#5B6D85]">
                No catalogue items attached yet. Choose an existing product above or create a new one to specify exact project scope and value.
              </div>
            )}
          </div>

          {/* Section 4: Service Scope, Category & Notes */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Service Scope & Project Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Service Category
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Specific Service Required
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10kVA Solar Hybrid & Lithium Setup"
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Category Sub-items Suggestions */}
            {currentCategoryObj && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[#5B6D85] font-semibold">Quick select:</span>
                {currentCategoryObj.subcategories.slice(0, 5).map((sub) => (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => setServiceRequired(sub)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#F1F5F9] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[#334155] border border-[#CBD5E1] transition"
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Financials, Stage & Pipeline */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E9F0]">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
                Financials & Deal Stage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Estimated Value (₦)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="1,500,000"
                    value={estimatedValue ? Number(estimatedValue).toLocaleString() : ''}
                    onChange={(e) => handleEstimatedValueChange(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-8 pr-3 py-2 text-xs font-black text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Budget Display
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₦1,500,000 – ₦2,500,000"
                  value={budgetFormatted}
                  onChange={(e) => setBudgetFormatted(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Initial Stage Tab
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-black text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="New">Stage: New Inquiry</option>
                  <option value="Contacted">Stage: Contacted</option>
                  <option value="Qualified">Stage: Qualified</option>
                  <option value="Quote Sent">Stage: Quote Sent</option>
                  <option value="Negotiating">Stage: Negotiating</option>
                  <option value="Won">Stage: Won / Converted</option>
                  <option value="Lost">Stage: Lost / Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Execution Timeline
                </label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value as any)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="immediate">Immediate / Urgent</option>
                  <option value="within_7_days">Within 7 Days</option>
                  <option value="within_30_days">Within 30 Days</option>
                  <option value="flexible">Flexible / Exploring</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Lead Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition cursor-pointer"
                >
                  <option value="manual">Manual / Walk-in</option>
                  <option value="WhatsApp">Direct WhatsApp</option>
                  <option value="referral">Word-of-mouth Referral</option>
                  <option value="website">Company Website</option>
                  <option value="Google Ads">Google Search</option>
                  <option value="Meta Ads">Instagram / Facebook</option>
                  <option value="partner">Partner / Subcontractor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B192C] mb-1">
                  Next Follow-Up Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-[#5B6D85] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-9 pr-3 py-2 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B192C] mb-1">
                Project Notes & Specific Requirements
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Client needs inverter system to carry 2 ACs, water pumping machine and refrigerator. Prefers Tier-1 equipment and 5-year warranty."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#0B192C] focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E5E9F0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F1F5F9] transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onConvertToQuote && (
                <button
                  type="button"
                  onClick={handleSaveAndQuote}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0B192C] px-4 py-2.5 text-xs font-bold transition shadow-sm active:scale-95"
                  title="Save lead and immediately open quote generator"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Save & Create Quote</span>
                </button>
              )}

              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isEditing ? 'Update Lead' : 'Add to Pipeline'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
