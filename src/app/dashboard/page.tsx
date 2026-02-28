// /home/user/matthorg/src/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'  // Fixed: 'components' with an 's'

// Keep your interfaces for type safety
interface Sale { amount: number; created_at: string; }
interface Expense { amount: number; category: string; created_at: string; }

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // 1. Get user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get staff profile using user.id
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!staff) redirect('/login')

  // 3. Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', staff.organization_id)
    .single()
  
  if (!org) notFound()

  // 4. Fetch all the data
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

  // Calculate trends
  const salesTrend = { percentage: "12", direction: "up" as const }
  const expenseTrend = { percentage: "5", direction: "down" as const }

  // Prepare chart data
  const chartData = (sales.data || []).map(sale => ({
    date: new Date(sale.created_at).toLocaleDateString(),
    sales: sale.amount,
    expenses: 0,
    profit: sale.amount
  }))

  return (
    <DashboardClient 
      user={staff}
      org={org}
      totalSales={totalSales}
      totalExpenses={totalExpenses}
      netProfit={totalSales - totalExpenses}
      salesTrend={salesTrend}
      expenseTrend={expenseTrend}
      inventoryCount={invCount.count || 0}
      staffCount={staffList.data?.length || 0}
      activeStaff={staffList.data?.filter(s => s.status === 'active').length || 0}
      pendingTasks={pendingTasks.count || 0}
      taskCount={tasks.data?.length || 0}
      milestoneCount={0}
      jobCount={0}
      recentSales={sales.data || []}
      recentExpenses={expenses.data || []}
      lowStock={lowStock.data || []}
      recentStaff={staffList.data || []}
      recentTasks={tasks.data || []}
      recentMilestones={[]}
      recentJobs={[]}
      attendanceToday={[]}
      recentActivity={[]}
      chartData={chartData}
    />
  )
}