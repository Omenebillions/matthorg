// /home/user/matthorg/src/app/[subdomain]/dashboard/components/ExpenseChart.tsx
"use client";

import { motion } from "framer-motion";

interface ExpenseChartProps {
  expenses: any[];
}

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  const chartData = expenses.slice(0, 7).reverse();
  const maxAmount = Math.max(...chartData.map(e => e.amount), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      <h3 className="text-lg font-bold mb-4">Expense Trend</h3>
      <div className="h-48 flex items-end gap-2">
        {chartData.map((expense, index) => {
          const height = (expense.amount / maxAmount) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-orange-500 rounded-t"
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <p className="text-xs mt-2 text-gray-600">
                {new Date(expense.created_at).toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-xs font-bold">₦{expense.amount.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
      {chartData.length === 0 && (
        <p className="text-gray-500 text-center py-8">No expense data</p>
      )}
    </motion.div>
  );
}