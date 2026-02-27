import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

// Keep your interfaces for type safety
interface Sale { amount: number; created_at: string; }
interface Expense { amount: number; category: string; created_at: string; }

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // 1. Get user session - This is our starting point now
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get staff profile using user.id 
  // We use this to find out WHICH organization this user belongs to
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id) // Using 'id' as we discussed earlier
    .single()

  if (!staff) redirect('/login')

  // 3. Get organization details using the ID from the staff profile
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', staff.organization_id)
    .single()
  
  if (!org) notFound()

  // 4. Fetch all the data using the org.id (Exact same logic as your old file)
  const [sales, expenses, invCount, lowStock, staffList, tasks, pendingTasks] = await Promise.all([
    supabase.from('sales').select('amount, created_at').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('expenses').select('amount, category, created_at').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
    supabase.from('inventory').select('*').eq('organization_id', org.id).lt('quantity', 10).limit(5),
    supabase.from('staff_profiles').select('*').eq('organization_id', org.id).limit(10),
    supabase.from('tasks').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'pending')
  ])

  // Calculate totals
  const totalSales = (sales.data as Sale[] | null)?.reduce((sum, sale) => sum + sale.amount, 0) || 0
  const totalExpenses = (expenses.data as Expense[] | null)?.reduce((sum, exp) => sum + exp.amount, 0) || 0

  return (
    <DashboardClient 
      org={org} // This will still pass "Tidy" to the client!
      totalSales={totalSales}
      totalExpenses={totalExpenses}
      inventoryCount={invCount.count || 0}
      recentSales={sales.data || []}
      recentExpenses={expenses.data || []}
      lowStock={lowStock.data || []}
      recentStaff={staffList.data || []}
      recentTasks={tasks.data || []}
      pendingTasks={pendingTasks.count || 0}
      activeStaff={staffList.data?.length || 0}
    />
  )
}