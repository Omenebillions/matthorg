import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PostgrestError } from '@supabase/supabase-js';

// 1. Improved Interface to handle Supabase's join behavior
interface AttendanceRecord {
    id: string;
    clock_in: string;
    clock_out: string | null;
    profile: { full_name: string } | { full_name: string }[] | null;
}

export default async function AttendancePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata?.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // 2. Fetch today's attendance records with explicit type casting
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
            id, clock_in, clock_out,
            profile:profiles (full_name)
        `)
        .eq('organization_id', organizationId)
        .gte('clock_in', `${today}T00:00:00.000Z`)
        .order('clock_in', { ascending: false }) as { data: AttendanceRecord[] | null, error: PostgrestError | null };

    // 3. Check if current user is already clocked in
    const { data: currentUserClockIn } = await supabase
        .from('attendance')
        .select('id, clock_out')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single();

    // SERVER ACTION: Handle Clock In
    const handleClockIn = async () => {
        'use server';
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');
        
        const organizationId = user.app_metadata?.organization_id;

        const { error } = await supabase.from('attendance').insert({
            user_id: user.id,
            organization_id: organizationId,
            clock_in: new Date().toISOString()
        });

        if (error) return redirect(`/attendance?error=${encodeURIComponent(error.message)}`);
        return redirect('/attendance');
    };

    // SERVER ACTION: Handle Clock Out
    const handleClockOut = async () => {
        'use server';
        const supabase = await createClient();
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
        
        if (error) return redirect(`/attendance?error=${encodeURIComponent(error.message)}`);
        return redirect('/attendance');
    };

    // Helper to calculate duration
    const calculateDuration = (inTime: string, outTime: string | null) => {
        if (!outTime) return '---';
        const start = new Date(inTime);
        const end = new Date(outTime);
        const diffInMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffInMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 text-center">
                    <h1 className="text-3xl font-bold">
                        <span className="text-blue-600">MattH</span>
                        <span className="text-gray-800">org</span>
                    </h1>
                </div>
                <nav className="flex-grow px-4">
                    <ul className="space-y-2">
                        <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
                        <li><Link href="/tasks" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📝</span><span className="ml-3">Tasks</span></Link></li>
                        <li><Link href="/attendance" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>⏰</span><span className="ml-3">Attendance</span></Link></li>
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Clock-in / Attendance</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    {/* Clock Controls */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg flex items-center justify-center gap-6">
                        <form action={handleClockIn}>
                            <button 
                                type="submit" 
                                disabled={!!currentUserClockIn} 
                                className="px-8 py-4 text-lg font-bold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                            >
                                Clock In
                            </button>
                        </form>
                        <form action={handleClockOut}>
                            <button 
                                type="submit" 
                                disabled={!currentUserClockIn} 
                                className="px-8 py-4 text-lg font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                            >
                                Clock Out
                            </button>
                        </form>
                    </div>

                    {/* Attendance Table */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today&apos;s Activity</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">In</th>
                                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Out</th>
                                        <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {attendance?.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {Array.isArray(record.profile) 
                                                    ? record.profile[0]?.full_name 
                                                    : record.profile?.full_name || 'Unknown Staff'}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">
                                                {new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">
                                                {record.clock_out 
                                                    ? new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                                    : <span className="text-green-600 font-medium">On Site</span>}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">
                                                {calculateDuration(record.clock_in, record.clock_out)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!attendance || attendance.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-gray-500">No attendance records for today.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}