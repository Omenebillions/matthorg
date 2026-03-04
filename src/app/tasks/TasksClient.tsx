'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

// Type definitions
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
  total_cost?: number | null;
  milestone_name?: string | null;
  assignee_id?: string | null;
  milestone_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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

// Loading skeleton
function TasksSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  taskTitle 
}: { 
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>"{taskTitle}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Task Form Modal
function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  milestones,
  initialData,
  mode = 'add'
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  staff: Profile[];
  milestones: Milestone[];
  initialData?: Task | null;
  mode?: 'add' | 'edit';
}) {
  const [selectedType, setSelectedType] = useState<'task' | 'job' | 'milestone' | 'service'>('task');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setSelectedType(initialData.task_type);
    }
  }, [initialData, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('taskType', selectedType);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'add' ? 'Create New' : 'Edit'} {selectedType}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector (only for add mode) */}
          {mode === 'add' && (
            <div className="flex gap-2 pb-4 border-b">
              {(['task', 'job', 'service', 'milestone'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize flex items-center gap-2 ${
                    selectedType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'task' && <CheckCircleIcon className="w-4 h-4" />}
                  {type === 'job' && <BriefcaseIcon className="w-4 h-4" />}
                  {type === 'service' && <WrenchScrewdriverIcon className="w-4 h-4" />}
                  {type === 'milestone' && <FlagIcon className="w-4 h-4" />}
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Hidden fields */}
          <input type="hidden" name="taskId" value={initialData?.id || ''} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                defaultValue={initialData?.title || ''}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Enter title..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={initialData?.status || 'pending'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                defaultValue={initialData?.priority || 'medium'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                name="assigneeId"
                defaultValue={initialData?.assignee_id || ''}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Unassigned</option>
                {staff.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                defaultValue={initialData?.due_date?.split('T')[0] || ''}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Milestone (for tasks/jobs) */}
            {(selectedType === 'task' || selectedType === 'job' || mode === 'edit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone</label>
                <select
                  name="milestoneId"
                  defaultValue={initialData?.milestone_id || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">None</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Job/Service specific fields */}
            {(selectedType === 'job' || selectedType === 'service' || 
              (mode === 'edit' && (initialData?.task_type === 'job' || initialData?.task_type === 'service'))) && (
              <>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Client Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    defaultValue={initialData?.client_name || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    name="clientEmail"
                    defaultValue={initialData?.client_email || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Phone</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    defaultValue={initialData?.client_phone || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="+1234567890"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                  <input
                    type="text"
                    name="clientAddress"
                    defaultValue={initialData?.client_address || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Full address"
                  />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Job Details</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
                  <input
                    type="text"
                    name="jobNumber"
                    defaultValue={initialData?.job_number || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="JOB-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={initialData?.location || ''}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Job site location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    defaultValue={initialData?.estimated_hours || ''}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₦)</label>
                  <input
                    type="number"
                    name="totalCost"
                    defaultValue={initialData?.total_cost || ''}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={initialData?.description || ''}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Detailed description..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Create' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Task Section Component
function TaskSection({ 
  title, 
  icon, 
  tasks, 
  getStatusColor, 
  getPriorityBadge, 
  getTypeIcon, 
  onEdit,
  onDelete,
  onStatusChange,
  staff
}: any) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <h2 className="font-semibold ml-2">{title}</h2>
          <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
        </div>
      </div>

      <div className="divide-y">
        <AnimatePresence>
          {tasks.map((task: Task) => {
            const assignee = staff.find((s: Profile) => s.id === task.assignee_id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeIcon(task.task_type)}
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.job_number && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          #{task.job_number}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {task.client_name && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center">
                        <UserIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {task.client_name}
                      </p>
                    )}

                    {task.location && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {task.location}
                      </p>
                    )}

                    {task.total_cost && (
                      <p className="text-sm text-gray-600 mt-1 font-medium">
                        <CurrencyDollarIcon className="w-4 h-4 inline mr-1 text-green-600" />
                        ₦{task.total_cost.toLocaleString()}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {task.due_date && (
                        <span className="flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {assignee && (
                        <span className="flex items-center">
                          <UserGroupIcon className="w-3 h-3 mr-1" />
                          {assignee.full_name}
                        </span>
                      )}
                      {task.estimated_hours && (
                        <span className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {task.estimated_hours}h est.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Status Selector */}
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className={`text-xs rounded-full px-3 py-1 border ${getStatusColor(task.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDelete(task)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TasksClient({
  organizationId,
  initialTasks,
  initialStaff,
  initialMilestones,
  handleAddItem,
  handleDeleteItem,
  handleUpdateStatus,
}: TasksClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [staff, setStaff] = useState<Profile[]>(initialStaff);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          showToast('Tasks updated', 'info');
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Listen for staff changes (for assignee names) - FIXED VERSION
    const staffChannel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_profiles',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Ensure the new staff member matches the Profile interface
            const newStaff: Profile = {
              id: payload.new.id,
              full_name: payload.new.full_name || '',
              email: payload.new.email,
              avatar_url: payload.new.avatar_url
            };
            setStaff(prev => [...prev, newStaff]);
          } else if (payload.eventType === 'UPDATE') {
            setStaff(prev => prev.map(s => {
              if (s.id === payload.new.id) {
                // Ensure updated staff member matches the Profile interface
                return {
                  id: payload.new.id,
                  full_name: payload.new.full_name || s.full_name,
                  email: payload.new.email || s.email,
                  avatar_url: payload.new.avatar_url !== undefined ? payload.new.avatar_url : s.avatar_url
                };
              }
              return s;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(staffChannel);
    };
  }, [organizationId, supabase, showToast]);

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
        task.description?.toLowerCase().includes(searchLower) ||
        task.location?.toLowerCase().includes(searchLower)
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
      case 'milestone': return <FlagIcon className="w-4 h-4 text-purple-600" />;
      case 'job': return <BriefcaseIcon className="w-4 h-4 text-blue-600" />;
      case 'service': return <WrenchScrewdriverIcon className="w-4 h-4 text-orange-600" />;
      default: return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
    }
  };

  // Handle edit
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (task: Task) => {
    setDeletingTask(task);
    setShowDeleteModal(true);
  };

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('status', newStatus);
    await handleUpdateStatus(formData);
  };

  const viewModes: ViewMode[] = ['all', 'tasks', 'jobs', 'milestones', 'services'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Work</h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total} items • {stats.inProgress} in progress • ₦{stats.totalRevenue.toLocaleString()} value
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Live Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">{isLive ? 'Live' : 'Reconnecting...'}</span>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowAddModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add New
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <FunnelIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, client, job number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {viewModes.map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md capitalize whitespace-nowrap ${
                    viewMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Urgent</p>
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          </div>
        </div>

        {/* Task Sections */}
        {loading ? (
          <TasksSkeleton />
        ) : (
          <div className="space-y-6">
            {viewMode === 'all' || viewMode === 'milestones' ? (
              <TaskSection
                title="Milestones"
                icon={<FlagIcon className="w-5 h-5 text-purple-600" />}
                tasks={tasksByType.milestones}
                getStatusColor={getStatusColor}
                getPriorityBadge={getPriorityBadge}
                getTypeIcon={getTypeIcon}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChange}
                staff={staff}
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
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChange}
                staff={staff}
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
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChange}
                staff={staff}
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
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChange}
                staff={staff}
              />
            ) : null}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No items found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {search || filterStatus !== 'all' || viewMode !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create your first task, job, or milestone'}
                </p>
                {(search || filterStatus !== 'all' || viewMode !== 'all') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilterStatus('all');
                      setViewMode('all');
                    }}
                    className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <TaskFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleAddItem}
        staff={staff}
        milestones={milestones}
        initialData={editingTask}
        mode={editingTask ? 'edit' : 'add'}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTask(null);
        }}
        onConfirm={async () => {
          if (deletingTask) {
            const formData = new FormData();
            formData.append('taskId', deletingTask.id);
            await handleDeleteItem(formData);
          }
        }}
        taskTitle={deletingTask?.title || ''}
      />

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6 z-10">
        <button
          onClick={() => {
            setEditingTask(null);
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}