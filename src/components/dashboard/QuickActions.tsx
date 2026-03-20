// /home/user/matthorg/src/components/dashboard/QuickActions.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import AddStaffModal from '@/components/dashboard/AddStaffModal';
import { SparklesIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QuickActionsProps {
  orgId: string;
}

export default function QuickActions({ orgId }: QuickActionsProps) {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Smart Entry States
  const [activeTab, setActiveTab] = useState<'buttons' | 'chat'>('buttons');
  const [chatInput, setChatInput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [quota, setQuota] = useState({ remaining: 50, limit: 50 });

  const supabase = createClient();

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Smart Entry Examples
  const examples = [
    "sold 3 bags of premium dog food for ₦45,000 to Mr. Johnson",
    "bought office supplies for ₦12,500 from Ikeja Store",
    "add product 'wireless mouse' 50 units @ ₦3,500",
    "expense ₦25,000 for internet subscription",
    "sold 2 puppies for ₦350,000 total"
  ];

  // Smart Entry Handlers
  const handleParse = async () => {
    if (!chatInput.trim()) return;
    
    setChatLoading(true);
    try {
      const response = await fetch('/api/parse-natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: chatInput, 
          orgId 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403 && data.error?.includes('limit')) {
          showNotif('error', 'Monthly parse limit reached. Please upgrade your plan.');
          return;
        }
        throw new Error(data.error || 'Parse failed');
      }
      
      setParsedData(data);
      setShowPreview(true);
      if (data.quota) setQuota(data.quota);
      
    } catch (error) {
      console.error('Parse error:', error);
      showNotif('error', 'Failed to parse input. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const confirmAndSave = async () => {
    if (!parsedData) return;
    
    setChatLoading(true);
    try {
      const response = await fetch('/api/save-from-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parsedData,
          orgId 
        })
      });
      
      if (response.ok) {
        showNotif('success', '✅ Recorded successfully!');
        setChatInput('');
        setParsedData(null);
        setShowPreview(false);
        setActiveTab('buttons'); // Return to buttons after success
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      showNotif('error', 'Failed to save. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  // ============================================
  // ADD SALE MODAL (Enhanced with Product Search)
  // ============================================
  const AddSaleModal = () => {
    const [form, setForm] = useState({ 
      product_id: "",
      quantity: "1",
      amount: "", 
      customer_name: "",
      payment_method: "cash",
      notes: ""
    });
    
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Load products when modal opens
    useEffect(() => {
      if (showSaleModal) {
        loadProducts();
      }
    }, [showSaleModal]);

    const loadProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from('inventory')
        .select(`
          id, 
          item_name, 
          sale_price, 
          quantity, 
          sku,
          images:product_images(image_url, is_primary)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .gt('quantity', 0)
        .order('item_name');
      
      setProducts(data || []);
      setLoadingProducts(false);
    };

    const filteredProducts = products.filter(p => 
      p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectProduct = (product: any) => {
      setSelectedProduct(product);
      setForm({
        ...form,
        product_id: product.id,
        amount: product.sale_price?.toString() || "",
        quantity: "1"
      });
      setShowDropdown(false);
      setSearchTerm(product.item_name);
    };

    const handleQuantityChange = (qty: string) => {
      const quantity = parseInt(qty) || 1;
      setForm({
        ...form,
        quantity: qty,
        amount: selectedProduct ? (selectedProduct.sale_price * quantity).toString() : ""
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Insert sale record
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .insert({
            organization_id: orgId,
            product_id: form.product_id || null,
            quantity: parseInt(form.quantity),
            amount: parseFloat(form.amount),
            customer_name: form.customer_name || null,
            payment_method: form.payment_method,
            notes: form.notes || null,
            sale_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (saleError) throw saleError;

        // Update inventory if product was selected
        if (form.product_id && selectedProduct) {
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ 
              quantity: selectedProduct.quantity - parseInt(form.quantity),
              updated_at: new Date().toISOString()
            })
            .eq('id', form.product_id);

          if (updateError) {
            console.error('Inventory update error:', updateError);
            // Still show success for sale, but warn about inventory
            showNotif('success', '✅ Sale recorded! (Inventory update failed - please check)');
          } else {
            showNotif('success', '✅ Sale recorded! Inventory updated.');
          }
        } else {
          showNotif('success', '✅ Sale recorded!');
        }

        // Reset form
        setShowSaleModal(false);
        setForm({ 
          product_id: "", quantity: "1", amount: "", 
          customer_name: "", payment_method: "cash", notes: "" 
        });
        setSelectedProduct(null);
        setSearchTerm("");
        
      } catch (error: any) {
        console.error('Sale error:', error);
        showNotif('error', `❌ Failed to record sale: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal isOpen={showSaleModal} onClose={() => {
        setShowSaleModal(false);
        setSelectedProduct(null);
        setSearchTerm("");
      }} title="Add Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Search with Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Product
            </label>
            <input
              type="text"
              placeholder="Type to search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) {
                  setSelectedProduct(null);
                  setForm({...form, product_id: "", amount: ""});
                }
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            
            {/* Product Dropdown */}
            <AnimatePresence>
              {showDropdown && (searchTerm || filteredProducts.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {loadingProducts ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex items-center gap-3"
                      >
                        {/* Product image */}
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0].image_url} 
                              alt={product.item_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                        </div>
                        
                        {/* Product details */}
                        <div className="flex-1">
                          <p className="font-medium">{product.item_name}</p>
                          <p className="text-sm text-gray-500">
                            Price: ₦{product.sale_price?.toLocaleString()} | 
                            Stock: {product.quantity}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No products found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Product Badge */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded overflow-hidden">
                {selectedProduct.images?.[0] ? (
                  <img 
                    src={selectedProduct.images[0].image_url} 
                    alt={selectedProduct.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedProduct.item_name}</p>
                <p className="text-sm text-gray-600">
                  Price: ₦{selectedProduct.sale_price?.toLocaleString()} | 
                  Available: {selectedProduct.quantity}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setSearchTerm("");
                  setForm({...form, product_id: "", amount: ""});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quantity and Amount Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.quantity || 999}
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (₦)
              </label>
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                required
                readOnly={!!selectedProduct}
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Customer Name (Optional)"
            value={form.customer_name}
            onChange={(e) => setForm({...form, customer_name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <select
            value={form.payment_method}
            onChange={(e) => setForm({...form, payment_method: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
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
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              'Complete Sale'
            )}
          </button>
        </form>
      </Modal>
    );
  };

  // ============================================
  // ADD EXPENSE MODAL
  // ============================================
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
      
      try {
        const { error } = await supabase.from("expenses").insert({
          organization_id: orgId,
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description,
          vendor: form.vendor || null,
          expense_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        if (error) throw error;

        showNotif('success', '✅ Expense added successfully!');
        setShowExpenseModal(false);
        setForm({ amount: "", category: "", description: "", vendor: "" });
        
      } catch (error: any) {
        console.error('Expense error:', error);
        showNotif('error', `❌ Failed to add expense: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Amount (₦) *"
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
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Adding...
              </>
            ) : (
              'Add Expense'
            )}
          </button>
        </form>
      </Modal>
    );
  };

  // ============================================
  // ADD PRODUCT MODAL (Enhanced with Images)
  // ============================================
  const AddProductModal = () => {
    const [form, setForm] = useState({ 
      name: "", 
      sku: "", 
      sale_price: "", 
      lease_price: "",
      listing_type: "sale",
      quantity: "1", 
      category: "",
      description: "",
      images: [] as { file: File; preview: string; isPrimary: boolean }[],
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      
      const newImages = files.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: form.images.length === 0 && index === 0,
      }));

      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 10)
      }));
    };

    const removeImage = (index: number) => {
      setForm(prev => {
        const newImages = prev.images.filter((_, i) => i !== index);
        
        // If we removed the primary image, make the first one primary
        if (prev.images[index].isPrimary && newImages.length > 0) {
          newImages[0].isPrimary = true;
        }
        
        return { ...prev, images: newImages };
      });
    };

    const setAsPrimary = (index: number) => {
      setForm(prev => ({
        ...prev,
        images: prev.images.map((img, i) => ({
          ...img,
          isPrimary: i === index
        }))
      }));
    };

    const uploadImages = async (productId: string) => {
      const uploadedUrls: string[] = [];
      const totalImages = form.images.length;
      
      for (let i = 0; i < form.images.length; i++) {
        const img = form.images[i];
        setUploadProgress(Math.round((i / totalImages) * 100));
        
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${orgId}/${productId}/${Date.now()}-${i}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, img.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        // Save image record to database
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            organization_id: orgId,
            product_id: productId,
            image_url: publicUrl,
            sort_order: i,
            is_primary: img.isPrimary,
            alt_text: `${form.name} - view ${i + 1}`,
            file_size: img.file.size,
            file_type: img.file.type,
          });

        if (dbError) throw dbError;

        uploadedUrls.push(publicUrl);
      }
      
      setUploadProgress(100);
      return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setUploading(true);
      
      try {
        // Validate
        if (!form.name) throw new Error("Product name is required");
        if (form.listing_type === 'sale' && !form.sale_price) throw new Error("Sale price is required");
        if (form.listing_type === 'lease' && !form.lease_price) throw new Error("Lease price is required");

        // First create the product
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
        
        const { data: product, error: productError } = await supabase
          .from("inventory")
          .insert(productData)
          .select()
          .single();

        if (productError) throw productError;

        // Then upload images if any
        if (form.images.length > 0) {
          await uploadImages(product.id);
        }

        // Success!
        showNotif('success', `✅ Product "${form.name}" added successfully${form.images.length > 0 ? ` with ${form.images.length} images` : ''}!`);
        
        setShowProductModal(false);
        setForm({ 
          name: "", sku: "", sale_price: "", lease_price: "",
          listing_type: "sale", quantity: "1", category: "", 
          description: "", images: [] 
        });
        
      } catch (error: any) {
        console.error('Product error:', error);
        showNotif('error', `❌ Failed to add product: ${error.message}`);
      } finally {
        setLoading(false);
        setUploading(false);
        setUploadProgress(0);
      }
    };

    return (
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Add Product">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
          {/* Basic Info */}
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

          {/* Listing Type */}
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

          {/* Price */}
          {form.listing_type === 'sale' ? (
            <input
              type="number"
              placeholder="Sale Price (₦) *"
              value={form.sale_price}
              onChange={(e) => setForm({...form, sale_price: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          ) : (
            <input
              type="number"
              placeholder="Monthly Lease Price (₦) *"
              value={form.lease_price}
              onChange={(e) => setForm({...form, lease_price: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          )}

          {/* Quantity & Category */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Image Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              Product Images ({form.images.length}/10)
            </label>

            {/* Image Grid */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {form.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    
                    {/* Primary badge */}
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        ★
                      </span>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setAsPrimary(index)}
                          className="bg-blue-500 text-white p-1 rounded text-xs"
                          title="Set as primary"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-red-500 text-white p-1 rounded text-xs"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {form.images.length < 10 && (
              <label className="block">
                <div className="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-2xl mb-1">📸</div>
                  <div className="text-sm font-medium">
                    Click to upload images
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB each (max 10)
                  </div>
                </div>
              </label>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition flex items-center justify-center gap-2"
          >
            {loading || uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                {uploading ? `Uploading ${uploadProgress}%` : 'Adding...'}
              </>
            ) : (
              'Add Product'
            )}
          </button>
        </form>
      </Modal>
    );
  };

  // ============================================
  // MODAL COMPONENT
  // ============================================
  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
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

 // Preview Card Component - FIXED
const PreviewCard = ({ parsed }: { parsed: any }) => {
  const colors: Record<string, string> = {
    sale: 'bg-green-50 border-green-200',
    expense: 'bg-orange-50 border-orange-200',
    product: 'bg-blue-50 border-blue-200',
    unknown: 'bg-gray-50 border-gray-200'
  };

  const type = parsed.type || 'unknown';
  // Ensure we always have a valid color, fallback to unknown if type not in colors
  const colorClass = colors[type] || colors.unknown;

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold capitalize">{type}</span>
        {parsed.confidence && (
          <span className="text-xs bg-white px-2 py-1 rounded">
            Confidence: {(parsed.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        {parsed.data?.product && (
          <>
            <span className="text-gray-500">Product:</span>
            <span className="font-medium">{parsed.data.product}</span>
          </>
        )}
        {parsed.data?.quantity && (
          <>
            <span className="text-gray-500">Quantity:</span>
            <span>{parsed.data.quantity}</span>
          </>
        )}
        {parsed.data?.amount && (
          <>
            <span className="text-gray-500">Amount:</span>
            <span className="font-medium">₦{parsed.data.amount.toLocaleString()}</span>
          </>
        )}
        {parsed.data?.customer && (
          <>
            <span className="text-gray-500">Customer:</span>
            <span>{parsed.data.customer}</span>
          </>
        )}
        {parsed.data?.category && (
          <>
            <span className="text-gray-500">Category:</span>
            <span>{parsed.data.category}</span>
          </>
        )}
      </div>
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
            } text-white flex items-center gap-2`}
          >
            {notification.type === 'success' ? '✅' : '❌'} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2 mb-4">
        <button
          onClick={() => setActiveTab('buttons')}
          className={`px-4 py-2 rounded-t-lg transition ${
            activeTab === 'buttons' 
              ? 'bg-blue-100 text-blue-700 font-medium border-b-2 border-blue-600' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            activeTab === 'chat' 
              ? 'bg-purple-100 text-purple-700 font-medium border-b-2 border-purple-600' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          Smart Entry
          <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full">
            {quota.remaining}/{quota.limit}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'buttons' && (
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
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border p-4">
          {/* Input Area */}
          <div className="relative">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type what happened naturally..."
              className="w-full p-4 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-purple-500"
              disabled={chatLoading}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {chatInput.length}/500
            </div>
          </div>

          {/* Examples */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(ex)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-left"
                >
                  {ex.length > 40 ? ex.substring(0, 40) + '...' : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Parse Button */}
          <button
            onClick={handleParse}
            disabled={chatLoading || !chatInput.trim()}
            className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {chatLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Parse & Preview
              </>
            )}
          </button>
        </div>
      )}

      {/* Modals */}
      <AddSaleModal />
      <AddExpenseModal />
      <AddProductModal />
      
      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && parsedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Confirm Entry</h3>
              
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">I understood:</p>
                <p className="text-base font-medium mt-1">{parsedData.raw}</p>
              </div>

              <PreviewCard parsed={parsedData} />

              <div className="mt-6 space-y-3">
                <button
                  onClick={confirmAndSave}
                  disabled={chatLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  Confirm & Save
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddStaffModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        orgId={orgId}
        showNotif={showNotif}
      />
    </>
  );
}