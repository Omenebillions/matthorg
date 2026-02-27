import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

// Define types for better TypeScript support
interface Sale {
  amount: number;
  created_at: string;
}

interface Expense {
  amount: number;
  category: string;
  created_at: string;
}

interface Staff {
  id: string;
  full_name: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  min_stock?: number;
}

export default async function DashboardPage({ 
  params 
}: { 
  params: Promise<{ subdomain: string }> 
}) {
  // 1. Unpack params for Next.js 15+
  const { subdomain } = await params;
  
  // 2. Initialize Supabase Server Client
  const supabase = await createClient();
  
  // 3. Get organization details based on the subdomain from the URL
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('subdomain', subdomain)
    .single();
  
  // If no org found with that subdomain, show 404
  if (!org) notFound();

  // 4. Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 5. Get staff profile - Updated to use 'id' column as per your schema
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id) 
    .eq('organization_id', org.id)
    .single();

  // If user isn't part of this organization, send them back to login
  if (!staff) redirect('/login');

  // 6. Fetch dashboard data using the organization_id
  
  // Sales
  const { data: sales } = await supabase
    .from('sales')
    .select('amount, created_at')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category, created_at')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Inventory count
  const { count: inventoryCount } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  // Low stock items
  const { data: lowStock } = await supabase
    .from('inventory')
    .select('*')
    .eq('organization_id', org.id)
    .lt('quantity', 10)
    .limit(5);

  // Staff list
  const { data: staffList } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('organization_id', org.id)
    .limit(10);

  // Recent Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Pending Tasks Count
  const { count: pendingTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'pending');

  // Calculate totals
  const totalSales = (sales as Sale[] | null)?.reduce((sum: number, sale: Sale) => sum + sale.amount, 0) || 0;
  const totalExpenses = (expenses as Expense[] | null)?.reduce((sum: number, exp: Expense) => sum + exp.amount, 0) || 0;

  return (
    <DashboardClient 
      org={org}
      totalSales={totalSales}
      totalExpenses={totalExpenses}
      inventoryCount={inventoryCount || 0}
      recentSales={sales || []}
      recentExpenses={expenses || []}
      lowStock={lowStock || []}
      recentStaff={staffList || []}
      recentTasks={tasks || []}
      pendingTasks={pendingTasks || 0}
      activeStaff={staffList?.length || 0}
    />
  );
}