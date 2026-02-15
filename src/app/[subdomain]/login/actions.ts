'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(subdomain: string, formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Authenticate the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return redirect(`/${subdomain}/login?error=Invalid credentials`)
  }

  // 2. Multi-tenant Check: Verify user belongs to this subdomain/org
  // This matches your RLS logic which expects a valid organization link
  const { data: orgMember, error: orgError } = await supabase
    .from('profiles') // or your specific members table
    .select('organization_id, organizations!inner(subdomain)')
    .eq('id', authData.user.id)
    .eq('organizations.subdomain', subdomain)
    .single()

  if (orgError || !orgMember) {
    await supabase.auth.signOut()
    return redirect(`/${subdomain}/login?error=Unauthorized for this organization`)
  }

  return redirect(`/${subdomain}/dashboard`)
}
