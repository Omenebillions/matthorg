// /home/user/matthorg/src/app/(main)/invite/[token]/page.tsx
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import InviteSignupForm from './InviteSignupForm'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = await createClient() // ✅ Add await
  
  // Check if invitation is valid
  const { data: invite } = await supabase
    .from('staff_invitations')
    .select(`
      *,
      organizations (
        id,
        name,
        logo_url
      )
    `)
    .eq('token', params.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    notFound()
  }

  return <InviteSignupForm invite={invite} />
}