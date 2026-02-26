// /home/user/matthorg/src/app/[subdomain]/dashboard/components/StatsCards.tsx
"use client";

import { motion } from "framer-motion";

interface StatsCardsProps {
  totalSales: number;
  totalExpenses: number;
  inventoryCount: number;
  profit: number;
  activeStaff?: number;
  pendingTasks?: number;
}

export default function StatsCards({ 
  totalSales, 
  totalExpenses, 
  inventoryCount, 
  profit,
  activeStaff = 0,
  pendingTasks = 0
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Sales",
      value: `₦${totalSales.toLocaleString()}`,
      icon: "💰",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700"
    },
    {
      title: "Total Expenses",
      value: `₦${totalExpenses.toLocaleString()}`,
      icon: "📉",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700"
    },
    {
      title: "Net Profit",
      value: `₦${profit.toLocaleString()}`,
      icon: "📊",
      color: profit > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      textColor: profit > 0 ? "text-green-700" : "text-red-700"
    },
    {
      title: "Inventory Items",
      value: inventoryCount.toString(),
      icon: "📦",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700"
    },
    {
      title: "Active Staff",
      value: activeStaff.toString(),
      icon: "👥",
      color: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-700"
    },
    {
      title: "Pending Tasks",
      value: pendingTasks.toString(),
      icon: "✅",
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 rounded-xl border ${stat.color}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-xs">{stat.title}</p>
              <p className={`text-lg font-bold mt-1 ${stat.textColor}`}>{stat.value}</p>
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}