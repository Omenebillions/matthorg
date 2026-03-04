// /home/user/matthorg/src/components/dashboard/StatsCards.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Define your actual database types
interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'on-leave' | 'inactive' | 'pending' | 'suspended';
  department?: string | null;
  hire_date?: string | null;
  created_at: string;
  employment_type?: 'full-time' | 'part-time' | 'contract' | null;
  phone?: string | null;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress' | 'cancelled' | 'blocked';
  assigned_to?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface Sale {
  id: string;
  amount: number;
  total_amount?: number;
  created_at: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  listing_type: 'sale' | 'lease' | 'both';
  status: 'active' | 'inactive';
  sale_price?: number | null;
  lease_price_monthly?: number | null;
  reorder_point?: number | null;
  category?: string | null;
}

interface Stats {
  // Inventory stats
  totalProducts: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  activeLeases: number;
  
  // Sales stats
  totalSales: number;
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  averageSale: number;
  
  // Staff stats
  totalStaff: number;
  activeStaff: number;
  staffOnLeave: number;
  newStaffThisMonth: number;
  departments: number;
  staffByRole: Record<string, number>;
  
  // Task stats
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  urgentTasks: number;
  
  // Performance metrics
  taskCompletionRate: number;
  staffProductivity: number;
  inventoryTurnover: number;
}

interface StatsCardsProps {
  organizationId: string;
  onStatsUpdate?: () => void;
  refreshInterval?: number; // in milliseconds
}

// Loading skeleton
function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  color = 'blue',
  trend,
  onClick,
  loading = false
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
  subtitle: string; 
  color?: 'blue' | 'green' | 'purple' | 'indigo' | 'yellow' | 'orange' | 'red' | 'teal' | 'pink';
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  onClick?: () => void;
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">{subtitle}</p>
            {trend && (
              <span className={`text-xs font-medium ${trendColors[trend.direction]}`}>
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} 
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// Specialized card for Low Stock
const LowStockCard = ({ lowStock, outOfStock, onClick }: { lowStock: number; outOfStock: number; onClick?: () => void }) => {
  const total = lowStock + outOfStock;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer ${
        total > 0 ? 'border-yellow-200' : 'border-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">Stock Alerts</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{total}</p>
          <div className="flex items-center gap-2 mt-1">
            {lowStock > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {lowStock} low
              </span>
            )}
            {outOfStock > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {outOfStock} out
              </span>
            )}
            {total === 0 && (
              <span className="text-xs text-green-600">✅ All good</span>
            )}
          </div>
        </div>
        <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
        </div>
      </div>
    </motion.div>
  );
};

// Specialized card for Overdue Tasks
const OverdueTaskCard = ({ overdue, urgent, onClick }: { overdue: number; urgent: number; onClick?: () => void }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer ${
        overdue > 0 || urgent > 0 ? 'border-red-200' : 'border-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">Task Alerts</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{overdue + urgent}</p>
          <div className="flex items-center gap-2 mt-1">
            {overdue > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {overdue} overdue
              </span>
            )}
            {urgent > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {urgent} urgent
              </span>
            )}
            {overdue === 0 && urgent === 0 && (
              <span className="text-xs text-green-600">✅ On track</span>
            )}
          </div>
        </div>
        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
          <ClockIcon className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </motion.div>
  );
};

export function StatsCards({ organizationId, onStatsUpdate, refreshInterval = 30000 }: StatsCardsProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    activeLeases: 0,
    totalSales: 0,
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    averageSale: 0,
    totalStaff: 0,
    activeStaff: 0,
    staffOnLeave: 0,
    newStaffThisMonth: 0,
    departments: 0,
    staffByRole: {},
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0,
    taskCompletionRate: 0,
    staffProductivity: 0,
    inventoryTurnover: 0,
  });

  // Fetch all data
  const fetchData = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', organizationId);

      if (inventoryError) throw inventoryError;
      setInventory(inventoryData || []);

      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('organization_id', organizationId);

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('organization_id', organizationId);

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('Error fetching stats data:', error);
      showToast(error.message || 'Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [organizationId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!organizationId) return;

    const channels = [
      supabase
        .channel('stats-inventory')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${organizationId}` }, handleDataChange)
        .subscribe(),
      supabase
        .channel('stats-sales')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `organization_id=eq.${organizationId}` }, handleDataChange)
        .subscribe(),
      supabase
        .channel('stats-staff')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_profiles', filter: `organization_id=eq.${organizationId}` }, handleDataChange)
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        }),
      supabase
        .channel('stats-tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${organizationId}` }, handleDataChange)
        .subscribe(),
    ];

    // Periodic refresh
    const interval = setInterval(fetchData, refreshInterval);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      clearInterval(interval);
    };
  }, [organizationId, refreshInterval]);

  const handleDataChange = () => {
    fetchData();
    if (onStatsUpdate) onStatsUpdate();
  };

  // Calculate stats whenever data changes
  useEffect(() => {
    calculateStats();
  }, [inventory, sales, staff, tasks]);

  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Inventory calculations
    const totalProducts = inventory.length;
    const totalValue = inventory.reduce((sum, item) => {
      const price = item.sale_price || item.lease_price_monthly || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const lowStock = inventory.filter(item => 
      item.quantity < 5 && item.quantity > 0
    ).length;
    
    const outOfStock = inventory.filter(item => 
      item.quantity === 0
    ).length;
    
    const activeLeases = inventory.filter(item => 
      (item.listing_type === 'lease' || item.listing_type === 'both') && 
      item.status === 'active'
    ).length;

    // Sales calculations
    const totalSales = sales.reduce((sum, sale) => sum + (sale.amount || sale.total_amount || 0), 0);
    
    const todaySales = sales
      .filter(sale => new Date(sale.created_at) >= today)
      .reduce((sum, sale) => sum + (sale.amount || sale.total_amount || 0), 0);
    
    const weeklySales = sales
      .filter(sale => new Date(sale.created_at) >= thisWeek)
      .reduce((sum, sale) => sum + (sale.amount || sale.total_amount || 0), 0);
    
    const monthlySales = sales
      .filter(sale => new Date(sale.created_at) >= thisMonth)
      .reduce((sum, sale) => sum + (sale.amount || sale.total_amount || 0), 0);
    
    const averageSale = sales.length > 0 ? totalSales / sales.length : 0;

    // Staff calculations
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.status === 'active').length;
    const staffOnLeave = staff.filter(s => s.status === 'on-leave').length;
    
    const newStaffThisMonth = staff.filter(s => {
      const joinDate = s.hire_date ? new Date(s.hire_date) : new Date(s.created_at);
      return joinDate >= thisMonth;
    }).length;
    
    const departments = new Set(staff.map(s => s.department).filter(Boolean)).size;
    
    const staffByRole = staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Task calculations
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now && (t.status === 'pending' || t.status === 'in_progress');
    }).length;
    
    const urgentTasks = tasks.filter(t => 
      t.priority === 'urgent' && t.status !== 'completed'
    ).length;

    // Performance metrics
    const taskCompletionRate = tasks.length > 0 
      ? (completedTasks / tasks.length) * 100 
      : 0;
    
    const staffProductivity = totalStaff > 0
      ? (activeStaff / totalStaff) * 100
      : 0;
    
    const inventoryTurnover = totalProducts > 0
      ? sales.length / totalProducts
      : 0;

    setStats({
      totalProducts,
      totalValue,
      lowStock,
      outOfStock,
      activeLeases,
      totalSales,
      todaySales,
      weeklySales,
      monthlySales,
      averageSale,
      totalStaff,
      activeStaff,
      staffOnLeave,
      newStaffThisMonth,
      departments,
      staffByRole,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      urgentTasks,
      taskCompletionRate,
      staffProductivity,
      inventoryTurnover,
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString()}`;
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Dashboard Overview</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={fetchData}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Business Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={CubeIcon}
          subtitle={`₦${stats.totalValue.toLocaleString()} value`}
          color="blue"
          trend={{ value: 5.2, direction: 'up' }}
          onClick={() => window.location.href = '/dashboard/inventory'}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          icon={CurrencyDollarIcon}
          subtitle={`${sales.length} transactions`}
          color="green"
          trend={{ value: 12.5, direction: 'up' }}
          onClick={() => window.location.href = '/dashboard/sales'}
        />
        <LowStockCard
          lowStock={stats.lowStock}
          outOfStock={stats.outOfStock}
          onClick={() => window.location.href = '/dashboard/inventory?filter=low-stock'}
        />
        <StatCard
          title="Active Leases"
          value={stats.activeLeases}
          icon={DocumentTextIcon}
          subtitle="Current rentals"
          color="purple"
          onClick={() => window.location.href = '/dashboard/inventory?type=lease'}
        />
      </div>

      {/* Sales Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={CurrencyDollarIcon}
          subtitle="Last 24 hours"
          color="teal"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(stats.weeklySales)}
          icon={CurrencyDollarIcon}
          subtitle="Last 7 days"
          color="indigo"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.monthlySales)}
          icon={CurrencyDollarIcon}
          subtitle="MTD"
          color="pink"
        />
        <StatCard
          title="Average Sale"
          value={formatCurrency(stats.averageSale)}
          icon={CurrencyDollarIcon}
          subtitle="Per transaction"
          color="orange"
        />
      </div>

      {/* Staff Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-blue-600" />
          Staff Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Staff"
            value={stats.totalStaff}
            icon={UserGroupIcon}
            subtitle={`${stats.activeStaff} active, ${stats.staffOnLeave} on leave`}
            color="indigo"
            trend={{ value: stats.staffProductivity, direction: stats.staffProductivity > 70 ? 'up' : 'down' }}
            onClick={() => window.location.href = '/dashboard/staff'}
          />
          <StatCard
            title="Active Staff"
            value={stats.activeStaff}
            icon={UserGroupIcon}
            subtitle={`${((stats.activeStaff / stats.totalStaff) * 100).toFixed(1)}% of total`}
            color="green"
          />
          <StatCard
            title="New This Month"
            value={stats.newStaffThisMonth}
            icon={CalendarIcon}
            subtitle="Recent hires"
            color="purple"
          />
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={BriefcaseIcon}
            subtitle="Unique teams"
            color="blue"
          />
        </div>
      </div>

      {/* Tasks Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          Tasks Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={ClockIcon}
            subtitle="Need attention"
            color="yellow"
            onClick={() => window.location.href = '/dashboard/tasks?status=pending'}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks}
            icon={ArrowPathIcon}
            subtitle="Being worked on"
            color="blue"
            onClick={() => window.location.href = '/dashboard/tasks?status=in_progress'}
          />
          <StatCard
            title="Completed"
            value={stats.completedTasks}
            icon={CheckCircleIcon}
            subtitle={`${formatPercent(stats.taskCompletionRate)} completion rate`}
            color="green"
            onClick={() => window.location.href = '/dashboard/tasks?status=completed'}
          />
          <OverdueTaskCard
            overdue={stats.overdueTasks}
            urgent={stats.urgentTasks}
            onClick={() => window.location.href = '/dashboard/tasks?filter=overdue'}
          />
        </div>
      </div>

      {/* Role Breakdown */}
      {Object.keys(stats.staffByRole).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Staff by Role</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.staffByRole).map(([role, count]) => (
              <div key={role} className="px-3 py-1.5 bg-white rounded-full border flex items-center gap-2">
                <span className="text-xs font-medium capitalize">{role}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-400 text-right">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}