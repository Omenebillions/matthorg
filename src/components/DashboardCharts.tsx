"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

// Types for chart data
interface SalesDataPoint {
  date: string;
  amount: number;
}

interface ExpenseDataPoint {
  category: string;
  amount: number;
}

interface CategoryDataPoint {
  category: string;
  value: number;
}

interface TrendDataPoint {
  date: string;
  sales: number;
  expenses: number;
}

// Custom tooltip formatter with proper type handling
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '₦0';
  return `₦${value.toLocaleString()}`;
};

// Loading skeleton
function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Component with proper typing
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: keyof typeof colorClasses;
  trend?: number;
  subtitle?: string;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-orange-500 to-orange-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
} as const;

function StatCard({ title, value, icon, color, trend, subtitle }: StatCardProps) {
  const isCurrency = title.includes('Sales') || title.includes('Expenses');
  const displayValue = isCurrency ? `₦${value.toLocaleString()}` : value.toLocaleString();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow text-white`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{displayValue}</p>
          {trend !== undefined && (
            <p className="text-xs mt-1 opacity-75">
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {subtitle && (
        <div className="mt-2 text-xs opacity-75">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardCharts({ orgId, initialStats }: DashboardChartsProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
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
  
  // Chart data states with proper typing
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadSalesData(),
        loadExpenseData(),
        loadCategoryData(),
        loadTrendData()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Load main stats
  const loadStats = async () => {
    try {
      // Get sales total
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('amount')
        .eq('organization_id', orgId);

      if (salesError) throw salesError;

      // Get expenses total
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', orgId);

      if (expensesError) throw expensesError;

      // Get inventory count
      const { count: inventoryCount, error: inventoryError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active');

      if (inventoryError) throw inventoryError;

      // Get pending tasks
      const { count: pendingTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'pending');

      if (tasksError) throw tasksError;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { count: attendanceToday, error: attendanceError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('date', today)
        .eq('status', 'present');

      if (attendanceError) throw attendanceError;

      // Get active leases
      const { count: activeLeases, error: leasesError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('listing_type', 'lease')
        .eq('status', 'active');

      if (leasesError) throw leasesError;

      // Get low stock items
      const { count: lowStock, error: lowStockError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .lt('quantity', 5)
        .gt('quantity', 0);

      if (lowStockError) throw lowStockError;

      setStats({
        totalSales: sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
        totalExpenses: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        inventoryCount: inventoryCount || 0,
        pendingTasks: pendingTasks || 0,
        attendanceToday: attendanceToday || 0,
        activeLeases: activeLeases || 0,
        lowStock: lowStock || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  };

  // Load sales data for chart
  const loadSalesData = async () => {
    try {
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('sales')
        .select('amount, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const grouped = (data || []).reduce((acc: Record<string, number>, sale: any) => {
        const date = new Date(sale.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + sale.amount;
        return acc;
      }, {});

      const chartData: SalesDataPoint[] = Object.entries(grouped).map(([date, amount]) => ({
        date,
        amount: amount as number
      }));

      setSalesData(chartData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  // Load expense data for chart
  const loadExpenseData = async () => {
    try {
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by category
      const grouped = (data || []).reduce((acc: Record<string, number>, expense: any) => {
        const cat = expense.category || 'other';
        acc[cat] = (acc[cat] || 0) + expense.amount;
        return acc;
      }, {});

      const chartData: ExpenseDataPoint[] = Object.entries(grouped).map(([category, amount]) => ({
        category,
        amount: amount as number
      }));

      setExpenseData(chartData);
    } catch (error) {
      console.error('Error loading expense data:', error);
    }
  };

  // Load category distribution
  const loadCategoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('category, quantity')
        .eq('organization_id', orgId);

      if (error) throw error;

      const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
        const cat = item.category || 'uncategorized';
        acc[cat] = (acc[cat] || 0) + (item.quantity || 0);
        return acc;
      }, {});

      const chartData: CategoryDataPoint[] = Object.entries(grouped).map(([category, value]) => ({
        category,
        value: value as number
      }));

      setCategoryData(chartData);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  // Load trend data
  const loadTrendData = async () => {
    try {
      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [salesResult, expensesResult] = await Promise.all([
        supabase
          .from('sales')
          .select('amount, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('expenses')
          .select('amount, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', startDate.toISOString())
      ]);

      if (salesResult.error) throw salesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      // Create daily trends
      const trends: Record<string, TrendDataPoint> = {};
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        trends[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
      }

      salesResult.data?.forEach((sale: any) => {
        const date = new Date(sale.created_at).toLocaleDateString();
        if (trends[date]) trends[date].sales += sale.amount;
      });

      expensesResult.data?.forEach((expense: any) => {
        const date = new Date(expense.created_at).toLocaleDateString();
        if (trends[date]) trends[date].expenses += expense.amount;
      });

      setTrendData(Object.values(trends).reverse());
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!orgId) return;

    loadAllData();

    // Sales channel
    const salesChannel = supabase
      .channel('sales-charts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales', 
          filter: `organization_id=eq.${orgId}` 
        },
        (payload) => {
          console.log('📊 Sales update:', payload);
          handleSalesUpdate(payload);
        }
      )
      .subscribe();

    // Expenses channel
    const expensesChannel = supabase
      .channel('expenses-charts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'expenses', 
          filter: `organization_id=eq.${orgId}` 
        },
        (payload) => {
          console.log('💰 Expense update:', payload);
          handleExpenseUpdate(payload);
        }
      )
      .subscribe();

    // Inventory channel
    const inventoryChannel = supabase
      .channel('inventory-charts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory', 
          filter: `organization_id=eq.${orgId}` 
        },
        (payload) => {
          console.log('📦 Inventory update:', payload);
          handleInventoryUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Tasks channel
    const tasksChannel = supabase
      .channel('tasks-charts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks', 
          filter: `organization_id=eq.${orgId}` 
        },
        (payload) => {
          console.log('✅ Task update:', payload);
          handleTaskUpdate(payload);
        }
      )
      .subscribe();

    // Attendance channel
    const attendanceChannel = supabase
      .channel('attendance-charts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance', 
          filter: `organization_id=eq.${orgId}` 
        },
        (payload) => {
          console.log('⏰ Attendance update:', payload);
          handleAttendanceUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, [orgId, timeRange]);

  // Handle real-time updates
  const handleSalesUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        totalSales: prev.totalSales + (payload.new.amount || 0)
      }));
      // Debounce chart refreshes
      setTimeout(() => {
        loadSalesData();
        loadTrendData();
      }, 100);
      showToast('New sale recorded', 'success');
    }
  };

  const handleExpenseUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        totalExpenses: prev.totalExpenses + (payload.new.amount || 0)
      }));
      setTimeout(() => {
        loadExpenseData();
        loadTrendData();
      }, 100);
      showToast('New expense added', 'info');
    }
  };

  const handleInventoryUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        inventoryCount: prev.inventoryCount + 1
      }));
    } else if (payload.eventType === 'UPDATE') {
      // Check for low stock
      if (payload.new.quantity < 5 && payload.new.quantity > 0) {
        showToast(`Low stock alert: ${payload.new.item_name}`, 'warning');
      }
    }
    setTimeout(() => {
      loadCategoryData();
      // Reload low stock count
      supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .lt('quantity', 5)
        .gt('quantity', 0)
        .then(({ count }) => {
          setStats(prev => ({ ...prev, lowStock: count || 0 }));
        });
    }, 100);
  };

  const handleTaskUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      // Update pending tasks count
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'pending')
        .then(({ count }) => {
          setStats(prev => ({ ...prev, pendingTasks: count || 0 }));
        });
    }
  };

  const handleAttendanceUpdate = (payload: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (payload.new.date === today && payload.new.status === 'present') {
      setStats(prev => ({
        ...prev,
        attendanceToday: prev.attendanceToday + 1
      }));
    }
  };

  if (loading) {
    return <ChartsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status and Last Updated */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard Analytics</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live updates active' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={loadAllData}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          icon="💰"
          color="blue"
          trend={12.5}
          subtitle={`${salesData.length} transactions`}
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon="📤"
          color="orange"
          trend={-5.2}
          subtitle={`Net: ₦${(stats.totalSales - stats.totalExpenses).toLocaleString()}`}
        />
        <StatCard
          title="Inventory"
          value={stats.inventoryCount}
          icon="📦"
          color="green"
          subtitle={`${stats.lowStock} low stock items`}
        />
        <StatCard
          title="Tasks"
          value={stats.pendingTasks}
          icon="✅"
          color="purple"
          subtitle={`${stats.attendanceToday} staff present`}
        />
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end space-x-2">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              timeRange === range
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value: number | undefined) => [formatCurrency(value), '']} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorSales)" 
                  name="Sales"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  fillOpacity={1}
                  fill="url(#colorExpenses)" 
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value: number | undefined) => [formatCurrency(value), 'Amount']} 
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {salesData.slice(-7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.category}: ₦${entry.amount?.toLocaleString() || '0'}`}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number | undefined) => [formatCurrency(value), 'Amount']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Active Leases</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeLeases}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Revenue from leases</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Low Stock Alert</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Items below reorder point</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Attendance Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.attendanceToday}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Staff currently on site</p>
        </motion.div>
      </div>
    </div>
  );
}