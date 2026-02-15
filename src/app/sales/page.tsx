
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Define types for our data
interface Sale {
    id: string;
    item: string;
    amount: number;
    created_at: string;
}

export default async function SalesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch sales for the organization
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, item, amount, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (salesError) {
        console.error('Error fetching sales:', salesError);
    }

    const handleAddSale = async (formData: FormData) => {
        'use server';

        const item = formData.get('item') as string;
        const amount = formData.get('amount') as string;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return redirect('/login');
        const organizationId = user.app_metadata.organization_id;

        const { error } = await supabase.from('sales').insert({
            item,
            amount: parseFloat(amount),
            organization_id: organizationId,
            creator_id: user.id
        });

        if (error) {
            console.error('Error adding sale:', error);
            return redirect('/sales?error=Could not add sale');
        }

        return redirect('/sales');
    };
    
    const handleDeleteSale = async (formData: FormData) => {
        'use server';
        const saleId = formData.get('saleId') as string;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');
        const organizationId = user.app_metadata.organization_id;

        const { error } = await supabase.from('sales').delete().eq('id', saleId).eq('organization_id', organizationId);
        if (error) return redirect('/sales?error=Could not delete sale');
        return redirect('/sales');
    };


    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                 <div className="p-6 text-center">
                    <h1 className="text-3xl font-bold"><span className="text-blue-600">MattH</span><span className="text-gray-800">org</span></h1>
                </div>
                <nav className="flex-grow px-4">
                    <ul className="space-y-2">
                        <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
                        <li><Link href="/tasks" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📝</span><span className="ml-3">Tasks & Milestones</span></Link></li>
                        <li><Link href="/jobs" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>💼</span><span className="ml-3">Jobs & Service Requests</span></Link></li>
                        <li><Link href="/sales" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>📈</span><span className="ml-3">Sales & Revenue</span></Link></li>
                        <li><Link href="/staff" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>👥</span><span className="ml-3">Staff Management</span></Link></li>
                         <li><Link href="/attendance" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>⏰</span><span className="ml-3">Clock-in / Attendance</span></Link></li>
                        {/* ... other links */}
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Sales & Revenue</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    {/* Add Sale Form */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Log a New Sale</h2>
                        <form action={handleAddSale} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label htmlFor="item" className="block text-sm font-medium text-gray-700">Item or Service Sold</label>
                                <input type="text" name="item" id="item" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount ($)</label>
                                <input type="number" name="amount" id="amount" step="0.01" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <button type="submit" className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Record Sale</button>
                            </div>
                        </form>
                    </div>

                    {/* Sales List */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sales?.map(sale => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-gray-900">{sale.item}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-green-600 font-bold">${sale.amount.toLocaleString()}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{new Date(sale.created_at).toLocaleString()}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                                <Link href={`/sales/${sale.id}/edit`} className="text-blue-600 hover:text-blue-800 mr-4">Edit</Link>
                                                <form action={handleDeleteSale} method="POST" className="inline">
                                                    <input type="hidden" name="saleId" value={sale.id} />
                                                    <button type="submit" className="text-red-600 hover:text-red-800">Delete</button>
                                                </form>
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
