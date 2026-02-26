// /home/user/matthorg/src/components/dashboard/DashboardClient.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import StatsCards from "./StatsCards";
import SalesChart from "./SalesChart";
import ExpenseChart from "./ExpenseChart";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";
import InventoryAlerts from "./InventoryAlerts";
import StaffTable from "./StaffTable";
import PermissionsModal from "./PermissionsModal";
import TaskList from "./TaskList";

interface DashboardClientProps {
  org: any;
  totalSales: number;
  totalExpenses: number;
  inventoryCount: number;
  recentSales: any[];
  recentExpenses: any[];
  lowStock: any[];
  recentStaff?: any[];
  recentTasks?: any[];
  pendingTasks?: number;
  activeStaff?: number;
}

export default function DashboardClient({
  org,
  totalSales,
  totalExpenses,
  inventoryCount,
  recentSales,
  recentExpenses,
  lowStock,
  recentStaff = [],
  recentTasks = [],
  pendingTasks = 0,
  activeStaff = 0,
}: DashboardClientProps) {
  const supabase = createClient();
  const profit = totalSales - totalExpenses;
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "tasks">("overview");
  
  // Staff & Permissions State
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [staffList, setStaffList] = useState(recentStaff);
  const [taskList, setTaskList] = useState(recentTasks);

  // Handlers
  const handleRoleChange = async (staffId: string, newRole: string) => {
    const { error } = await supabase
      .from('staff_profiles')
      .update({ role: newRole })
      .eq('id', staffId);

    if (!error) {
      // Update local state
      setStaffList(staffList.map(s => 
        s.id === staffId ? { ...s, role: newRole } : s
      ));
    }
  };

  const handlePermissionsSave = async (permissions: string[]) => {
    if (!selectedStaff) return;
    
    const { error } = await supabase
      .from('staff_profiles')
      .update({ permissions })
      .eq('id', selectedStaff.id);

    if (!error) {
      // Update local state
      setStaffList(staffList.map(s => 
        s.id === selectedStaff.id ? { ...s, permissions } : s
      ));
      setShowPermissionsModal(false);
      setSelectedStaff(null);
    }
  };

  const handlePermissionsClick = (staff: any) => {
    setSelectedStaff(staff);
    setShowPermissionsModal(true);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setTaskList(taskList.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {org.name}
              </h1>
              <p className="text-sm text-gray-500">
                {org.subdomain}.mthorg.com
              </p>
            </div>
            <QuickActions orgId={org.id} />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-4 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "staff"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Staff ({activeStaff})
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "tasks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tasks ({pendingTasks} pending)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <StatsCards
              totalSales={totalSales}
              totalExpenses={totalExpenses}
              inventoryCount={inventoryCount}
              profit={profit}
              activeStaff={activeStaff}
              pendingTasks={pendingTasks}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <SalesChart orgId={org.id} />
              <ExpenseChart expenses={recentExpenses} />
            </div>

            {/* Staff and Tasks Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Recent Staff Preview */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Recent Staff</h3>
                  <button
                    onClick={() => setActiveTab("staff")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {staffList.length > 0 ? (
                  <div className="space-y-3">
                    {staffList.slice(0, 3).map((staff) => (
                      <div key={staff.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">
                            {staff.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{staff.full_name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              staff.role === 'ceo' ? 'bg-purple-100 text-purple-700' :
                              staff.role === 'admin' ? 'bg-red-100 text-red-700' :
                              staff.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {staff.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No staff members yet</p>
                )}
              </div>

              {/* Recent Tasks Preview */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Recent Tasks</h3>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {taskList.length > 0 ? (
                  <div className="space-y-3">
                    {taskList.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500">
                            {task.status} • Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks yet</p>
                )}
              </div>
            </div>

            {/* Alerts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <RecentActivity 
                  sales={recentSales} 
                  expenses={recentExpenses} 
                />
              </div>
              <div>
                <InventoryAlerts lowStock={lowStock} />
              </div>
            </div>
          </>
        )}

        {activeTab === "staff" && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Staff Management</h2>
              <button
                onClick={() => {/* Open add staff modal */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Staff
              </button>
            </div>
            <StaffTable 
              staff={staffList} 
              orgId={org.id}
              onRoleChange={handleRoleChange}
              onPermissionsClick={handlePermissionsClick}
            />
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tasks & Milestones</h2>
              <button
                onClick={() => {/* Open add task modal */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + New Task
              </button>
            </div>
            <TaskList 
              tasks={taskList} 
              orgId={org.id}
              onStatusChange={handleTaskStatusChange}
            />
          </div>
        )}

        {/* Quick Stats Row (visible in all tabs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg border text-center">
            <p className="text-2xl font-bold text-blue-600">{recentSales.length}</p>
            <p className="text-xs text-gray-600">Today's Sales</p>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <p className="text-2xl font-bold text-orange-600">{recentExpenses.length}</p>
            <p className="text-xs text-gray-600">Today's Expenses</p>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <p className="text-2xl font-bold text-green-600">{inventoryCount}</p>
            <p className="text-xs text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <p className="text-2xl font-bold text-purple-600">{lowStock.length}</p>
            <p className="text-xs text-gray-600">Low Stock Items</p>
          </div>
        </div>
      </main>

      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedStaff(null);
        }}
        staffName={selectedStaff?.full_name || ""}
        currentPermissions={selectedStaff?.permissions || []}
        onSave={handlePermissionsSave}
      />
    </div>
  );
}