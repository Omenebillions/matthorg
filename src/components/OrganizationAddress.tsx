// /src/components/OrganizationAddress.tsx
'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
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
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface Organization {
  id: string
  name: string
  legal_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  tax_id?: string | null
  registration_number?: string | null
  logo_url?: string | null
  invoice_footer?: string | null
  invoice_terms?: string | null
  bank_name?: string | null
  bank_account?: string | null
  bank_account_name?: string | null
  bank_sort_code?: string | null
  bank_swift?: string | null
  currency?: string | null
  fiscal_year_start?: string | null
  timezone?: string | null
  created_at?: string
  updated_at?: string
}

interface OrganizationAddressProps {
  orgId: string
  onUpdate?: () => void
  showInvoiceSettings?: boolean
  readOnly?: boolean
}

// Loading skeleton
function OrganizationSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        {[1,2,3,4].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  )
}

// Copy to clipboard utility
const CopyButton = ({ text, label }: { text: string | null; label: string }) => {
  const { showToast } = useToast()
  
  const handleCopy = () => {
    if (!text) return
    navigator.clipboard.writeText(text)
    showToast(`${label} copied to clipboard`, 'success')
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 text-gray-400 hover:text-gray-600 rounded"
      disabled={!text}
      title={`Copy ${label}`}
    >
      <DocumentDuplicateIcon className="w-4 h-4" />
    </button>
  )
}

// Info row component
const InfoRow = ({ 
  icon: Icon, 
  label, 
  value, 
  copyable = false 
}: { 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string | null | undefined
  copyable?: boolean
}) => {
  return (
    <div className="group relative">
      <p className="text-xs text-gray-500 flex items-center mb-1">
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium break-words pr-2">
          {value || <span className="text-gray-400">—</span>}
        </p>
        {copyable && value && <CopyButton text={value} label={label} />}
      </div>
    </div>
  )
}

export default function OrganizationAddress({ 
  orgId, 
  onUpdate,
  showInvoiceSettings = true,
  readOnly = false
}: OrganizationAddressProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Organization>>({})
  const [uploading, setUploading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'details' | 'invoice' | 'bank'>('details')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) throw error

      if (data) {
        setOrganization(data)
        setEditForm(data)
      }
      
    } catch (error: any) {
      console.error('Error loading organization:', error)
      showToast(error.message || 'Failed to load organization data', 'error')
    } finally {
      setLoading(false)
    }
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
          
          const updatedOrg = payload.new as Organization
          setOrganization(updatedOrg)
          setEditForm(updatedOrg)
          setLastUpdate(new Date())
          
          // Highlight animation
          const card = document.getElementById('org-card')
          if (card) {
            card.classList.add('highlight-animation')
            setTimeout(() => {
              card.classList.remove('highlight-animation')
            }, 1000)
          }

          showToast('Organization updated', 'info')
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return channel
  }

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    
    // Handle different input types
    const processedValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value

    setEditForm(prev => ({ ...prev, [name]: processedValue }))
    setUnsavedChanges(true)
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate email format
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Invalid email format'
    }

    // Validate phone (basic)
    if (editForm.phone && !/^[+\d\s-]{10,}$/.test(editForm.phone)) {
      errors.phone = 'Invalid phone number'
    }

    // Validate website URL
    if (editForm.website && !/^https?:\/\/.+/.test(editForm.website)) {
      errors.website = 'URL must start with http:// or https://'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save organization changes
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Please fix validation errors', 'error')
      return
    }

    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)

      if (error) throw error

      setOrganization(editForm as Organization)
      setIsEditing(false)
      setUnsavedChanges(false)
      showToast('Changes saved successfully', 'success')
      
      if (onUpdate) onUpdate()
      
    } catch (error: any) {
      console.error('Error updating organization:', error)
      showToast(error.message || 'Error saving changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel edit
  const handleCancel = () => {
    setEditForm(organization || {})
    setIsEditing(false)
    setUnsavedChanges(false)
    setValidationErrors({})
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error')
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${orgId}-${Date.now()}.${fileExt}`
      const filePath = `organization-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

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

      if (updateError) throw updateError

      showToast('Logo uploaded successfully', 'success')
      
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      showToast(error.message || 'Error uploading logo', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Generate invoice preview
  const generateInvoicePreview = () => {
    const invoiceNumber = `INV-${new Date().getFullYear()}-0001`
    const today = new Date().toLocaleDateString()
    
    return (
      <div className="bg-white border rounded-lg p-6 mt-4 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt="Logo" 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <h3 className="text-lg font-bold mt-2">{organization?.name || 'Company Name'}</h3>
            <p className="text-sm text-gray-600">{organization?.address || 'Address'}</p>
            <p className="text-sm text-gray-600">
              {organization?.city && `${organization.city}, `}
              {organization?.state && `${organization.state} `}
              {organization?.postal_code}
            </p>
            <p className="text-sm text-gray-600">{organization?.country || 'Country'}</p>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">Sample Product / Service</td>
              <td className="px-4 py-2 text-right">2</td>
              <td className="px-4 py-2 text-right">₦50,000</td>
              <td className="px-4 py-2 text-right">₦100,000</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm font-medium">₦100,000</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm">Tax (7.5%):</span>
              <span className="text-sm font-medium">₦7,500</span>
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

  // Prompt before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [unsavedChanges])

  if (loading && !organization) {
    return <OrganizationSkeleton />
  }

  return (
    <div id="org-card" className="bg-white rounded-lg shadow transition-all duration-300">
      {/* Header with live status */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold">Organization Profile</h2>
        </div>
        <div className="flex items-center space-x-3">
          {/* Live indicator */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live' : 'Connecting...'}
            </span>
          </div>
          
          {/* Last update time */}
          <div className="flex items-center text-xs text-gray-400">
            <ClockIcon className="w-3 h-3 mr-1" />
            {lastUpdate.toLocaleTimeString()}
          </div>

          {/* Refresh button */}
          <button
            onClick={loadOrganization}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Company Details
          </button>
          {showInvoiceSettings && (
            <>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'invoice'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoice Settings
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'bank'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bank Details
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Logo Section */}
        <div className="flex items-start space-x-4 mb-6 pb-6 border-b">
          <div className="relative">
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt="Company Logo" 
                className="w-20 h-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {!readOnly && (
              <>
                <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow cursor-pointer hover:bg-gray-50 border">
                  <CameraIcon className="w-4 h-4 text-gray-600" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                    <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-lg">{organization?.name || 'Company Name'}</h3>
            <p className="text-sm text-gray-500">Click camera icon to update logo</p>
            {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
          </div>
          {!readOnly && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 border rounded-lg hover:bg-blue-50"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* Edit/View Mode */}
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
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ''}
                      onChange={handleInputChange}
                      required
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
                      className={`w-full px-3 py-2 border rounded-lg ${
                        validationErrors.email ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                    )}
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
                      className={`w-full px-3 py-2 border rounded-lg ${
                        validationErrors.phone ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                    )}
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
                      className={`w-full px-3 py-2 border rounded-lg ${
                        validationErrors.website ? 'border-red-500' : ''
                      }`}
                      placeholder="https://example.com"
                    />
                    {validationErrors.website && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.website}</p>
                    )}
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
                      Tax ID / VAT
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={editForm.timezone || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select timezone</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Australia/Sydney">Sydney</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'invoice' && showInvoiceSettings && (
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
                      placeholder="Thank you for your business! Payment due within 30 days."
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={editForm.currency || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select currency</option>
                      <option value="NGN">₦ Nigerian Naira</option>
                      <option value="USD">$ US Dollar</option>
                      <option value="EUR">€ Euro</option>
                      <option value="GBP">£ British Pound</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'bank' && showInvoiceSettings && (
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
                      Sort Code / Routing
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
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {unsavedChanges && (
                  <p className="text-xs text-amber-600 flex items-center mr-auto">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    You have unsaved changes
                  </p>
                )}
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Save Changes
                    </>
                  )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow 
                    icon={BuildingOfficeIcon}
                    label="Company Name" 
                    value={organization?.name} 
                  />
                  <InfoRow 
                    icon={IdentificationIcon}
                    label="Legal Name" 
                    value={organization?.legal_name} 
                  />
                  <InfoRow 
                    icon={EnvelopeIcon}
                    label="Email" 
                    value={organization?.email}
                    copyable 
                  />
                  <InfoRow 
                    icon={PhoneIcon}
                    label="Phone" 
                    value={organization?.phone}
                    copyable 
                  />
                  <InfoRow 
                    icon={GlobeAltIcon}
                    label="Website" 
                    value={organization?.website} 
                  />
                  <InfoRow 
                    icon={MapPinIcon}
                    label="Address" 
                    value={organization?.address} 
                  />
                  <InfoRow 
                    icon={MapPinIcon}
                    label="City" 
                    value={organization?.city} 
                  />
                  <InfoRow 
                    icon={MapPinIcon}
                    label="State" 
                    value={organization?.state} 
                  />
                  <InfoRow 
                    icon={MapPinIcon}
                    label="Postal Code" 
                    value={organization?.postal_code} 
                  />
                  <InfoRow 
                    icon={MapPinIcon}
                    label="Country" 
                    value={organization?.country} 
                  />
                  <InfoRow 
                    icon={IdentificationIcon}
                    label="Tax ID" 
                    value={organization?.tax_id}
                    copyable 
                  />
                  <InfoRow 
                    icon={IdentificationIcon}
                    label="Registration #" 
                    value={organization?.registration_number}
                    copyable 
                  />
                  {organization?.timezone && (
                    <InfoRow 
                      icon={ClockIcon}
                      label="Timezone" 
                      value={organization.timezone} 
                    />
                  )}
                </div>
              )}

              {activeTab === 'invoice' && showInvoiceSettings && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow 
                      icon={DocumentDuplicateIcon}
                      label="Invoice Footer" 
                      value={organization?.invoice_footer} 
                    />
                    <InfoRow 
                      icon={DocumentDuplicateIcon}
                      label="Payment Terms" 
                      value={organization?.invoice_terms} 
                    />
                    {organization?.currency && (
                      <InfoRow 
                        icon={BanknotesIcon}
                        label="Currency" 
                        value={organization.currency} 
                      />
                    )}
                  </div>
                  
                  {/* Invoice Preview */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invoice Preview</h4>
                    {generateInvoicePreview()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    >
                      <PrinterIcon className="w-4 h-4 mr-1" />
                      Print Preview
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'bank' && showInvoiceSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow 
                    icon={BanknotesIcon}
                    label="Bank Name" 
                    value={organization?.bank_name} 
                  />
                  <InfoRow 
                    icon={BanknotesIcon}
                    label="Account Name" 
                    value={organization?.bank_account_name} 
                  />
                  <InfoRow 
                    icon={BanknotesIcon}
                    label="Account Number" 
                    value={organization?.bank_account}
                    copyable 
                  />
                  <InfoRow 
                    icon={BanknotesIcon}
                    label="Sort Code" 
                    value={organization?.bank_sort_code}
                    copyable 
                  />
                  <InfoRow 
                    icon={BanknotesIcon}
                    label="SWIFT/BIC" 
                    value={organization?.bank_swift}
                    copyable 
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with metadata */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg text-xs text-gray-400 flex flex-wrap justify-between gap-2">
        <span>Organization ID: {orgId}</span>
        <div className="flex items-center space-x-3">
          {organization?.created_at && (
            <span className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              Created: {new Date(organization.created_at).toLocaleDateString()}
            </span>
          )}
          {organization?.updated_at && (
            <span className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              Updated: {new Date(organization.updated_at).toLocaleString()}
            </span>
          )}
        </div>
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