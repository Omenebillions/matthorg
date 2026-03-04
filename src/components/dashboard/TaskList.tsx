// /home/user/matthorg/src/components/dashboard/TaskList.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { format, isBefore, isAfter, addDays } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  assignee_id?: string | null;
  organization_id: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  tags?: string[] | null;
  attachments?: any[] | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string;
}

interface TaskListProps {
  organizationId: string;
  limit?: number;
  showFilters?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: () => void;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';
type SortField = 'due_date' | 'priority' | 'status' | 'title' | 'created_at';
type SortOrder = 'asc' | 'desc';

// Loading skeleton
function TaskListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    urgent: { bg: 'bg-red-100 text-red-700 border-red-200', icon: '🔥', label: 'Urgent' },
    high: { bg: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚡', label: 'High' },
    medium: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📌', label: 'Medium' },
    low: { bg: 'bg-green-100 text-green-700 border-green-200', icon: '🌱', label: 'Low' },
  };

  const cfg = config[priority as keyof typeof config] || config.medium;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${cfg.bg}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: 'bg-green-100 text-green-700', icon: CheckCircleIcon, label: 'Completed' },
    in_progress: { bg: 'bg-blue-100 text-blue-700', icon: ClockIcon, label: 'In Progress' },
    pending: { bg: 'bg-yellow-100 text-yellow-700', icon: ClockIcon, label: 'Pending' },
    cancelled: { bg: 'bg-gray-100 text-gray-700', icon: XMarkIcon, label: 'Cancelled' },
    blocked: { bg: 'bg-red-100 text-red-700', icon: ExclamationTriangleIcon, label: 'Blocked' },
  };

  const cfg = config[status as keyof typeof config] || config.pending;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// Add Task Modal
function AddTaskModal({ isOpen, onClose, onSubmit, staff }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (formData: FormData) => Promise<void>;
  staff: StaffProfile[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assignee_id: '',
    estimated_hours: '',
    tags: [] as string[],
    tagInput: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'tags') {
        form.append(key, JSON.stringify(value));
      } else if (value) {
        form.append(key, value.toString());
      }
    });
    await onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add New Task</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              rows={3}
              placeholder="Task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign To</label>
            <select
              value={formData.assignee_id}
              onChange={(e) => setFormData({...formData, assignee_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Unassigned</option>
              {staff.map(person => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Est. Hours</label>
            <input
              type="number"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.tagInput}
                onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && formData.tagInput) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, formData.tagInput],
                      tagInput: ''
                    });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.tagInput) {
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, formData.tagInput],
                      tagInput: ''
                    });
                  }
                }}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Edit Task Modal
function EditTaskModal({ isOpen, onClose, task, onSave, staff }: {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  staff: StaffProfile[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    assignee_id: '',
    estimated_hours: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: task.due_date?.split('T')[0] || '',
        assignee_id: task.assignee_id || '',
        estimated_hours: task.estimated_hours?.toString() || '',
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(task.id, {
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority as any,
      status: formData.status as any,
      due_date: formData.due_date || null,
      assignee_id: formData.assignee_id || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Task</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({...formData, assignee_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Unassigned</option>
                {staff.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Est. Hours</label>
            <input
              type="number"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, taskTitle }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  taskTitle: string;
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
      >
        <h3 className="text-lg font-bold mb-2">Delete Task</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>"{taskTitle}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TaskList({ 
  organizationId, 
  limit = 10,
  showFilters = true,
  onTaskClick,
  onTaskUpdate 
}: TaskListProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      showToast(error.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, showToast]);

  // Load staff for assignment
  const loadStaff = useCallback(async () => {
    const { data } = await supabase
      .from('staff_profiles')
      .select('id, full_name, avatar_url, email')
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    
    if (data) setStaff(data);
  }, [organizationId]);

  // Initial load
  useEffect(() => {
    loadTasks();
    loadStaff();
  }, [loadTasks, loadStaff]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('task-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
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
        showToast('New task added', 'success');
        if (onTaskUpdate) onTaskUpdate();
        break;
      case 'UPDATE':
        setTasks(prev => 
          prev.map(task => task.id === payload.new.id ? { ...task, ...payload.new } : task)
        );
        if (onTaskUpdate) onTaskUpdate();
        break;
      case 'DELETE':
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        showToast('Task deleted', 'info');
        if (onTaskUpdate) onTaskUpdate();
        break;
    }
    setLastUpdated(new Date());
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (search) {
        const term = search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term) ||
          task.tags?.some(tag => tag.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          const now = new Date();
          if (!task.due_date || new Date(task.due_date) > now || task.status === 'completed') return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
          break;
        case 'status':
          const statusOrder = { pending: 0, in_progress: 1, blocked: 2, completed: 3, cancelled: 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 5;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 5;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered.slice(0, limit);
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortOrder, limit]);

  // Get task statistics
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < now && 
        t.status !== 'completed'
      ).length,
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    };
  }, [tasks]);

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      showToast('Task status updated', 'success');
      
    } catch (error: any) {
      console.error('Error updating task:', error);
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  // Handle add task
  const handleAddTask = async (formData: FormData) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          organization_id: organizationId,
          title: formData.get('title'),
          description: formData.get('description') || null,
          priority: formData.get('priority') || 'medium',
          due_date: formData.get('due_date') || null,
          assignee_id: formData.get('assignee_id') || null,
          estimated_hours: formData.get('estimated_hours') ? parseFloat(formData.get('estimated_hours') as string) : null,
          tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : null,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      showToast('Task created successfully', 'success');
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      showToast(error.message || 'Failed to create task', 'error');
    }
  };

  // Handle update task
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      showToast('Task updated successfully', 'success');
      
    } catch (error: any) {
      console.error('Error updating task:', error);
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      showToast('Task deleted successfully', 'success');
      
    } catch (error: any) {
      console.error('Error deleting task:', error);
      showToast(error.message || 'Failed to delete task', 'error');
    }
  };

  // Get assignee name
  const getAssigneeName = (assigneeId?: string | null) => {
    if (!assigneeId) return null;
    const assignee = staff.find(s => s.id === assigneeId);
    return assignee?.full_name;
  };

  if (loading) {
    return <TaskListSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header with live status */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {isLive ? 'Live' : 'Connecting...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Stats badges */}
              {stats.overdue > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  {stats.overdue} overdue
                </span>
              )}
              {stats.urgent > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {stats.urgent} urgent
                </span>
              )}
              
              {/* Refresh button */}
              <button
                onClick={loadTasks}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>

              {/* Add task button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <PlusIcon className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>

          {/* Task stats */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="bg-gray-50 p-2 rounded text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <p className="text-xs text-yellow-600">Pending</p>
              <p className="text-lg font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <p className="text-xs text-blue-600">In Progress</p>
              <p className="text-lg font-bold text-blue-700">{stats.inProgress}</p>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <p className="text-xs text-green-600">Completed</p>
              <p className="text-lg font-bold text-green-700">{stats.completed}</p>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <p className="text-xs text-red-600">Overdue</p>
              <p className="text-lg font-bold text-red-700">{stats.overdue}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Sort field */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="title">Title</option>
              <option value="created_at">Created Date</option>
            </select>

            {/* Sort order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        )}

        {/* Task list */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4">
                      {task.due_date ? (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            new Date(task.due_date) < new Date() && task.status !== 'completed'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }`}>
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {task.assignee_id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-sm">{getAssigneeName(task.assignee_id)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingTask(task);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No tasks found</p>
                    <p className="text-sm mt-1">
                      {search || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Click "Add Task" to create your first task'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
          <span>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
          <span className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTask}
        staff={staff}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={handleUpdateTask}
        staff={staff}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTask(null);
        }}
        onConfirm={async () => {
          if (deletingTask) {
            await handleDeleteTask(deletingTask.id);
          }
        }}
        taskTitle={deletingTask?.title || ''}
      />
    </>
  );
}