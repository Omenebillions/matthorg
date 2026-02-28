'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BriefcaseIcon,
  FlagIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  task_type: 'task' | 'job' | 'milestone' | 'service';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  job_number?: string;
  location?: string;
  estimated_hours?: number;
  actual_hours?: number;
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

interface TasksClientProps {
  organizationId: string;
  initialTasks: Task[];
  initialStaff: Profile[];
  initialMilestones: Milestone[];
  handleAddItem: (formData: FormData) => Promise<void>;
  handleDeleteItem: (formData: FormData) => Promise<void>;
  handleUpdateStatus: (formData: FormData) => Promise<void>;
}

type ViewMode = 'all' | 'tasks' | 'jobs' | 'milestones' | 'services';

export default function TasksClient({
  organizationId,
  initialTasks,
  initialStaff,
  initialMilestones,
  handleAddItem,
  handleDeleteItem,
  handleUpdateStatus,
}: TasksClientProps) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLive, setIsLive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'task' | 'job' | 'milestone' | 'service'>('task');

  // Setup real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('unified-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('📋 Task update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setTasks(prev => [payload.new, ...prev]);
        break;
      case 'UPDATE':
        setTasks(prev => 
          prev.map(task => task.id === payload.new.id ? { ...task, ...payload.new } : task)
        );
        break;
      case 'DELETE':
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        break;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (viewMode !== 'all') {
      const expectedType = viewMode === 'services' ? 'service' : viewMode.slice(0, -1);
      if (task.task_type !== expectedType) return false;
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        task.title?.toLowerCase().includes(searchLower) ||
        task.client_name?.toLowerCase().includes(searchLower) ||
        task.job_number?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Group by type
  const tasksByType = {
    milestones: filteredTasks.filter(t => t.task_type === 'milestone'),
    jobs: filteredTasks.filter(t => t.task_type === 'job'),
    services: filteredTasks.filter(t => t.task_type === 'service'),
    regular: filteredTasks.filter(t => t.task_type === 'task'),
  };

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    totalRevenue: tasks.reduce((sum, t) => sum + (t.total_cost || 0), 0),
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'milestone': return <FlagIcon className="w-4 h-4" />;
      case 'job': return <BriefcaseIcon className="w-4 h-4" />;
      case 'service': return <WrenchScrewdriverIcon className="w-4 h-4" />;
      default: return <CheckCircleIcon className="w-4 h-4" />;
    }
  };

  const viewModes: ViewMode[] = ['all', 'tasks', 'jobs', 'milestones', 'services'];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-600">MattH</span>
            <span className="text-gray-800">org</span>
          </h1>
        </div>
        <nav className="flex-grow px-4">
          <ul className="space-y-2">
            <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
            <li><Link href="/tasks" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm"><span>📝</span><span className="ml-3">All Work</span></Link></li>
            <li><Link href="/staff" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>👥</span><span className="ml-3">Staff</span></Link></li>
            <li><Link href="/attendance" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>⏰</span><span className="ml-3">Attendance</span></Link></li>
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
            <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">All Work</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Total:</span>
              <span className="font-bold">{stats.total}</span>
              <span className="text-gray-500 ml-2">Pending:</span>
              <span className="font-bold text-yellow-600">{stats.pending}</span>
              <span className="text-gray-500 ml-2">In Progress:</span>
              <span className="font-bold text-blue-600">{stats.inProgress}</span>
              <span className="text-gray-500 ml-2">Urgent:</span>
              <span className="font-bold text-red-600">{stats.urgent}</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New
            </button>
          </div>
        </header>

        <main className="flex-grow p-6 overflow-y-auto">
          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New</h2>
                  <div className="flex gap-2">
                    {(['task', 'job', 'service', 'milestone'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1 rounded-lg text-sm capitalize ${
                          selectedType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <form action={handleAddItem} className="space-y-4">
                  <input type="hidden" name="taskType" value={selectedType} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium">Title *</label>
                      <input type="text" name="title" required className="mt-1 w-full border p-2 rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium">Status</label>
                      <select name="status" className="mt-1 w-full border p-2 rounded">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Priority</label>
                      <select name="priority" className="mt-1 w-full border p-2 rounded">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Assign To</label>
                      <select name="assigneeId" className="mt-1 w-full border p-2 rounded">
                        <option value="">Unassigned</option>
                        {initialStaff.map(person => (
                          <option key={person.id} value={person.id}>{person.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Due Date</label>
                      <input type="date" name="dueDate" className="mt-1 w-full border p-2 rounded" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Milestone</label>
                      <select name="milestoneId" className="mt-1 w-full border p-2 rounded">
                        <option value="">None</option>
                        {initialMilestones.map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Job/Service specific fields */}
                    {(selectedType === 'job' || selectedType === 'service') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium">Client Name</label>
                          <input type="text" name="clientName" className="mt-1 w-full border p-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Client Email</label>
                          <input type="email" name="clientEmail" className="mt-1 w-full border p-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Location</label>
                          <input type="text" name="location" className="mt-1 w-full border p-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Est. Hours</label>
                          <input type="number" name="estimatedHours" className="mt-1 w-full border p-2 rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Total Cost</label>
                          <input type="number" name="totalCost" className="mt-1 w-full border p-2 rounded" />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium">Description</label>
                      <textarea name="description" rows={2} className="mt-1 w-full border p-2 rounded"></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {viewModes.map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm rounded-md capitalize ${
                      viewMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-3 py-1 text-sm">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border rounded px-3 py-1 text-sm"
              />
            </div>
          </div>

          {/* Task Sections */}
          <div className="space-y-6">
            {viewMode === 'all' || viewMode === 'milestones' ? (
              <TaskSection
                title="Milestones"
                icon={<FlagIcon className="w-5 h-5 text-purple-600" />}
                tasks={tasksByType.milestones}
                getStatusColor={getStatusColor}
                getPriorityBadge={getPriorityBadge}
                getTypeIcon={getTypeIcon}
                handleDeleteItem={handleDeleteItem}
                handleUpdateStatus={handleUpdateStatus}
              />
            ) : null}

            {viewMode === 'all' || viewMode === 'jobs' ? (
              <TaskSection
                title="Jobs & Projects"
                icon={<BriefcaseIcon className="w-5 h-5 text-blue-600" />}
                tasks={tasksByType.jobs}
                getStatusColor={getStatusColor}
                getPriorityBadge={getPriorityBadge}
                getTypeIcon={getTypeIcon}
                handleDeleteItem={handleDeleteItem}
                handleUpdateStatus={handleUpdateStatus}
              />
            ) : null}

            {viewMode === 'all' || viewMode === 'services' ? (
              <TaskSection
                title="Service Requests"
                icon={<WrenchScrewdriverIcon className="w-5 h-5 text-orange-600" />}
                tasks={tasksByType.services}
                getStatusColor={getStatusColor}
                getPriorityBadge={getPriorityBadge}
                getTypeIcon={getTypeIcon}
                handleDeleteItem={handleDeleteItem}
                handleUpdateStatus={handleUpdateStatus}
              />
            ) : null}

            {viewMode === 'all' || viewMode === 'tasks' ? (
              <TaskSection
                title="Regular Tasks"
                icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />}
                tasks={tasksByType.regular}
                getStatusColor={getStatusColor}
                getPriorityBadge={getPriorityBadge}
                getTypeIcon={getTypeIcon}
                handleDeleteItem={handleDeleteItem}
                handleUpdateStatus={handleUpdateStatus}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

// Task Section Component
function TaskSection({ title, icon, tasks, getStatusColor, getPriorityBadge, getTypeIcon, handleDeleteItem, handleUpdateStatus }: any) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center">
        {icon}
        <h2 className="font-semibold ml-2">{title}</h2>
        <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
      </div>

      <div className="divide-y">
        <AnimatePresence>
          {tasks.map((task: any) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(task.task_type)}
                    <h3 className="font-medium">{task.title}</h3>
                    {task.job_number && <span className="text-xs text-gray-400">#{task.job_number}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.client_name && (
                    <p className="text-sm text-gray-600 mt-1">Client: {task.client_name}</p>
                  )}

                  {task.location && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" /> {task.location}
                    </p>
                  )}

                  {task.total_cost && (
                    <p className="text-sm text-gray-600 mt-1">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                      ₦{task.total_cost.toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {task.due_date && <span>📅 Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    {task.assignee?.[0]?.full_name && <span>👤 {task.assignee[0].full_name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <form action={handleUpdateStatus}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <select
                      name="status"
                      defaultValue={task.status}
                      onChange={(e) => e.target.form?.requestSubmit()}
                      className={`text-xs rounded-full px-3 py-1 border ${getStatusColor(task.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </form>

                  <Link href={`/tasks/${task.id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm">
                    Edit
                  </Link>

                  <form action={handleDeleteItem} className="inline">
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="text-red-600 hover:text-red-800 text-sm">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}