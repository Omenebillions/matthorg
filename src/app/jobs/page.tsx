import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');
  const orgId = user.app_metadata?.organization_id;

  // Fetch jobs with the creator's name joined from the profiles table
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id, 
      client_name, 
      description, 
      status, 
      scheduled_date,
      profiles:creator_id (full_name)
    `)
    .eq('organization_id', orgId)
    .order('scheduled_date', { ascending: true });

  if (error) console.error('Error fetching jobs:', error);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs & Service Requests</h1>
        <Link 
          href="/jobs/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Create New Job
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs?.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{job.client_name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{job.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                   {/* Accessing the joined profile data */}
                   {(job.profiles as any)?.full_name || 'System'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <Link href={`/jobs/${job.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs?.length === 0 && (
          <div className="text-center py-10 text-gray-500">No jobs found. Start by creating one!</div>
        )}
      </div>
    </div>
  );
}