import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    tasks_count: number;
    jobs_count: number;
}

export default async function StaffPage() {
    // FIX: Await the promise
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata?.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch staff members for the organization
    const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('organization_id', organizationId);

    if (staffError) {
        console.error('Error fetching staff:', staffError);
    }

    const handleInviteUser = async (formData: FormData) => {
        'use server';

        const email = formData.get('email') as string;
        if (!email) return redirect('/staff?error=Email is required');

        // FIX: Await the promise
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // NOTE: Standard createClient uses the user's session. 
        // Inviting users usually requires the Service Role Key.
        // If your createClient supports a useAdmin flag, ensure it's awaited:
        const supabaseAdmin = await createClient(); 
        const organizationId = user?.app_metadata?.organization_id;

        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { organization_id: organizationId }
        });

        if (error) {
            console.error('Error inviting user:', error);
            return redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }

        return redirect('/staff?success=Invitation sent successfully!');
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
                        <li><Link href="/sales" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📈</span><span className="ml-3">Sales & Revenue</span></Link></li>
                        <li><Link href="/staff" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>👥</span><span className="ml-3">Staff Management</span></Link></li>
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Staff Management</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    {/* Invite User Form */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Invite New Staff Member</h2>
                         <form action={handleInviteUser} className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    id="email" 
                                    required 
                                    placeholder="name@company.com" 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <button type="submit" className="h-10 justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                Send Invite
                            </button>
                        </form>
                    </div>

                    {/* Staff List */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staff?.length === 0 ? (
                                <p className="text-gray-500 col-span-full py-4">No staff members found.</p>
                            ) : (
                                staff?.map(member => (
                                    <div key={member.id} className="bg-gray-50 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-lg font-bold text-gray-900">{member.full_name || 'Pending Invite'}</h3>
                                        <p className="text-sm text-gray-600">{member.email}</p>
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                            <Link href={`/staff/${member.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                View Profile
                                            </Link>
                                            <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded border">
                                                Tasks: 0
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}