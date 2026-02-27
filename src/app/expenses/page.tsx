'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusIcon } from '@heroicons/react/24/outline';

// Placeholder data for expenses
const expenseData = [
  { name: 'Salaries', amount: 5000 },
  { name: 'Marketing', amount: 2000 },
  { name: 'Office Supplies', amount: 500 },
  { name: 'Utilities', amount: 1000 },
  { name: 'Travel', amount: 1500 },
];

// Placeholder data for recent transactions
const recentTransactions = [
  { id: 1, description: 'Office lunch', amount: 50, date: '2024-03-14' },
  { id: 2, description: 'Client dinner', amount: 150, date: '2024-03-13' },
  { id: 3, description: 'New software subscription', amount: 100, date: '2024-03-12' },
];

// Placeholder data for trend monitoring
const trendData = {
  lastMonth: 9000,
  thisMonth: 9500,
  get percentageChange() {
    return ((this.thisMonth - this.lastMonth) / this.lastMonth) * 100;
  },
};

export default function ExpensesPage() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl">Expenses</h1>
        <button className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
          <PlusIcon className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Expense Category Chart */}
        <div className="col-span-1 rounded-lg bg-gray-50 p-4 lg:col-span-2">
          <h2 className="text-lg font-medium">Expense Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Monitoring */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="text-lg font-medium">Trend Monitoring</h2>
          <div className="mt-4 flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500">This Month vs. Last Month</p>
            <p className={`text-3xl font-bold ${trendData.percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {trendData.percentageChange.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500">
              {trendData.percentageChange > 0 ? 'Increase' : 'Decrease'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6">
        <h2 className="text-lg font-medium">Recent Transactions</h2>
        <div className="mt-4 flow-root">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
              <table className="min-w-full text-gray-900 md:table">
                <thead className="rounded-lg text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="w-full border-b py-3 text-sm last-of-type:border-none">
                      <td className="whitespace-nowrap px-3 py-3">{transaction.description}</td>
                      <td className="whitespace-nowrap px-3 py-3">${transaction.amount.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{transaction.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
