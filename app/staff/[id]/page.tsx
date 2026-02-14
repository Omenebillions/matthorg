
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Task {
    id: string;
    title: string;
    status: string;
    due_date: string | null;
}

interface Job {
    id: string;
    client_name: string;
    status: string;
    scheduled_date: string | null;
}

interface ProfilePageProps {
    params: {
        id: string;
    };
}

export default async function StaffProfilePage({ params }: ProfilePageProps) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const staffId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch profile, tasks, and jobs for the specific staff member
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', staffId)
        .eq('organization_id', organizationId)
        .single();

    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('assignee_id', staffId)
        .order('created_at', { ascending: false });

    const { data: jobs, error: jobsError } = await supabase
        .from('job_assignees')
        .select('job:jobs!inner(id, client_name, status, scheduled_date)')
        .eq('assignee_id', staffId)
        .order('created_at', { ascending: false });

    if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return redirect('/staff?error=Could not load staff profile.');
    }

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
                        {/* ... other links */}
                    </ul>
                </nav>
            </aside>
            <div className="flex-1 flex flex-col">
                 <header className="bg-white shadow-md p-4 flex items-center">
                    <Link href="/staff" className="text-blue-600 hover:text-blue-800 mr-4"> &larr; Back to Staff</Link>
                    <h1 className="text-2xl font-semibold text-gray-800">Staff Profile</h1>
                </header>
                <main className="flex-grow p-6 overflow-y-auto">
                    {/* Profile Header */}
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">{profile.full_name}</h2>
                        <p className="text-lg text-gray-600">{profile.email}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Assigned Tasks */}
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Assigned Tasks</h3>
                            <ul className="divide-y divide-gray-200">
                                {tasks?.map(task => (
                                    <li key={task.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800">{task.title}</p>
                                            <p className="text-sm text-gray-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full capitalize ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {task.status.replace('-', ' ')}
                                        </span>
                                    </li>
                                ))}
                                {tasks?.length === 0 && <p className="text-gray-500">No tasks assigned.</p>}
                            </ul>
                        </div>

                        {/* Assigned Jobs */}
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Assigned Jobs</h3>
                            <ul className="divide-y divide-gray-200">
                                {jobs?.map(item => {
                                    const job = item.job as unknown as Job; // Type assertion
                                    return (
                                        <li key={job.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{job.client_name}</p>
                                                <p className="text-sm text-gray-500">Scheduled: {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full capitalize ${
                                                job.status === 'completed' || job.status === 'invoiced' ? 'bg-green-100 text-green-800' :
                                                job.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {job.status.replace('-', ' ')}
                                            </span>
                                        </li>
                                    );
                                })}
                                {jobs?.length === 0 && <p className="text-gray-500">No jobs assigned.</p>}
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
