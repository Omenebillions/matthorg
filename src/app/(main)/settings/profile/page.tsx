// /home/user/matthorg/src/app/(main)/settings/profile/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient() // ✅ Add await
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current profile
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ProfileForm profile={profile} />
}
