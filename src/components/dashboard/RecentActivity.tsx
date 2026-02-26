// /home/user/matthorg/src/app/[subdomain]/dashboard/components/RecentActivity.tsx
"use client";

import { motion } from "framer-motion";

interface RecentActivityProps {
  sales: any[];
  expenses: any[];
}

export default function RecentActivity({ sales, expenses }: RecentActivityProps) {
  const allActivity = [
    ...sales.map(s => ({ ...s, type: 'sale' })),
    ...expenses.map(e => ({ ...e, type: 'expense' }))
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-6"
    >
      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {allActivity.map((activity, index) => (
          <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {activity.type === 'sale' ? '💰' : '💸'}
              </span>
              <div>
                <p className="font-medium">
                  {activity.type === 'sale' ? 'Sale' : 'Expense'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className={`font-bold ${activity.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
              ₦{activity.amount.toLocaleString()}
            </p>
          </div>
        ))}

        {allActivity.length === 0 && (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </motion.div>
  );
}