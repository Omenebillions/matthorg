
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface AttendanceRecord {
    id: string;
    clock_in: string;
    clock_out: string | null;
    profile: { full_name: string };
}

export default async function AttendancePage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch today's attendance records for the organization
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
            id, clock_in, clock_out,
            profile:profiles (full_name)
        `)
        .eq('organization_id', organizationId)
        .gte('clock_in', `${today}T00:00:00.000Z`)
        .order('clock_in', { ascending: false });

    // Check if the current user is already clocked in
    const { data: currentUserClockIn, error: clockInError } = await supabase
        .from('attendance')
        .select('id, clock_out')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single();


    const handleClockIn = async () => {
        'use server';
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');
        const organizationId = user.app_metadata.organization_id;

        const { error } = await supabase.from('attendance').insert({
            user_id: user.id,
            organization_id: organizationId
        });

        if (error) return redirect(`/attendance?error=${error.message}`);
        return redirect('/attendance');
    };

    const handleClockOut = async () => {
        'use server';
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
         const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');

        const { data: currentClockIn, error: findError } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', user.id)
            .is('clock_out', null)
            .single();

        if (findError || !currentClockIn) return redirect('/attendance?error=No active clock-in found.');

        const { error } = await supabase.from('attendance')
            .update({ clock_out: new Date().toISOString() })
            .eq('id', currentClockIn.id);
        
        if (error) return redirect(`/attendance?error=${error.message}`);
        return redirect('/attendance');
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
                        <li><Link href="/staff" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>👥</span><span className="ml-3">Staff Management</span></Link></li>
                         <li><Link href="/attendance" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>⏰</span><span className="ml-3">Clock-in / Attendance</span></Link></li>
                        {/* ... other links */}
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Clock-in / Attendance</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    {/* Clock In/Out Controls */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg flex items-center justify-center gap-6">
                        <form action={handleClockIn}>
                            <button type="submit" disabled={!!currentUserClockIn} className="px-8 py-4 text-lg font-bold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">Clock In</button>
                        </form>
                        <form action={handleClockOut}>
                             <button type="submit" disabled={!currentUserClockIn} className="px-8 py-4 text-lg font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed">Clock Out</button>
                        </form>
                    </div>

                    {/* Today's Attendance Log */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Activity</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Staff Member</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Clock In Time</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Clock Out Time</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {attendance?.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-gray-900">{record.profile.full_name}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{new Date(record.clock_in).toLocaleTimeString()}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : 'Still Clocked In'}</td>
                                             <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{/* Duration calculation can be added here */}</td>
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
