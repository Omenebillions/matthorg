// /home/user/matthorg/src/app/dashboard/tasks/new/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NewTaskForm from './NewTaskForm'

export default async function NewTaskPage() {
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

  // 3. Fetch team members for assignment dropdown
  const { data: team } = await supabase
    .from('staff_profiles')
    .select('id, first_name, last_name')
    .eq('organization_id', staff.organization_id)
    .order('first_name')

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
      <p className="text-gray-500 mb-8">Add a task, job, or milestone to your workflow.</p>
      
      <NewTaskForm 
        orgId={staff.organization_id}
        team={team || []}
        userId={user.id}
      />
    </div>
  )
}