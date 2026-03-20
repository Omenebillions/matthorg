// /home/user/matthorg/src/app/dashboard/settings/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get the user's staff profile to find their organization
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!staff) redirect('/dashboard')

  // 3. Fetch the organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', staff.organization_id)
    .single()

  return (
    <SettingsClient 
      user={user}
      org={org} 
      staff={staff}
    />
  )
}