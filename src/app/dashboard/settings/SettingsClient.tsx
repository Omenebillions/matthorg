// /home/user/matthorg/src/app/dashboard/settings/SettingsClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import OrganizationAddress from '@/components/OrganizationAddress'
import Link from 'next/link'

interface SettingsClientProps {
  user: any
  org: any
  staff: any
}

export default function SettingsClient({ user, org, staff }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'organization', label: 'Organization', icon: '🏢' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💰' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Logout Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loggingOut ? 'Logging out...' : (
            <>
              <span>🚪</span>
              Logout
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{user.user_metadata?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-gray-900 capitalize">{staff.role || 'Staff'}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Profile editing coming soon. For now, you can update your name in the organization settings.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'organization' && (
          <OrganizationAddress orgId={org.id} />
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Team Management</h2>
            <Link 
              href="/staff" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage Team Members
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Go to the Staff page to add, edit, or remove team members.
            </p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Billing & Plan</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Current Plan: <span className="text-blue-600">Free</span></p>
              <p className="text-sm text-gray-600 mt-1">You are on the free plan.</p>
            </div>
            <p className="text-sm text-gray-500">Billing integration coming soon.</p>
          </div>
        )}
      </div>

      {/* Footer with Organization ID for reference */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Organization ID: {org.id}
      </p>
    </div>
  )
}