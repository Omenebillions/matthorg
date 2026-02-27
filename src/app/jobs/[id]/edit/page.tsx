
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface EditJobPageProps {
    params: { id: string };
}

export default async function EditJobPage({ params }: EditJobPageProps) {
    const jobId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch the specific job
    const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', jobId).eq('organization_id', organizationId).single();
    if (jobError || !job) return redirect('/jobs?error=Job not found');

    const handleUpdateJob = async (formData: FormData) => {
        'use server';
        const client_name = formData.get('client_name') as string;
        const description = formData.get('description') as string;
        const scheduled_date = formData.get('scheduled_date') as string;
        const status = formData.get('status') as string;

        const supabase = await createClient();
        
        const { error } = await supabase.from('jobs').update({
            client_name,
            description,
            scheduled_date: scheduled_date || null,
            status,
        }).eq('id', jobId);

        if (error) return redirect(`/jobs/${jobId}/edit?error=Could not update job`);
        return redirect('/jobs');
    };

    return (
        <main className="flex-grow p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
                 <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Job</h2>
                <form action={handleUpdateJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                        <input type="text" name="client_name" id="client_name" required defaultValue={job.client_name} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                        <input type="date" name="scheduled_date" id="scheduled_date" defaultValue={job.scheduled_date || ''} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Job Description</label>
                        <textarea name="description" id="description" rows={4} defaultValue={job.description || ''} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" defaultValue={job.status} className="mt-1 block w-full px-4 py-2 border bg-white border-gray-300 rounded-lg">
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="invoiced">Invoiced</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end items-center gap-4 mt-4">
                         <Link href="/jobs" className="text-gray-600 hover:text-gray-800 font-medium">Cancel</Link>
                        <button type="submit" className="py-2 px-6 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </main>
    );
}
