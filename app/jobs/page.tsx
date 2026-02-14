
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Define types for our data
interface Job {
    id: string;
    client_name: string;
    description: string | null;
    status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'cancelled';
    scheduled_date: string | null;
    assignees: { id: string; full_name: string }[];
}

export default async function JobsListPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch jobs for the organization
    const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
            id, client_name, description, status, scheduled_date,
            assignees:job_assignees ( profile:profiles (id, full_name) )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
    }

    const handleDeleteJob = async (formData: FormData) => {
        'use server';
        const jobId = formData.get('jobId') as string;
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return redirect('/login');
        const organizationId = user.app_metadata.organization_id;

        const { error } = await supabase.from('jobs').delete().eq('id', jobId).eq('organization_id', organizationId);
        if (error) return redirect('/jobs?error=Could not delete job');
        return redirect('/jobs');
    };


    return (
        <main className="flex-grow p-6">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-gray-800">Job Queue</h1>
                <Link href="/jobs/new">
                    <button className="py-2 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">+ Log New Job</button>
                </Link>
            </div>

            {/* Jobs List */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Scheduled For</th>
                                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {jobs?.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-gray-900">{job.client_name}</td>
                                    <td className="py-4 px-4 max-w-sm truncate text-sm text-gray-600">{job.description}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 font-semibold leading-tight text-xs rounded-full capitalize ${
                                            job.status === 'completed' || job.status === 'invoiced' ? 'bg-green-100 text-green-800' :
                                            job.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                            job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {job.status.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/jobs/${job.id}/edit`} className="text-blue-600 hover:text-blue-800 mr-4">Edit</Link>
                                        <form action={handleDeleteJob} method="POST" className="inline">
                                            <input type="hidden" name="jobId" value={job.id} />
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
    );
}
