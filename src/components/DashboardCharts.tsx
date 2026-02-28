"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
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

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function DashboardCharts({ orgId, initialStats }: DashboardChartsProps) {
  const supabase = createClient();
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
  
  // Chart data states
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Load initial data and setup real-time
  useEffect(() => {
    if (!orgId) return;

    loadAllData();
    setupRealtimeSubscriptions();

    return () => {
      supabase.removeAllChannels();
    };
  }, [orgId, timeRange]);

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Sales channel
    supabase
      .channel('sales-charts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          console.log('📊 Sales update:', payload);
          handleSalesUpdate(payload);
        }
      )
      .subscribe();

    // Expenses channel
    supabase
      .channel('expenses-charts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          console.log('💰 Expense update:', payload);
          handleExpenseUpdate(payload);
        }
      )
      .subscribe();

    // Inventory channel
    supabase
      .channel('inventory-charts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          console.log('📦 Inventory update:', payload);
          handleInventoryUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadSalesData(),
      loadExpenseData(),
      loadCategoryData(),
      loadTrendData()
    ]);
    setLoading(false);
  };

  // Load main stats
  const loadStats = async () => {
    // Get sales total
    const { data: sales } = await supabase
      .from('sales')
      .select('amount')
      .eq('organization_id', orgId);

    // Get expenses total
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', orgId);

    // Get inventory count
    const { count: inventoryCount } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active');

    // Get pending tasks
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'pending');

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { count: attendanceToday } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('date', today)
      .eq('status', 'present');

    // Get active leases
    const { count: activeLeases } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('listing_type', 'lease')
      .eq('status', 'active');

    // Get low stock items
    const { count: lowStock } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .lt('quantity', 5)
      .gt('quantity', 0);

    setStats({
      totalSales: sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
      totalExpenses: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      inventoryCount: inventoryCount || 0,
      pendingTasks: pendingTasks || 0,
      attendanceToday: attendanceToday || 0,
      activeLeases: activeLeases || 0,
      lowStock: lowStock || 0
    });
  };

  // Load sales data for chart
  const loadSalesData = async () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('sales')
      .select('amount, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Group by date
    const grouped = (data || []).reduce((acc: any, sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += sale.amount;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount
    }));

    setSalesData(chartData);
  };

  // Load expense data for chart
  const loadExpenseData = async () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('expenses')
      .select('amount, category, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate.toISOString());

    // Group by category
    const grouped = (data || []).reduce((acc: any, expense: any) => {
      const cat = expense.category || 'other';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += expense.amount;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([category, amount]) => ({
      category,
      amount
    }));

    setExpenseData(chartData);
  };

  // Load category distribution
  const loadCategoryData = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('category, quantity')
      .eq('organization_id', orgId);

    const grouped = (data || []).reduce((acc: any, item: any) => {
      const cat = item.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += item.quantity || 0;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([category, value]) => ({
      category,
      value
    }));

    setCategoryData(chartData);
  };

  // Load trend data
  const loadTrendData = async () => {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [sales, expenses] = await Promise.all([
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

    // Create daily trends
    const trends: any = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      trends[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
    }

    sales.data?.forEach((sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (trends[date]) trends[date].sales += sale.amount;
    });

    expenses.data?.forEach((expense: any) => {
      const date = new Date(expense.created_at).toLocaleDateString();
      if (trends[date]) trends[date].expenses += expense.amount;
    });

    setTrendData(Object.values(trends).reverse());
  };

  // Handle real-time updates
  const handleSalesUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        totalSales: prev.totalSales + (payload.new.amount || 0)
      }));
      loadSalesData(); // Refresh chart data
      loadTrendData();
    }
  };

  const handleExpenseUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setStats(prev => ({
        ...prev,
        totalExpenses: prev.totalExpenses + (payload.new.amount || 0)
      }));
      loadExpenseData();
      loadTrendData();
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
        // Trigger alert
      }
    }
    loadCategoryData();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Status Indicator */}
      <div className="flex justify-end items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-500">
          {isLive ? 'Live updates active' : 'Connecting...'}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Total Sales</p>
              <p className="text-2xl font-bold mt-1">
                ₦{stats.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-2 text-xs opacity-75">
            Last 30 days
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">
                ₦{stats.totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">📤</div>
          </div>
          <div className="mt-2 text-xs opacity-75">
            Net: ₦{(stats.totalSales - stats.totalExpenses).toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Inventory</p>
              <p className="text-2xl font-bold mt-1">{stats.inventoryCount}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
          <div className="mt-2 text-xs opacity-75">
            {stats.lowStock} low stock items
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Tasks</p>
              <p className="text-2xl font-bold mt-1">{stats.pendingTasks}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
          <div className="mt-2 text-xs opacity-75">
            {stats.attendanceToday} staff present today
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end space-x-2">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded ${
              timeRange === range
                ? 'bg-blue-600 text-white'
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
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#93c5fd" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#fca5a5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales vs Expenses Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded shadow flex items-center justify-between">
          <span className="text-sm text-gray-600">Active Leases</span>
          <span className="text-lg font-bold text-blue-600">{stats.activeLeases}</span>
        </div>
        <div className="bg-white p-3 rounded shadow flex items-center justify-between">
          <span className="text-sm text-gray-600">Low Stock Alert</span>
          <span className="text-lg font-bold text-yellow-600">{stats.lowStock}</span>
        </div>
        <div className="bg-white p-3 rounded shadow flex items-center justify-between">
          <span className="text-sm text-gray-600">Attendance Today</span>
          <span className="text-lg font-bold text-green-600">{stats.attendanceToday}</span>
        </div>
      </div>
    </div>
  );
}