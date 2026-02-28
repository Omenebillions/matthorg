// /src/components/OrganizationAddress.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'

interface Organization {
  id: string
  name: string
  legal_name?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tax_id?: string
  registration_number?: string
  logo_url?: string
  invoice_footer?: string
  invoice_terms?: string
  bank_name?: string
  bank_account?: string
  bank_account_name?: string
  bank_sort_code?: string
  bank_swift?: string
  created_at?: string
  updated_at?: string
}

interface OrganizationAddressProps {
  orgId: string
  onUpdate?: () => void
  showInvoiceSettings?: boolean
}

export default function OrganizationAddress({ 
  orgId, 
  onUpdate,
}: OrganizationAddressProps) {
  const supabase = createClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Organization>>({})
  const [uploading, setUploading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'details' | 'invoice' | 'bank'>('details')

  // Load organization data and setup real-time
  useEffect(() => {
    if (!orgId) return

    loadOrganization()
    setupRealtimeSubscription()

    return () => {
      supabase.removeAllChannels()
    }
  }, [orgId])

  // Load organization from database
  const loadOrganization = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) {
      console.error('Error loading organization:', error)
    } else if (data) {
      setOrganization(data)
      setEditForm(data)
    }
    
    setLoading(false)
  }

  // Setup real-time subscription for organization changes
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('organization-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organizations',
          filter: `id=eq.${orgId}`
        },
        (payload) => {
          console.log('🏢 Organization updated:', payload)
          
          // Cast payload.new to Organization type
          // This tells TypeScript "trust me, this has all the required fields"
          const updatedOrg = payload.new as Organization
          setOrganization(updatedOrg)
          
          // Also update the edit form if we're editing
          setEditForm(updatedOrg)
          
          setLastUpdate(new Date())
          
          // Show brief highlight animation
          const card = document.getElementById('org-card')
          if (card) {
            card.classList.add('highlight-animation')
            setTimeout(() => {
              card.classList.remove('highlight-animation')
            }, 1000)
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return channel
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  // Save organization changes
  const handleSave = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('organizations')
      .update({
        ...editForm,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)

    if (error) {
      console.error('Error updating organization:', error)
      alert('Error saving changes')
    } else {
      setIsEditing(false)
      if (onUpdate) onUpdate()
    }
    
    setLoading(false)
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `logo-${orgId}.${fileExt}`
    const filePath = `organization-logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      alert('Error uploading logo')
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)

    if (updateError) {
      console.error('Error updating logo URL:', updateError)
    }

    setUploading(false)
  }

  // Generate invoice preview
  const generateInvoicePreview = () => {
    const invoiceNumber = `INV-${new Date().getFullYear()}-0001`
    const today = new Date().toLocaleDateString()
    
    return (
      <div className="bg-white border rounded-lg p-6 mt-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt="Logo" className="h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <h3 className="text-lg font-bold mt-2">{organization?.name}</h3>
            <p className="text-sm text-gray-600">{organization?.address}</p>
            <p className="text-sm text-gray-600">
              {organization?.city}, {organization?.state} {organization?.postal_code}
            </p>
            <p className="text-sm text-gray-600">{organization?.country}</p>
          </div>
          <div className="text-right">
            <h4 className="text-2xl font-bold">INVOICE</h4>
            <p className="text-sm text-gray-600">#{invoiceNumber}</p>
            <p className="text-sm text-gray-600">Date: {today}</p>
          </div>
        </div>

        <div className="border-t border-b py-4 my-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bill To:</p>
              <p className="font-medium">Customer Name</p>
              <p className="text-sm text-gray-600">customer@email.com</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Due Date:</p>
              <p className="font-medium">{new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">Sample Product</td>
              <td className="px-4 py-2 text-right">2</td>
              <td className="px-4 py-2 text-right">₦50,000</td>
              <td className="px-4 py-2 text-right">₦100,000</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span>Subtotal:</span>
              <span>₦100,000</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Tax (7.5%):</span>
              <span>₦7,500</span>
            </div>
            <div className="flex justify-between py-2 font-bold border-t">
              <span>Total:</span>
              <span>₦107,500</span>
            </div>
          </div>
        </div>

        {organization?.invoice_footer && (
          <div className="mt-6 pt-4 border-t text-sm text-gray-600">
            {organization.invoice_footer}
          </div>
        )}

        {organization?.invoice_terms && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Terms:</strong> {organization.invoice_terms}
          </div>
        )}
      </div>
    )
  }

  if (loading && !organization) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="org-card" className="bg-white rounded-lg shadow transition-all duration-300">
      {/* Header with live status */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold">Organization Profile</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live' : 'Connecting...'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Company Details
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoice'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Invoice Settings
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bank'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bank Details
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt="Company Logo" 
                className="w-20 h-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow cursor-pointer hover:bg-gray-50">
              <CameraIcon className="w-4 h-4 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium">{organization?.name}</h3>
            <p className="text-sm text-gray-500">Click camera icon to update logo</p>
            {uploading && <p className="text-xs text-blue-500">Uploading...</p>}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* Edit Mode */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      name="legal_name"
                      value={editForm.legal_name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={editForm.website || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={editForm.address || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.city || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={editForm.state || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={editForm.postal_code || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={editForm.country || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID / VAT Number
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      value={editForm.tax_id || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={editForm.registration_number || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'invoice' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Footer Text
                    </label>
                    <textarea
                      name="invoice_footer"
                      value={editForm.invoice_footer || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Thank you for your business!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      name="invoice_terms"
                      value={editForm.invoice_terms || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Net 30"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={editForm.bank_name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="bank_account_name"
                      value={editForm.bank_account_name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bank_account"
                      value={editForm.bank_account || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Code / Routing Number
                    </label>
                    <input
                      type="text"
                      name="bank_sort_code"
                      value={editForm.bank_sort_code || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SWIFT / BIC
                    </label>
                    <input
                      type="text"
                      name="bank_swift"
                      value={editForm.bank_swift || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                      Company Name
                    </p>
                    <p className="font-medium">{organization?.name || '—'}</p>
                  </div>
                  {organization?.legal_name && (
                    <div>
                      <p className="text-sm text-gray-500">Legal Name</p>
                      <p className="font-medium">{organization.legal_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      Email
                    </p>
                    <p className="font-medium">{organization?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      Phone
                    </p>
                    <p className="font-medium">{organization?.phone || '—'}</p>
                  </div>
                  {organization?.website && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <GlobeAltIcon className="w-4 h-4 mr-1" />
                        Website
                      </p>
                      <a href={organization.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {organization.website}
                      </a>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      Address
                    </p>
                    <p className="font-medium">
                      {organization?.address || '—'}<br />
                      {[organization?.city, organization?.state, organization?.postal_code]
                        .filter(Boolean).join(', ')}
                      {organization?.country && <><br />{organization.country}</>}
                    </p>
                  </div>
                  {organization?.tax_id && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <IdentificationIcon className="w-4 h-4 mr-1" />
                        Tax ID
                      </p>
                      <p className="font-medium">{organization.tax_id}</p>
                    </div>
                  )}
                  {organization?.registration_number && (
                    <div>
                      <p className="text-sm text-gray-500">Registration #</p>
                      <p className="font-medium">{organization.registration_number}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoice' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Footer</p>
                    <p className="font-medium">{organization?.invoice_footer || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-medium">{organization?.invoice_terms || '—'}</p>
                  </div>
                  
                  {/* Invoice Preview */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invoice Preview</h4>
                    {generateInvoicePreview()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <button className="flex items-center px-3 py-1 border rounded text-sm hover:bg-gray-50">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download Sample
                    </button>
                    <button className="flex items-center px-3 py-1 border rounded text-sm hover:bg-gray-50">
                      <PrinterIcon className="w-4 h-4 mr-1" />
                      Print Preview
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-medium">{organization?.bank_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="font-medium">{organization?.bank_account_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium">{organization?.bank_account || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sort Code</p>
                    <p className="font-medium">{organization?.bank_sort_code || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SWIFT/BIC</p>
                    <p className="font-medium">{organization?.bank_swift || '—'}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with last sync */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg text-xs text-gray-400 flex justify-between">
        <span>Organization ID: {orgId}</span>
        <span>Last synced: {lastUpdate.toLocaleString()}</span>
      </div>

      <style>{`
        .highlight-animation {
          animation: highlight 1s ease-in-out;
        }
        @keyframes highlight {
          0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
        }
      `}</style>
    </div>
  )
}