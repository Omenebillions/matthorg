
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the shape of our data
interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  assignedTo: string;
  dueDate: string;
}

interface Sale {
  id: string;
  item: string;
  amount: number;
  date: string;
}

const recentTasks: Task[] = [
  { id: '1', title: 'Develop new landing page', status: 'in-progress', assignedTo: 'Alice', dueDate: '2024-07-30' },
  { id: '2', title: 'Fix authentication bug', status: 'completed', assignedTo: 'Bob', dueDate: '2024-07-28' },
  { id: '3', title: 'Design marketing banner', status: 'pending', assignedTo: 'Charlie', dueDate: '2024-08-05' },
  { id: '4', title: 'Write weekly blog post', status: 'in-progress', assignedTo: 'Alice', dueDate: '2024-07-29' },
];

const recentSales: Sale[] = [
  { id: '1', item: 'Product A', amount: 150, date: '2024-07-29' },
  { id: '2', item: 'Product B', amount: 200, date: '2024-07-28' },
  { id: '3', item: 'Service C', amount: 500, date: '2024-07-28' },
  { id: '4', item: 'Product A', amount: 150, date: '2024-07-27' },
];

const salesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    return redirect('/');
  };

  const summaryCards = [
    { title: 'Total Revenue', value: '$54,385', icon: '💰', change: '+5.2%' },
    { title: 'New Sales', value: '184', icon: '📈', change: '+2.1%' },
    { title: 'Pending Tasks', value: '23', icon: '📝', change: '-1.5%' },
    { title: 'New Customers', value: '45', icon: '👥', change: '+10%' },
  ];
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col transition-all duration-300">
        <div className="p-6 text-center">
            <h1 className="text-3xl font-bold">
                <span className="text-blue-600">MattH</span><span className="text-gray-800">org</span>
            </h1>
        </div>
        <nav className="flex-grow px-4">
          <ul className="space-y-2">
            <li><Link href="/dashboard" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
            <li><Link href="/tasks" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📝</span><span className="ml-3">Tasks & Milestones</span></Link></li>
            <li><Link href="/jobs" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>💼</span><span className="ml-3">Jobs & Service Requests</span></Link></li>
            <li><Link href="/sales" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📈</span><span className="ml-3">Sales & Revenue</span></Link></li>
            <li><Link href="/staff" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>👥</span><span className="ml-3">Staff Management</span></Link></li>
            <li><Link href="/attendance" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🕒</span><span className="ml-3">Clock-ins</span></Link></li>
            <li><Link href="/inventory" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📦</span><span className="ml-3">Inventory</span></Link></li>
            <li><Link href="/expenses" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>💸</span><span className="ml-3">Expenses</span></Link></li>
            <li><Link href="/notifications" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🔔</span><span className="ml-3">Notifications</span></Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Good morning, {user.email?.split('@')[0]}!</h1>
            <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    + Add New Task
                </button>
                <form action={handleSignOut}>
                    <button type="submit" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Sign Out</button>
                </form>
            </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-6 overflow-y-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 font-semibold">{card.title}</h3>
                            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                            <p className={`text-sm mt-1 ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{card.change}</p>
                        </div>
                        <div className="text-4xl opacity-80">{card.icon}</div>
                    </div>
                ))}
            </div>

            {/* Charts & Recent Activity */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Sales Performance</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Tasks */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Tasks</h2>
                  <ul className="space-y-4">
                    {recentTasks.slice(0, 4).map(task => (
                      <li key={task.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{task.title}</p>
                          <p className="text-sm text-gray-500">Assigned to {task.assignedTo}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
            </div>

             {/* Recent Sales Table */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sales</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Item</th>
                                <th className="py-2 px-4 border-b text-left">Amount</th>
                                <th className="py-2 px-4 border-b text-left">Date</th>
                                <th className="py-2 px-4 border-b text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.map(sale => (
                                <tr key={sale.id}>
                                    <td className="py-2 px-4 border-b">{sale.item}</td>
                                    <td className="py-2 px-4 border-b">${sale.amount}</td>
                                    <td className="py-2 px-4 border-b">{sale.date}</td>
                                    <td className="py-2 px-4 border-b">
                                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
