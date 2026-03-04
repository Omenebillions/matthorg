// /home/user/matthorg/src/app/attendance/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SideNav from '@/components/SideNav';
import { Suspense } from 'react';

// Type definitions
interface StaffProfile {
  full_name: string;
  avatar_url: string | null;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  staff_profiles: StaffProfile | StaffProfile[] | null;
}

interface DbAttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  staff_profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Helper function to safely get staff name
function getStaffName(record: AttendanceRecord): string {
  if (!record.staff_profiles) return 'Unknown';
  
  if (Array.isArray(record.staff_profiles)) {
    return record.staff_profiles[0]?.full_name || 'Unknown';
  }
  
  return record.staff_profiles.full_name || 'Unknown';
}

// Helper function to safely get avatar URL
function getAvatarUrl(record: AttendanceRecord): string | null {
  if (!record.staff_profiles) return null;
  
  if (Array.isArray(record.staff_profiles)) {
    return record.staff_profiles[0]?.avatar_url || null;
  }
  
  return record.staff_profiles.avatar_url || null;
}

// Helper to format duration
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}

// Loading component
function AttendanceSkeleton() {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="divide-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Server Actions
async function clockIn() {
  'use server';
  
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return redirect('/login?error=Please log in again');
    }
    
    // Get staff profile with organization
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (staffError || !staff) {
      console.error('Staff profile error:', staffError);
      return redirect('/attendance?error=Staff profile not found');
    }
    
    // Check if already clocked in
    const { data: existingClockIn, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .maybeSingle();
      
    if (existingClockIn) {
      return redirect('/attendance?error=You are already clocked in');
    }
    
    // Insert new attendance record
    const { error: insertError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        organization_id: staff.organization_id,
        clock_in: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Clock in error:', insertError);
      return redirect(`/attendance?error=${encodeURIComponent('Failed to clock in. Please try again.')}`);
    }
    
    return redirect('/attendance?success=Clocked in successfully');
    
  } catch (error) {
    console.error('Unexpected error during clock in:', error);
    return redirect('/attendance?error=An unexpected error occurred');
  }
}

async function clockOut() {
  'use server';
  
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return redirect('/login?error=Please log in again');
    }
    
    // Find active clock-in
    const { data: currentClockIn, error: findError } = await supabase
      .from('attendance')
      .select('id, clock_in')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .single();
      
    if (findError || !currentClockIn) {
      return redirect('/attendance?error=No active clock-in found');
    }
    
    // Validate clock out isn't before clock in
    const clockInTime = new Date(currentClockIn.clock_in).getTime();
    const clockOutTime = new Date().getTime();
    
    if (clockOutTime < clockInTime) {
      return redirect('/attendance?error=Clock out time cannot be before clock in');
    }
    
    // Update with clock out
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ 
        clock_out: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', currentClockIn.id);
      
    if (updateError) {
      console.error('Clock out error:', updateError);
      return redirect(`/attendance?error=${encodeURIComponent('Failed to clock out. Please try again.')}`);
    }
    
    return redirect('/attendance?success=Clocked out successfully');
    
  } catch (error) {
    console.error('Unexpected error during clock out:', error);
    return redirect('/attendance?error=An unexpected error occurred');
  }
}

// Main page component
export default async function AttendancePage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return redirect('/login?error=Please log in');
  }

  // Get staff profile with role
  const { data: staffProfile, error: staffError } = await supabase
    .from('staff_profiles')
    .select('organization_id, role, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (staffError || !staffProfile) {
    console.error('Staff profile error:', staffError);
    return redirect('/?error=Staff profile not found');
  }

  const organizationId = staffProfile.organization_id;

  // Fetch today's attendance records
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
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

  if (attendanceError) {
    console.error('Attendance fetch error:', attendanceError);
  }

  // Check if current user is already clocked in
  const { data: currentUserClockIn } = await supabase
    .from('attendance')
    .select('id, clock_in')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle();

  // Get URL params for messages
  const searchParams = new URLSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  return (
    <div className="flex h-screen bg-gray-50">
      <SideNav />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Attendance</h1>
            <p className="text-sm text-gray-500">Track staff clock-ins and work hours</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Live</span>
            </div>
            <Link 
              href="/dashboard" 
              className="text-sm text-blue-600 hover:text-blue-800 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0">
            <p className="text-red-700">{decodeURIComponent(error)}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6 mb-0">
            <p className="text-green-700">{decodeURIComponent(success)}</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {/* Clock Controls */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Welcome, {staffProfile.first_name}!</h2>
                <p className="text-sm text-gray-500">
                  {currentUserClockIn 
                    ? `Clocked in at ${new Date(currentUserClockIn.clock_in).toLocaleTimeString()}`
                    : 'Ready to start your shift?'}
                </p>
              </div>
              <div className="flex gap-4">
                <form action={clockIn}>
                  <button 
                    type="submit" 
                    disabled={!!currentUserClockIn} 
                    className="px-6 py-3 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    {currentUserClockIn ? 'Clocked In ✓' : 'Clock In'}
                  </button>
                </form>
                <form action={clockOut}>
                  <button 
                    type="submit" 
                    disabled={!currentUserClockIn} 
                    className="px-6 py-3 font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    Clock Out
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <Suspense fallback={<AttendanceSkeleton />}>
            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold">Today's Activity</h2>
              </div>
              
              {!attendance || attendance.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-gray-500">No attendance records for today.</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to clock in!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendance.map((record) => {
                        const clockIn = new Date(record.clock_in);
                        const clockOut = record.clock_out ? new Date(record.clock_out) : null;
                        const duration = clockOut 
                          ? clockOut.getTime() - clockIn.getTime()
                          : Date.now() - clockIn.getTime();
                        
                        const staffName = getStaffName(record);
                        const avatarUrl = getAvatarUrl(record);
                        const isActive = !record.clock_out;

                        return (
                          <tr key={record.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    staffName?.charAt(0) || '?'
                                  )}
                                </div>
                                <span className="font-medium text-gray-900">{staffName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{clockIn.toLocaleTimeString()}</div>
                              <div className="text-xs text-gray-500">{clockIn.toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              {clockOut ? (
                                <>
                                  <div className="font-medium">{clockOut.toLocaleTimeString()}</div>
                                  <div className="text-xs text-gray-500">{clockOut.toLocaleDateString()}</div>
                                </>
                              ) : (
                                <span className="text-green-600 font-medium">Active</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {formatDuration(duration)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {isActive ? 'On Site' : 'Completed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Suspense>

          {/* Summary Stats */}
          {attendance && attendance.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Total Staff Today</p>
                <p className="text-2xl font-bold">{attendance.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Currently On Site</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendance.filter(r => !r.clock_out).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm text-gray-500">Completed Shifts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendance.filter(r => r.clock_out).length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}