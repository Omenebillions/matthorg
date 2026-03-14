"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type Sale = { amount: number; created_at: string; organization_id: string };
type Expense = { amount: number; category: string; created_at: string; organization_id: string };
type InventoryItem = { category: string; quantity: number; item_name?: string; organization_id: string; status: string; listing_type?: string };
type Task = { status: string; organization_id: string };
type Attendance = { date: string; status: string; organization_id: string };

type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
};

export interface DashboardChartsProps {
  orgId: string;
  initialStats?: {
    totalSales: number;
    totalExpenses: number;
    inventoryCount: number;
    pendingTasks: number;
    attendanceToday: number;
    activeLeases: number;
    lowStock: number;
  };
  lowStockThreshold?: number;
}

interface SalesDataPoint { date: string; amount: number; }
interface ExpenseDataPoint { category: string; amount: number; }
interface CategoryDataPoint { category: string; value: number; }
interface TrendDataPoint { date: string; sales: number; expenses: number; }

// -----------------------------------------------------------------------------
// Constants & Helpers
// -----------------------------------------------------------------------------
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const formatCurrency = (value: number | string | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || isNaN(num)) return '₦0';
  return `₦${num.toLocaleString()}`;
};

const getISODate = (dateString: string): string => {
  return new Date(dateString).toISOString().split('T')[0];
};

// -----------------------------------------------------------------------------
// Skeleton Component (Moved to top - FIX 1)
// -----------------------------------------------------------------------------
function ChartsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-gray-100 rounded-xl"></div>
        <div className="h-80 bg-gray-100 rounded-xl"></div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stat Card Props Interface (FIX 2)
// -----------------------------------------------------------------------------
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'yellow' | 'red';
  subtitle?: string;
}

// -----------------------------------------------------------------------------
// Stat Card Component (FIX 3)
// -----------------------------------------------------------------------------
function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const isCurrency = title.toLowerCase().includes('sales') || title.toLowerCase().includes('expenses');
  const colorClass = color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600';
  
  return (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-2xl">{icon}</span>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colorClass}`}>
          {title}
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-2xl font-bold text-gray-800">
          {isCurrency ? formatCurrency(value) : value}
        </h4>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function DashboardCharts({
  orgId,
  initialStats,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD
}: DashboardChartsProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  // Refs with proper typing (FIX 4)
  const salesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expenseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inventoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [stats, setStats] = useState(initialStats || {
    totalSales: 0,
    totalExpenses: 0,
    inventoryCount: 0,
    pendingTasks: 0,
    attendanceToday: 0,
    activeLeases: 0,
    lowStock: 0
  });

  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ---------------------------------------------------------------------------
  // Data Loaders
  // ---------------------------------------------------------------------------
  const loadStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const [sales, exp, inv, task, att, lease, low] = await Promise.all([
      supabase.from('sales').select('amount').eq('organization_id', orgId),
      supabase.from('expenses').select('amount').eq('organization_id', orgId),
      supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'pending'),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('date', today).eq('status', 'present'),
      supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('listing_type', 'lease').eq('status', 'active'),
      supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).lt('quantity', lowStockThreshold).gt('quantity', 0)
    ]);

    setStats({
      totalSales: sales.data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
      totalExpenses: exp.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      inventoryCount: inv.count || 0,
      pendingTasks: task.count || 0,
      attendanceToday: att.count || 0,
      activeLeases: lease.count || 0,
      lowStock: low.count || 0
    });
  }, [orgId, lowStockThreshold, supabase]);

  const loadSalesData = useCallback(async () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('sales')
      .select('amount, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    const grouped: Record<string, number> = {};
    data?.forEach(sale => {
      const date = getISODate(sale.created_at);
      grouped[date] = (grouped[date] || 0) + sale.amount;
    });

    setSalesData(Object.entries(grouped).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)));
  }, [orgId, timeRange, supabase]);

  const loadExpenseData = useCallback(async () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('organization_id', orgId)
      .gte('created_at', startDate.toISOString());

    const grouped: Record<string, number> = {};
    data?.forEach(e => {
      const cat = e.category || 'Other';
      grouped[cat] = (grouped[cat] || 0) + e.amount;
    });

    setExpenseData(Object.entries(grouped).map(([category, amount]) => ({ category, amount })));
  }, [orgId, timeRange, supabase]);

  const loadCategoryData = useCallback(async () => {
    const { data } = await supabase.from('inventory').select('category, quantity').eq('organization_id', orgId);
    const grouped: Record<string, number> = {};
    data?.forEach(item => {
      const cat = item.category || 'Uncategorized';
      grouped[cat] = (grouped[cat] || 0) + (item.quantity || 0);
    });
    setCategoryData(Object.entries(grouped).map(([category, value]) => ({ category, value })));
  }, [orgId, supabase]);

  const loadTrendData = useCallback(async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const [sales, expenses] = await Promise.all([
      supabase.from('sales').select('amount, created_at').eq('organization_id', orgId).gte('created_at', startDate.toISOString()),
      supabase.from('expenses').select('amount, created_at').eq('organization_id', orgId).gte('created_at', startDate.toISOString())
    ]);

    const trends: Record<string, TrendDataPoint> = {};
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const s = d.toISOString().split('T')[0];
      trends[s] = { date: s, sales: 0, expenses: 0 };
    }

    sales.data?.forEach(s => { const dt = getISODate(s.created_at); if (trends[dt]) trends[dt].sales += s.amount; });
    expenses.data?.forEach(e => { const dt = getISODate(e.created_at); if (trends[dt]) trends[dt].expenses += e.amount; });

    setTrendData(Object.values(trends).sort((a, b) => a.date.localeCompare(b.date)));
  }, [orgId, supabase]);

  const loadAllData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadSalesData(), loadExpenseData(), loadCategoryData(), loadTrendData()]);
      setLastUpdated(new Date());
    } catch (err) {
      showToast('Error syncing dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, loadStats, loadSalesData, loadExpenseData, loadCategoryData, loadTrendData, showToast]);

  // ---------------------------------------------------------------------------
  // Real-time Handlers
  // ---------------------------------------------------------------------------
  const handleSalesUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({ ...prev, totalSales: prev.totalSales + (payload.new.amount || 0) }));
      if (salesTimeoutRef.current) clearTimeout(salesTimeoutRef.current);
      salesTimeoutRef.current = setTimeout(() => { loadSalesData(); loadTrendData(); }, 500);
      showToast('Sale recorded', 'success');
    }
  }, [loadSalesData, loadTrendData, showToast]);

  const handleInventoryUpdate = useCallback((payload: any) => {
    const threshold = lowStockThreshold;
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        inventoryCount: prev.inventoryCount + 1,
        lowStock: (payload.new.quantity < threshold) ? prev.lowStock + 1 : prev.lowStock
      }));
    } else if (payload.eventType === 'UPDATE') {
      const oldLow = payload.old.quantity < threshold;
      const newLow = payload.new.quantity < threshold;
      if (!oldLow && newLow) setStats(prev => ({ ...prev, lowStock: prev.lowStock + 1 }));
      if (oldLow && !newLow) setStats(prev => ({ ...prev, lowStock: prev.lowStock - 1 }));
    }
    loadCategoryData();
  }, [lowStockThreshold, loadCategoryData]);

  // ---------------------------------------------------------------------------
  // Subscriptions Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!orgId) return;
    loadAllData();

    const channels: RealtimeChannel[] = [];

    const salesSub = supabase.channel(`sales-${orgId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `organization_id=eq.${orgId}` }, handleSalesUpdate)
      .subscribe();
    
    const invSub = supabase.channel(`inv-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${orgId}` }, handleInventoryUpdate)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    channels.push(salesSub, invSub);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
      if (salesTimeoutRef.current) clearTimeout(salesTimeoutRef.current);
      if (expenseTimeoutRef.current) clearTimeout(expenseTimeoutRef.current);
      if (inventoryTimeoutRef.current) clearTimeout(inventoryTimeoutRef.current);
    };
  }, [orgId, supabase, handleSalesUpdate, handleInventoryUpdate, loadAllData]);

  if (loading) return <ChartsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Business Analytics</h2>
          <p className="text-sm text-gray-500">Auto-syncing: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs font-medium text-gray-500">{isLive ? 'LIVE' : 'OFFLINE'}</span>
          <button onClick={loadAllData} className="p-2 hover:bg-gray-100 rounded-full transition">🔄</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={stats.totalSales} icon="💰" color="blue" subtitle={`${salesData.length} entries`} />
        <StatCard title="Total Expenses" value={stats.totalExpenses} icon="📉" color="orange" subtitle={`Net: ${formatCurrency(stats.totalSales - stats.totalExpenses)}`} />
        <StatCard title="Inventory Items" value={stats.inventoryCount} icon="📦" color="green" subtitle={`${stats.lowStock} items low`} />
        <StatCard title="Staff Present" value={stats.attendanceToday} icon="👥" color="purple" subtitle="Active today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                <YAxis tickFormatter={formatCurrency} fontSize={12} />
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Inventory Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}