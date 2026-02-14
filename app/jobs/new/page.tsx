
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
}

export default async function NewJobPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', organizationId);

    if (staffError) {
        console.error('Error fetching staff:', staffError);
    }

    const handleAddJob = async (formData: FormData) => {
        'use server';

        const client_name = formData.get('client_name') as string;
        const description = formData.get('description') as string;
        const scheduled_date = formData.get('scheduled_date') as string;
        const status = formData.get('status') as string;

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return redirect('/login');
        const organizationId = user.app_metadata.organization_id;

        const { data: newJob, error } = await supabase.from('jobs').insert({
            client_name,
            description,
            scheduled_date: scheduled_date || null,
            status: status || 'scheduled',
            organization_id: organizationId,
            creator_id: user.id
        }).select('id').single();

        if (error || !newJob) {
            console.error('Error adding job:', error);
            return redirect('/jobs/new?error=Could not add job');
        }

        return redirect('/jobs');
    };

    return (
        <main className="flex-grow p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a New Job</h2>
                <form action={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                        <input type="text" name="client_name" id="client_name" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                        <input type="date" name="scheduled_date" id="scheduled_date" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Job Description</label>
                        <textarea name="description" id="description" rows={4} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status</label>
                        <select name="status" id="status" defaultValue="scheduled" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="invoiced">Invoiced</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    {/* A more advanced version could have a multi-select for assignees */}
                    <div className="md:col-span-2 flex justify-end items-center gap-4 mt-4">
                         <Link href="/jobs" className="text-gray-600 hover:text-gray-800 font-medium">Cancel</Link>
                        <button type="submit" className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Job</button>
                    </div>
                </form>
            </div>
        </main>
    );
}
