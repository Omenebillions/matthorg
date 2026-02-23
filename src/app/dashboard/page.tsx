"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import DashboardCharts from "@/components/DashboardCharts";  // Added from A
import SalesChart from "@/components/SalesChart";
import ExpensesChart from "@/components/ExpenseChart";

export default function DashboardPage() {
  const supabase = createClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    inventoryCount: 0,
    pendingTasks: 0,
    attendanceToday: 0,
  });

  // -------------------------------
  // FETCH AUTH + ORG ID + STATS
  // -------------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      // 1️⃣ Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2️⃣ Get Organization ID from staff_profiles
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      const organizationId = profile?.organization_id;
      setOrgId(organizationId || null);

      if (!organizationId) {
        setLoading(false);
        return;
      }

      // 3️⃣ Load Dashboard Stats
      await loadDashboardStats(organizationId);
    };

    loadDashboard();
  }, []);

  // Separate function for stats loading (from A)
  async function loadDashboardStats(organizationId: string) {
    // SALES
    const { data: sales } = await supabase
      .from("sales")
      .select("amount")
      .eq("organization_id", organizationId);

    // EXPENSES
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organizationId);

    // INVENTORY
    const { count: inventoryCount } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    // TASKS
    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending");

    // ATTENDANCE
    const today = new Date().toISOString().split("T")[0];
    const { count: attendanceCount } = await supabase
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("date", today);

    setStats({
      totalSales: sales?.reduce((t, s) => t + s.amount, 0) || 0,
      totalExpenses: expenses?.reduce((t, e) => t + e.amount, 0) || 0,
      inventoryCount: inventoryCount || 0,
      pendingTasks: taskCount || 0,
      attendanceToday: attendanceCount || 0,
    });

    setLoading(false);
  }

  // Enhanced loading skeleton from A
  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-8 w-1/3 bg-gray-300 rounded mb-6"></div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>

        {/* Charts Skeleton */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Title - from A */}
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* CHARTS ROW - from A (DashboardCharts) */}
      <div className="mt-6">
        <DashboardCharts stats={stats} />
      </div>

      {/* SALES + EXPENSE CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SalesChart orgId={orgId!} />
        <ExpensesChart orgId={orgId!} />
      </div>

      {/* RECENT ACTIVITY - from B */}
      <RecentActivity orgId={orgId!} />
    </div>
  );
}

// Recent Activity Component (from B)
function RecentActivity({ orgId }: { orgId: string }) {
  const supabase = createClient();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentActivity = async () => {
      setLoading(true);
      
      const { data } = await supabase
        .from("sales")
        .select("id, amount, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5);

      setActivity(data || []);
      setLoading(false);
    };

    if (orgId) {
      loadRecentActivity();
    }
  }, [orgId]);

  // Add skeleton loading for recent activity
  if (loading) {
    return (
      <div className="bg-white p-6 shadow rounded-xl animate-pulse">
        <div className="h-6 w-1/4 bg-gray-300 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 shadow rounded-xl">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

      {activity.length === 0 && (
        <p className="text-gray-500">No recent actions yet.</p>
      )}

      <ul className="space-y-3">
        {activity.map((sale) => (
          <li key={sale.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sale</span>
              <span className="text-xs text-gray-400">
                {new Date(sale.created_at).toLocaleDateString()}
              </span>
            </div>
            <span className="font-medium">₦{sale.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}