// /home/user/matthorg/src/app/tasks/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TasksClient from './TasksClient';

// Define types - MUST match what TasksClient expects
interface Task {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  task_type: 'task' | 'job' | 'milestone' | 'service';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  job_number?: string | null;
  location?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  materials_cost?: number | null;
  labor_cost?: number | null;
  total_cost?: number | null;
  milestone_name?: string | null;
  assignee_id?: string | null;
  milestone_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  tags?: string[] | null;
}

interface Profile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: string;
}

export default async function UnifiedTasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const organizationId = user.app_metadata?.organization_id;
  if (!organizationId) return redirect('/?error=No organization found');

  // Fetch ALL tasks - ADDED completed_at and tags to the query
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
      assignee_id,
      milestone_id,
      created_by,
      created_at,
      updated_at,
      completed_at,
      tags
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }

  // Fetch staff for assignment
  const { data: staff, error: staffError } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, avatar_url')
    .eq('organization_id', organizationId);

  if (staffError) {
    console.error('Error fetching staff:', staffError);
  }

  // Fetch milestones
  const { data: milestones, error: milestonesError } = await supabase
    .from('milestones')
    .select('id, title, description, due_date, status')
    .eq('organization_id', organizationId);

  if (milestonesError) {
    console.error('Error fetching milestones:', milestonesError);
  }

  // Format tasks to match the Task interface
  const formattedTasks: Task[] = (tasks || []).map(task => ({
    id: task.id,
    organization_id: organizationId,
    title: task.title || '',
    description: task.description || null,
    task_type: task.task_type || 'task',
    status: task.status || 'pending',
    priority: task.priority || 'medium',
    due_date: task.due_date || null,
    client_name: task.client_name || null,
    client_email: task.client_email || null,
    client_phone: task.client_phone || null,
    client_address: task.client_address || null,
    job_number: task.job_number || null,
    location: task.location || null,
    estimated_hours: task.estimated_hours || null,
    actual_hours: task.actual_hours || null,
    materials_cost: task.materials_cost || null,
    labor_cost: task.labor_cost || null,
    total_cost: task.total_cost || null,
    milestone_name: task.milestone_name || null,
    assignee_id: task.assignee_id || null,
    milestone_id: task.milestone_id || null,
    created_by: task.created_by || user.id,
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || task.created_at || new Date().toISOString(),
    // These now exist because we added them to the select query
    completed_at: task.completed_at || null,
    tags: task.tags || null,
  }));

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
    const clientAddress = formData.get('clientAddress') as string;
    const location = formData.get('location') as string;
    const jobNumber = formData.get('jobNumber') as string;
    const estimatedHours = formData.get('estimatedHours') as string;
    const totalCost = formData.get('totalCost') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    
    const organizationId = user.app_metadata?.organization_id;

    // Build insert object based on task type
    const insertData: any = {
      organization_id: organizationId,
      title,
      description: description || null,
      task_type: taskType,
      status: status || 'pending',
      priority: priority || 'medium',
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      milestone_id: milestoneId || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      tags: null,
    };

    // Add job/service specific fields if applicable
    if (taskType === 'job' || taskType === 'service') {
      insertData.client_name = clientName || null;
      insertData.client_email = clientEmail || null;
      insertData.client_phone = clientPhone || null;
      insertData.client_address = clientAddress || null;
      insertData.location = location || null;
      insertData.estimated_hours = estimatedHours ? parseFloat(estimatedHours) : null;
      insertData.total_cost = totalCost ? parseFloat(totalCost) : null;
      insertData.job_number = jobNumber || null;
      
      // Generate job number if not provided
      if (!jobNumber) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('task_type', 'job');
        
        const year = new Date().getFullYear();
        insertData.job_number = `JOB-${year}-${(count || 0) + 1}`.padStart(11, '0');
      }
    }

    const { error } = await supabase.from('tasks').insert(insertData);
    
    if (error) {
      console.error('Error adding item:', error);
      return redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
    }
    
    return redirect('/tasks?success=Item added successfully');
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
    
    if (error) {
      console.error('Error deleting item:', error);
      return redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
    }
    
    return redirect('/tasks?success=Item deleted successfully');
  };

  // Server action to update status
  const handleUpdateStatus = async (formData: FormData) => {
    'use server';
    
    const taskId = formData.get('taskId') as string;
    const status = formData.get('status') as string;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);
    
    if (error) {
      console.error('Error updating status:', error);
      return redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
    }
    
    redirect('/tasks?success=Status updated');
  };

  return (
    <TasksClient 
      organizationId={organizationId}
      initialTasks={formattedTasks}
      initialStaff={staff || []}
      initialMilestones={milestones || []}
      handleAddItem={handleAddItem}
      handleDeleteItem={handleDeleteItem}
      handleUpdateStatus={handleUpdateStatus}
    />
  );
}