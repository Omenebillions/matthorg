
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface EditSalePageProps {
    params: { id: string };
}

export default async function EditSalePage({ params }: EditSalePageProps) {
    const saleId = params.id;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch the specific sale
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .eq('organization_id', organizationId)
        .single();

    if (saleError || !sale) {
        return redirect('/sales?error=Sale not found');
    }

    const handleUpdateSale = async (formData: FormData) => {
        'use server';

        const item = formData.get('item') as string;
        const amount = formData.get('amount') as string;

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        
        const { error } = await supabase
            .from('sales')
            .update({
                item,
                amount: parseFloat(amount),
            })
            .eq('id', saleId);

        if (error) {
            return redirect(`/sales/${saleId}/edit?error=Could not update sale`);
        }
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
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4 flex items-center">
                    <Link href="/sales" className="text-blue-600 hover:text-blue-800 mr-4"> &larr; Back to Sales</Link>
                    <h1 className="text-2xl font-semibold text-gray-800">Edit Sale</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                        <form action={handleUpdateSale} className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="item" className="block text-sm font-medium text-gray-700">Item or Service Sold</label>
                                <input type="text" name="item" id="item" required defaultValue={sale.item} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount ($)</label>
                                <input type="number" name="amount" id="amount" step="0.01" required defaultValue={sale.amount} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div className="flex justify-end items-center gap-4 mt-4">
                                <Link href="/sales" className="text-gray-600 hover:text-gray-800 font-medium">Cancel</Link>
                                <button type="submit" className="py-2 px-6 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
