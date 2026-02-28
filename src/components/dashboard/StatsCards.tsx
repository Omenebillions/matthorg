// /home/user/matthorg/src/components/dashboard/StatsCards.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';

// Define your actual database types
interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'on-leave' | 'terminated';
  department?: string;
  hire_date?: string;
  created_at: string;
  employment_type?: 'full-time' | 'part-time' | 'contract';
  phone?: string;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'todo' | 'in_progress';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
}

interface Sale {
  id: string;
  amount?: number;
  total_amount?: number;
  created_at: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  listing_type: 'sale' | 'lease';
  status: 'active' | 'inactive';
  sale_price?: number;
  lease_price_monthly?: number;
}

interface Stats {
  totalProducts: number;
  totalSales: number;
  lowStock: number;
  activeLeases: number;
  totalStaff: number;
  activeStaff: number;
  staffByRole: {
    admin: number;
    manager: number;
    staff: number;
  };
  newStaffThisMonth: number;
  staffOnLeave: number;
  departments: number;
  staffWithTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export function StatsCards({ organizationId }: { organizationId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSales: 0,
    lowStock: 0,
    activeLeases: 0,
    totalStaff: 0,
    activeStaff: 0,
    staffByRole: { admin: 0, manager: 0, staff: 0 },
    newStaffThisMonth: 0,
    staffOnLeave: 0,
    departments: 0,
    staffWithTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });

  // Live inventory updates - Note: useRealtime returns T[] directly
  const { data: inventory = [], isLive: inventoryLive } = useRealtime<InventoryItem>(
    { table: 'inventory', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Live sales updates
  const { data: sales = [], isLive: salesLive } = useRealtime<Sale>(
    { table: 'sales', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Live staff updates
  const { data: staff = [], isLive: staffLive } = useRealtime<StaffProfile>(
    { table: 'staff_profiles', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Live tasks updates
  const { data: tasks = [], isLive: tasksLive } = useRealtime<Task>(
    { table: 'tasks', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Recalculate stats whenever data changes
  useEffect(() => {
    calculateStats();
  }, [inventory, sales, staff, tasks]);

  const calculateStats = () => {
    // Calculate total sales - now sales is Sale[], not Sale[][]
    const totalSalesAmount = sales.reduce((sum: number, sale: Sale) => {
      const amount = sale.amount || sale.total_amount || 0;
      return sum + amount;
    }, 0);

    // Staff calculations - staff is StaffProfile[], not StaffProfile[][]
    const activeStaff = staff.filter(s => s.status === 'active').length;
    const staffOnLeave = staff.filter(s => s.status === 'on-leave').length;
    
    const staffByRole = {
      admin: staff.filter(s => s.role === 'admin').length,
      manager: staff.filter(s => s.role === 'manager').length,
      staff: staff.filter(s => s.role === 'staff').length,
    };
    
    // New staff this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newStaffThisMonth = staff.filter(s => {
      const hireDate = s.hire_date ? new Date(s.hire_date) : new Date(s.created_at);
      return hireDate >= firstDayOfMonth;
    }).length;
    
    // Unique departments
    const departments = new Set(
      staff.map(s => s.department).filter((d): d is string => !!d)
    ).size;
    
    // Staff with tasks assigned - tasks is Task[], not Task[][]
    const staffWithTasks = new Set(
      tasks.map(t => t.assigned_to).filter((id): id is string => !!id)
    ).size;

    // Task calculations
    const pendingTasks = tasks.filter(t => 
      t.status === 'pending' || t.status === 'todo'
    ).length;
    
    const completedTasks = tasks.filter(t => 
      t.status === 'completed'
    ).length;
    
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now && (t.status === 'pending' || t.status === 'todo');
    }).length;

    // Inventory calculations - inventory is InventoryItem[], not InventoryItem[][]
    const lowStockItems = inventory.filter(item => 
      item.quantity < 5 && item.quantity > 0
    ).length;
    
    const activeLeasesCount = inventory.filter(item => 
      item.listing_type === 'lease' && item.status === 'active'
    ).length;

    setStats({
      totalProducts: inventory.length,
      totalSales: totalSalesAmount,
      lowStock: lowStockItems,
      activeLeases: activeLeasesCount,
      totalStaff: staff.length,
      activeStaff,
      staffByRole,
      newStaffThisMonth,
      staffOnLeave,
      departments,
      staffWithTasks,
      pendingTasks,
      completedTasks,
      overdueTasks
    });
  };

  const isLive = inventoryLive && salesLive && staffLive && tasksLive;

  return (
    <div className="space-y-6">
      {/* Live Status Indicator */}
      <div className="flex justify-end items-center space-x-2">
        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">
            {isLive ? 'Live - Real-time updates' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Business Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          subtitle="All inventory items"
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={`₦${stats.totalSales.toLocaleString()}`}
          icon="💰"
          subtitle="Lifetime revenue"
          color="green"
        />
        <LowStockCard
          lowStock={stats.lowStock}
        />
        <StatCard
          title="Active Leases"
          value={stats.activeLeases}
          icon="📄"
          subtitle="Current rentals"
          color="purple"
        />
      </div>

      {/* Staff Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>👥</span> Staff Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Staff"
            value={stats.totalStaff}
            icon="👥"
            subtitle={`${stats.activeStaff} active, ${stats.staffOnLeave} on leave`}
            color="indigo"
          />
          <StatCard
            title="By Role"
            value={`${stats.staffByRole.admin} · ${stats.staffByRole.manager} · ${stats.staffByRole.staff}`}
            icon="👔"
            subtitle="Admin · Manager · Staff"
            color="purple"
          />
          <StatCard
            title="New This Month"
            value={stats.newStaffThisMonth}
            icon="🌟"
            subtitle="Recent hires"
            color="green"
          />
          <StatCard
            title="Departments"
            value={stats.departments}
            icon="🏢"
            subtitle="Unique teams"
            color="blue"
          />
          <StatCard
            title="Staff with Tasks"
            value={stats.staffWithTasks}
            icon="📋"
            subtitle="Assigned work"
            color="orange"
          />
        </div>
      </div>

      {/* Tasks Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>✅</span> Tasks Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon="⏳"
            subtitle="Need attention"
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={stats.completedTasks}
            icon="✅"
            subtitle="Done this period"
            color="green"
          />
          <OverdueTaskCard
            overdueTasks={stats.overdueTasks}
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  icon: string; 
  subtitle: string; 
  color?: 'blue' | 'green' | 'purple' | 'indigo' | 'yellow' | 'orange' | 'red';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    indigo: 'bg-indigo-50',
    yellow: 'bg-yellow-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Specialized card for Low Stock
const LowStockCard = ({ lowStock }: { lowStock: number }) => (
  <div className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
    lowStock > 0 ? 'border-yellow-200' : 'border-gray-100'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">Low Stock</p>
        <p className="text-2xl font-bold mt-1 text-gray-800">{lowStock}</p>
        {lowStock > 0 ? (
          <p className="text-xs text-yellow-600 mt-1">⚠️ {lowStock} items need restock</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">All stock healthy</p>
        )}
      </div>
      <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center text-2xl">
        ⚠️
      </div>
    </div>
  </div>
);

// Specialized card for Overdue Tasks
const OverdueTaskCard = ({ overdueTasks }: { overdueTasks: number }) => (
  <div className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
    overdueTasks > 0 ? 'border-red-200' : 'border-gray-100'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">Overdue Tasks</p>
        <p className="text-2xl font-bold mt-1 text-gray-800">{overdueTasks}</p>
        {overdueTasks > 0 ? (
          <p className="text-xs text-red-600 mt-1">⚠️ {overdueTasks} tasks overdue</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">All tasks on track</p>
        )}
      </div>
      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-2xl">
        ⚠️
      </div>
    </div>
  </div>
);