// /home/user/matthorg/src/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

// Types for better type safety
interface Sale { 
  id: string;
  amount: number; 
  created_at: string;
  customer_name?: string;
  payment_method?: string;
}

interface Expense { 
  id: string;
  amount: number; 
  category: string; 
  created_at: string;
  description?: string;
  vendor?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
  last_seen?: string;
}

interface Inventory {
  id: string;
  item_name: string;
  quantity: number;
  reorder_point?: number;
  category?: string;
}

interface DashboardData {
  user: any;
  org: any;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesTrend: { percentage: string; direction: 'up' | 'down' | 'flat' };
  expenseTrend: { percentage: string; direction: 'up' | 'down' | 'flat' };
  inventoryCount: number;
  staffCount: number;
  activeStaff: number;
  pendingTasks: number;
  taskCount: number;
  milestoneCount: number;
  jobCount: number;
  recentSales: Sale[];
  recentExpenses: Expense[];
  lowStock: Inventory[];
  recentStaff: Staff[];
  recentTasks: Task[];
  recentMilestones: any[];
  recentJobs: any[];
  attendanceToday: any[];
  recentActivity: any[];
  chartData: any[];
}

// Helper function to calculate trends
function calculateTrend(data: any[] | null, field: string = 'amount'): { percentage: string; direction: 'up' | 'down' | 'flat' } {
  if (!data || data.length < 2) {
    return { percentage: "0", direction: "flat" };
  }
  
  const first = data[data.length - 1]?.[field] || 0;
  const last = data[0]?.[field] || 0;
  
  if (first === 0) return { percentage: "0", direction: "flat" };
  
  const change = ((last - first) / first) * 100;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  
  return {
    percentage: Math.abs(Math.round(change)).toString(),
    direction
  };
}

// Helper to get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  try {
    // 1. Get user session with error handling
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Auth error:', userError)
      redirect('/login?error=Authentication failed')
    }
    if (!user) redirect('/login')

    // 2. Get staff profile using user.id
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*, role:roles(name)')
      .eq('id', user.id)
      .single()

    if (staffError || !staff) {
      console.error('Staff profile error:', staffError)
      redirect('/login?error=Staff profile not found')
    }

    // 3. Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', staff.organization_id)
      .single()
    
    if (orgError || !org) {
      console.error('Organization error:', orgError)
      notFound()
    }

    // 4. Fetch all data with error handling
    const [
      salesResult,
      expensesResult,
      invCountResult,
      lowStockResult,
      staffListResult,
      tasksResult,
      pendingTasksResult,
      recentActivityResult,
      attendanceResult,
      milestonesResult,
      jobsResult
    ] = await Promise.allSettled([
      // Sales - last 30 days for trends
      supabase
        .from('sales')
        .select('id, amount, created_at, customer_name, payment_method')
        .eq('organization_id', org.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Expenses - last 30 days
      supabase
        .from('expenses')
        .select('id, amount, category, created_at, description, vendor')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Inventory count
      supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'active'),
      
      // Low stock items (below reorder point or < 10)
      supabase
        .from('inventory')
        .select('id, item_name, quantity, reorder_point, category')
        .eq('organization_id', org.id)
        .or(`quantity.lt.10,and(quantity.lte.reorder_point)`)
        .order('quantity', { ascending: true })
        .limit(10),
      
      // Staff list
      supabase
        .from('staff_profiles')
        .select('id, first_name, last_name, email, role, status, avatar_url, last_seen')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Recent tasks
      supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, created_at, assignee_id')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Pending tasks count
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'pending'),
      
      // Recent activity (combined sales and expenses)
      Promise.all([
        supabase
          .from('sales')
          .select('id, amount, created_at, customer_name, payment_method')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('expenses')
          .select('id, amount, category, created_at, description, vendor')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]),
      
      // Today's attendance
      supabase
        .from('attendance')
        .select('id, staff_id, check_in, check_out, status')
        .eq('organization_id', org.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .order('check_in', { ascending: false }),
      
      // Milestones count
      supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .neq('status', 'completed'),
      
      // Jobs count
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .neq('status', 'completed')
    ]);

    // Process results with fallbacks for failed queries
    const sales = salesResult.status === 'fulfilled' ? salesResult.value : { data: [], error: null };
    const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value : { data: [], error: null };
    const invCount = invCountResult.status === 'fulfilled' ? invCountResult.value : { count: 0, error: null };
    const lowStock = lowStockResult.status === 'fulfilled' ? lowStockResult.value : { data: [], error: null };
    const staffList = staffListResult.status === 'fulfilled' ? staffListResult.value : { data: [], error: null };
    const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : { data: [], error: null };
    const pendingTasks = pendingTasksResult.status === 'fulfilled' ? pendingTasksResult.value : { count: 0, error: null };
    const recentActivity = recentActivityResult.status === 'fulfilled' ? recentActivityResult.value : [[], []];
    const attendance = attendanceResult.status === 'fulfilled' ? attendanceResult.value : { data: [], error: null };
    const milestones = milestonesResult.status === 'fulfilled' ? milestonesResult.value : { count: 0, error: null };
    const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : { count: 0, error: null };

    // Calculate totals with proper typing
    const totalSales = (sales.data as Sale[] | null)?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0
    const totalExpenses = (expenses.data as Expense[] | null)?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0

    // Calculate trends from actual data
    const salesTrend = calculateTrend(sales.data as Sale[] | null, 'amount')
    const expenseTrend = calculateTrend(expenses.data as Expense[] | null, 'amount')

    // Prepare chart data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const salesByDay = (sales.data || []).reduce((acc: any, sale) => {
      const day = sale.created_at.split('T')[0]
      acc[day] = (acc[day] || 0) + sale.amount
      return acc
    }, {})

    const expensesByDay = (expenses.data || []).reduce((acc: any, exp) => {
      const day = exp.created_at.split('T')[0]
      acc[day] = (acc[day] || 0) + exp.amount
      return acc
    }, {})

    const chartData = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: salesByDay[date] || 0,
      expenses: expensesByDay[date] || 0,
      profit: (salesByDay[date] || 0) - (expensesByDay[date] || 0)
    }))

    // Calculate active staff
    const activeStaff = staffList.data?.filter(s => s.status === 'active').length || 0

    // Combine recent activity for the activity feed
    const combinedActivity = [
      ...(sales.data || []).map(s => ({ ...s, type: 'sale' })),
      ...(expenses.data || []).map(e => ({ ...e, type: 'expense' }))
    ].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 20)

    // Prepare props for DashboardClient
    const dashboardProps: DashboardData = {
      user: {
        ...staff,
        full_name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.email,
        greeting: getGreeting()
      },
      org: {
        ...org,
        plan: org.plan || 'Free',
        subscription_status: org.subscription_status || 'active'
      },
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      salesTrend,
      expenseTrend,
      inventoryCount: invCount.count || 0,
      staffCount: staffList.data?.length || 0,
      activeStaff,
      pendingTasks: pendingTasks.count || 0,
      taskCount: tasks.data?.length || 0,
      milestoneCount: milestones.count || 0,
      jobCount: jobs.count || 0,
      recentSales: (sales.data || []).slice(0, 10),
      recentExpenses: (expenses.data || []).slice(0, 10),
      lowStock: lowStock.data || [],
      recentStaff: staffList.data || [],
      recentTasks: tasks.data || [],
      recentMilestones: [],
      recentJobs: [],
      attendanceToday: attendance.data || [],
      recentActivity: combinedActivity,
      chartData
    }

    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient {...dashboardProps} />
      </Suspense>
    )

  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We couldn't load your dashboard. Please try again.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </a>
        </div>
      </div>
    )
  }
}