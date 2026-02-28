import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TasksClient from './TasksClient'; // We'll create this for real-time

// Define types
interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: 'task' | 'job' | 'milestone' | 'service';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  job_number?: string;
  location?: string;
  estimated_hours?: number;
  actual_hours?: number;
  materials_cost?: number;
  labor_cost?: number;
  total_cost?: number;
  milestone_name?: string;
  assignee?: { id: string; full_name: string; }[] | null;
  milestone_id?: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
}

export default async function UnifiedTasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const organizationId = user.app_metadata?.organization_id;
  if (!organizationId) return redirect('/?error=No organization found');

  // Fetch ALL tasks (including jobs, milestones, services)
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      id, 
      title, 
      description, 
      task_type,
      status,
      priority,
      due_date, 
      client_name,
      client_email,
      client_phone,
      client_address,
      job_number,
      location,
      estimated_hours,
      actual_hours,
      materials_cost,
      labor_cost,
      total_cost,
      milestone_name,
      assignee:profiles (id, full_name),
      milestone_id,
      created_at
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Fetch staff for assignment
  const { data: staff, error: staffError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('organization_id', organizationId);

  // Fetch milestones
  const { data: milestones, error: milestonesError } = await supabase
    .from('milestones')
    .select('id, title, description')
    .eq('organization_id', organizationId);

  // Server action to add ANY type of task/job/milestone
  const handleAddItem = async (formData: FormData) => {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const taskType = formData.get('taskType') as string;
    const status = formData.get('status') as string;
    const priority = formData.get('priority') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const dueDate = formData.get('dueDate') as string;
    const milestoneId = formData.get('milestoneId') as string;
    
    // Job/Service specific fields
    const clientName = formData.get('clientName') as string;
    const clientEmail = formData.get('clientEmail') as string;
    const clientPhone = formData.get('clientPhone') as string;
    const location = formData.get('location') as string;
    const estimatedHours = formData.get('estimatedHours') as string;
    const totalCost = formData.get('totalCost') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    
    const organizationId = user.app_metadata?.organization_id;

    // Build insert object based on task type
    const insertData: any = {
      title,
      description: description || null,
      task_type: taskType,
      status: status || 'pending',
      priority: priority || 'medium',
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      organization_id: organizationId,
      creator_id: user.id,
      milestone_id: milestoneId || null,
    };

    // Add job/service specific fields if applicable
    if (taskType === 'job' || taskType === 'service') {
      insertData.client_name = clientName || null;
      insertData.client_email = clientEmail || null;
      insertData.client_phone = clientPhone || null;
      insertData.location = location || null;
      insertData.estimated_hours = estimatedHours ? parseFloat(estimatedHours) : null;
      insertData.total_cost = totalCost ? parseFloat(totalCost) : null;
      
      // Generate job number if not provided
      if (!formData.get('jobNumber')) {
        const year = new Date().getFullYear();
        const count = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('task_type', 'job');
        insertData.job_number = `JOB-${year}-${(count.count || 0) + 1}`;
      }
    }

    const { error } = await supabase.from('tasks').insert(insertData);
    
    if (error) {
      console.error('Error adding item:', error);
      return redirect('/tasks?error=Could not add item');
    }
    
    return redirect('/tasks');
  };

  // Server action to delete any item
  const handleDeleteItem = async (formData: FormData) => {
    'use server';
    
    const taskId = formData.get('taskId') as string;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    
    const organizationId = user.app_metadata?.organization_id;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organization_id', organizationId);
    
    if (error) return redirect('/tasks?error=Could not delete item');
    return redirect('/tasks');
  };

  // Server action to update status
  const handleUpdateStatus = async (formData: FormData) => {
    'use server';
    
    const taskId = formData.get('taskId') as string;
    const status = formData.get('status') as string;
    
    const supabase = await createClient();
    await supabase
      .from('tasks')
      .update({ 
        status,
        completion_date: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId);
    
    redirect('/tasks');
  };

  return (
    <TasksClient 
      organizationId={organizationId}
      initialTasks={tasks || []}
      initialStaff={staff || []}
      initialMilestones={milestones || []}
      handleAddItem={handleAddItem}
      handleDeleteItem={handleDeleteItem}
      handleUpdateStatus={handleUpdateStatus}
    />
  );
}