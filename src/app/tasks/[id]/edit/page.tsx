
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface EditTaskPageProps {
    params: { id: string };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
    const taskId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Fetch the specific task
    const { data: task, error: taskError } = await supabase.from('tasks').select('*').eq('id', taskId).eq('organization_id', organizationId).single();
    if (taskError || !task) return redirect('/tasks?error=Task not found');

    // Fetch staff and milestones for the dropdowns
    const { data: staff } = await supabase.from('profiles').select('id, full_name').eq('organization_id', organizationId);
    const { data: milestones } = await supabase.from('milestones').select('id, title').eq('organization_id', organizationId);

    const handleUpdateTask = async (formData: FormData) => {
        'use server';
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const assigneeId = formData.get('assigneeId') as string;
        const dueDate = formData.get('dueDate') as string;
        const status = formData.get('status') as string;
        const milestoneId = formData.get('milestoneId') as string;

        const supabase = await createClient();
        
        const { error } = await supabase.from('tasks').update({
            title,
            description,
            assignee_id: assigneeId || null,
            due_date: dueDate || null,
            status,
            milestone_id: milestoneId || null
        }).eq('id', taskId);

        if (error) return redirect(`/tasks/${taskId}/edit?error=Could not update task`);
        return redirect('/tasks');
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                 <div className="p-6 text-center"><h1 className="text-3xl font-bold"><span className="text-blue-600">MattH</span><span className="text-gray-800">org</span></h1></div>
                <nav className="flex-grow px-4"><ul className="space-y-2">{/* Nav Items */}
                    <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
                    <li><Link href="/tasks" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>📝</span><span className="ml-3">Tasks & Milestones</span></Link></li>
                    {/* ... other links */}
                </ul></nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4 flex items-center">
                    <Link href="/tasks" className="text-blue-600 hover:text-blue-800 mr-4"> &larr; Back to Tasks</Link>
                    <h1 className="text-2xl font-semibold text-gray-800">Edit Task</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
                        <form action={handleUpdateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" name="title" id="title" required defaultValue={task.title} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assign To</label>
                                <select name="assigneeId" id="assigneeId" defaultValue={task.assignee_id || ''} className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md">
                                    <option value="">Unassigned</option>
                                    {staff?.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="milestoneId" className="block text-sm font-medium text-gray-700">Milestone</label>
                                <select name="milestoneId" id="milestoneId" defaultValue={task.milestone_id || ''} className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md">
                                    <option value="">None</option>
                                    {milestones?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" id="description" rows={4} defaultValue={task.description || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" name="dueDate" id="dueDate" defaultValue={task.due_date || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" id="status" defaultValue={task.status} className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md">
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end items-center gap-4 mt-4">
                                <Link href="/tasks" className="text-gray-600 hover:text-gray-800 font-medium">Cancel</Link>
                                <button type="submit" className="py-2 px-6 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
