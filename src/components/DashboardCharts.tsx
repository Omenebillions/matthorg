"use client";

export interface DashboardChartsProps {
  stats: {
    totalSales: number;
    totalExpenses: number;
    inventoryCount: number;
    pendingTasks: number;
    attendanceToday: number;
  };
}

const DashboardCharts = ({ stats }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Sales */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
        <p className="text-2xl font-bold">{stats.totalSales}</p>
      </div>

      {/* Total Expenses */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
        <p className="text-2xl font-bold">{stats.totalExpenses}</p>
      </div>

      {/* Inventory Count */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Inventory Count</h3>
        <p className="text-2xl font-bold">{stats.inventoryCount}</p>
      </div>
    </div>
  );
};

export default DashboardCharts;