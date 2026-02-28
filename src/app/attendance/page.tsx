// /home/user/matthorg/src/app/attendance/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SideNav from '@/components/SideNav';

interface AttendanceRecord {
    id: string;
    user_id: string;
    clock_in: string;
    clock_out: string | null;
    staff_profiles: {
        full_name: string;
        avatar_url: string | null;
    } | { full_name: string; avatar_url: string | null; }[] | null; // Can be object or array
}

export default async function AttendancePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // Get user's organization from staff_profiles
    const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (!staffProfile) return redirect('/?error=No staff profile found');

    const organizationId = staffProfile.organization_id;

    // Fetch today's attendance records
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance } = await supabase
        .from('attendance')  // Using your table name
        .select(`
            id,
            user_id,
            clock_in,
            clock_out,
            staff_profiles!inner (
                full_name,
                avatar_url
            )
        `)
        .eq('organization_id', organizationId)
        .gte('clock_in', `${today}T00:00:00.000Z`)
        .order('clock_in', { ascending: false });

    // Check if current user is already clocked in
    const { data: currentUserClockIn } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single();

    // Helper function to safely get staff name (handles both array and object)
    const getStaffName = (record: any): string => {
        if (!record.staff_profiles) return 'Unknown';
        
        // If it's an array, take the first item
        if (Array.isArray(record.staff_profiles)) {
            return record.staff_profiles[0]?.full_name || 'Unknown';
        }
        
        // If it's an object
        return record.staff_profiles.full_name || 'Unknown';
    };

    // Helper function to safely get avatar URL
    const getAvatarUrl = (record: any): string | null => {
        if (!record.staff_profiles) return null;
        
        if (Array.isArray(record.staff_profiles)) {
            return record.staff_profiles[0]?.avatar_url || null;
        }
        
        return record.staff_profiles.avatar_url || null;
    };

    // SERVER ACTION: Handle Clock In
    const handleClockIn = async () => {
        'use server';
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');
        
        const { data: staff } = await supabase
            .from('staff_profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!staff) return redirect('/attendance?error=No staff profile');

        const { error } = await supabase.from('attendance').insert({
            user_id: user.id,
            organization_id: staff.organization_id,
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

        const { error } = await supabase
            .from('attendance')
            .update({ clock_out: new Date().toISOString() })
            .eq('id', currentClockIn.id);
        
        if (error) return redirect(`/attendance?error=${encodeURIComponent(error.message)}`);
        return redirect('/attendance');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Using our SideNav component */}
            <SideNav />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">Attendance</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-500">Live</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {/* Clock Controls */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border flex items-center justify-center gap-6">
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
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Today's Activity</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {attendance?.map((record) => {
                                        const clockIn = new Date(record.clock_in);
                                        const clockOut = record.clock_out ? new Date(record.clock_out) : null;
                                        const duration = clockOut 
                                            ? Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) * 10) / 10
                                            : null;
                                        const staffName = getStaffName(record);
                                        const avatarUrl = getAvatarUrl(record);

                                        return (
                                            <tr key={record.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <span className="text-sm">
                                                                    {staffName?.charAt(0) || '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{staffName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <div className="text-xs text-gray-500">
                                                        {clockIn.toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {clockOut ? (
                                                        <>
                                                            {clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <div className="text-xs text-gray-500">
                                                                {clockOut.toLocaleDateString()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-green-600 font-medium">Active</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {duration ? `${duration} hours` : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        !record.clock_out 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {!record.clock_out ? 'On Site' : 'Completed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!attendance || attendance.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-gray-500">
                                                No attendance records for today.
                                            </td>
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