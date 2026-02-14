
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Define types for our data
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  due_date: string | null;
  assignee: { id: string; full_name: string } | null;
}

interface Profile {
    id: string;
    full_name: string;
}

interface Milestone {
    id: string;
    title: string;
}

export default async function TasksPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const organizationId = user.app_metadata.organization_id;
  if (!organizationId) return redirect('/?error=No organization found');

  // Fetch tasks, staff, and milestones
  const { data: tasks, error: tasksError } = await supabase.from('tasks').select(`id, title, description, status, due_date, assignee:profiles (id, full_name)`).eq('organization_id', organizationId).order('created_at', { ascending: false });
  const { data: staff, error: staffError } = await supabase.from('profiles').select('id, full_name').eq('organization_id', organizationId);
  const { data: milestones, error: milestonesError } = await supabase.from('milestones').select('id, title').eq('organization_id', organizationId);

  const handleAddTask = async (formData: FormData) => {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;
    const status = formData.get('status') as string;
    const milestoneId = formData.get('milestoneId') as string;

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    const organizationId = user.app_metadata.organization_id;

    const { error } = await supabase.from('tasks').insert({ title, description, assignee_id: assigneeId || null, due_date: dueDate || null, status: status || 'pending', organization_id: organizationId, creator_id: user.id, milestone_id: milestoneId || null });
    if (error) return redirect('/tasks?error=Could not add task');
    return redirect('/tasks');
  };

  const handleDeleteTask = async (formData: FormData) => {
    'use server';
    const taskId = formData.get('taskId') as string;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    const organizationId = user.app_metadata.organization_id;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('organization_id', organizationId);
    if (error) return redirect('/tasks?error=Could not delete task');
    return redirect('/tasks');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center"><h1 className="text-3xl font-bold"><span className="text-blue-600">MattH</span><span className="text-gray-800">org</span></h1></div>
        <nav className="flex-grow px-4"><ul className="space-y-2">{/* Nav items */}
            <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
            <li><Link href="/tasks" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>📝</span><span className="ml-3">Tasks & Milestones</span></Link></li>
            <li><Link href="/jobs" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>💼</span><span className="ml-3">Jobs & Service Requests</span></Link></li>
            <li><Link href="/sales" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📈</span><span className="ml-3">Sales & Revenue</span></Link></li>
            <li><Link href="/staff" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>👥</span><span className="ml-3">Staff Management</span></Link></li>
            <li><Link href="/attendance" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>⏰</span><span className="ml-3">Clock-in / Attendance</span></Link></li>
        </ul></nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center"><h1 className="text-2xl font-semibold text-gray-800">Tasks & Milestones</h1></header>

        <main className="flex-grow p-6 overflow-y-auto">
            <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Task</h2>
                <form action={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2"><label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label><input type="text" name="title" id="title" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                    <div><label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assign To</label><select name="assigneeId" id="assigneeId" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"><option value="">Unassigned</option>{staff?.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
                    <div><label htmlFor="milestoneId" className="block text-sm font-medium text-gray-700">Milestone</label><select name="milestoneId" id="milestoneId" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"><option value="">None</option>{milestones?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                    <div className="md:col-span-2"><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" id="description" rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea></div>
                    <div><label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label><input type="date" name="dueDate" id="dueDate" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                    <div><label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label><select name="status" id="status" defaultValue="pending" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></div>
                    <div className="lg:col-start-4"><button type="submit" className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Add Task</button></div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Tasks</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50"><tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Task</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Assigned To</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
                        </tr></thead>
                        <tbody>{tasks?.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="py-4 px-4 border-b text-sm font-semibold text-gray-900">{task.title}</td>
                                <td className="py-4 px-4 border-b text-sm text-gray-700">{task.assignee?.full_name || 'Unassigned'}</td>
                                <td className="py-4 px-4 border-b text-sm"><span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' : task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{task.status.replace('-', ' ')}</span></td>
                                <td className="py-4 px-4 border-b text-sm text-gray-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                                <td className="py-4 px-4 border-b text-sm whitespace-nowrap">
                                    <Link href={`/tasks/${task.id}/edit`} className="text-blue-600 hover:text-blue-800 mr-4 font-medium">Edit</Link>
                                    <form action={handleDeleteTask} method="POST" className="inline">
                                        <input type="hidden" name="taskId" value={task.id} />
                                        <button type="submit" className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                                    </form>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
