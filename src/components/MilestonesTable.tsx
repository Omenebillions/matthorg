// /src/components/dashboard/MilestonesTable.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  assigned_to?: string;
  created_by?: string;
  completed_at?: string;
  attachments?: any[];
  tags?: string[];
  metadata?: any;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface MilestonesTableProps {
  organizationId: string;
  currentUserId?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';
type SortField = 'due_date' | 'priority' | 'status' | 'title' | 'progress';
type SortOrder = 'asc' | 'desc';

export default function MilestonesTable({ 
  organizationId,
  currentUserId 
}: MilestonesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assigned_to: '',
    tags: [] as string[],
    tagInput: ''
  });

  const supabase = createClient();

  // Live milestones data
  const { data: milestones = [], isLive } = useRealtime<Milestone>(
    { table: 'milestones', filter: `organization_id=eq.${organizationId}` },
    []
  );

  // Load staff list for assignment
  useState(() => {
    const loadStaff = async () => {
      const { data } = await supabase
        .from('staff_profiles')
        .select('id, full_name, email, avatar_url')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      
      if (data) setStaffList(data);
    };
    loadStaff();
  });

  // Filter and sort milestones
  const filteredMilestones = milestones
    .filter(m => {
      const matchesSearch = 
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || m.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'due_date') {
        aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
        bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Statistics
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    pending: milestones.filter(m => m.status === 'pending').length,
    overdue: milestones.filter(m => 
      m.due_date && 
      isBefore(new Date(m.due_date), new Date()) && 
      m.status !== 'completed'
    ).length,
    critical: milestones.filter(m => m.priority === 'critical' && m.status !== 'completed').length
  };

  // Handle add/edit milestone
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const milestoneData = {
      organization_id: organizationId,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
      tags: formData.tags,
      status: editingMilestone ? editingMilestone.status : 'pending',
      progress: editingMilestone ? editingMilestone.progress : 0,
      updated_at: new Date().toISOString()
    };

    if (editingMilestone) {
      // Update
      await supabase
        .from('milestones')
        .update(milestoneData)
        .eq('id', editingMilestone.id);
    } else {
      // Create
      await supabase
        .from('milestones')
        .insert({
          ...milestoneData,
          created_at: new Date().toISOString(),
          created_by: currentUserId
        });
    }

    setShowAddModal(false);
    setEditingMilestone(null);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      assigned_to: '',
      tags: [],
      tagInput: ''
    });
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    const update: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (newStatus === 'completed') {
      update.completed_at = new Date().toISOString();
      update.progress = 100;
    }
    
    await supabase
      .from('milestones')
      .update(update)
      .eq('id', id);
  };

  // Handle progress update
  const handleProgressChange = async (id: string, progress: number) => {
    await supabase
      .from('milestones')
      .update({ 
        progress,
        status: progress === 100 ? 'completed' : 'in_progress',
        completed_at: progress === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    await supabase
      .from('milestones')
      .delete()
      .eq('id', id);
    setShowDeleteConfirm(null);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Check if milestone is overdue
  const isOverdue = (milestone: Milestone) => {
    return milestone.due_date && 
           isBefore(new Date(milestone.due_date), new Date()) && 
           milestone.status !== 'completed';
  };

  // Get assigned staff name
  const getAssignedName = (id?: string) => {
    if (!id) return 'Unassigned';
    const staff = staffList.find(s => s.id === id);
    return staff?.full_name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Milestones & Goals</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? `${milestones.length} milestones` : 'Connecting...'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingMilestone(null);
            setFormData({
              title: '',
              description: '',
              due_date: '',
              priority: 'medium',
              assigned_to: '',
              tags: [],
              tagInput: ''
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add Milestone
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} color="blue" />
        <StatCard title="Completed" value={stats.completed} color="green" />
        <StatCard title="In Progress" value={stats.inProgress} color="yellow" />
        <StatCard title="Overdue" value={stats.overdue} color="red" />
        <StatCard title="Critical" value={stats.critical} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search milestones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 border rounded-lg min-w-[200px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setSortField('title');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Title
                    {sortField === 'title' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setSortField('due_date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Due Date
                    {sortField === 'due_date' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {filteredMilestones.map((milestone) => (
                  <motion.tr
                    key={milestone.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`hover:bg-gray-50 ${
                      isOverdue(milestone) ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        {milestone.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {milestone.description}
                          </p>
                        )}
                        {milestone.tags && milestone.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {milestone.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {milestone.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{milestone.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={milestone.status}
                        onChange={(e) => handleStatusChange(milestone.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(milestone.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(milestone.priority)}`}>
                        {milestone.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {milestone.due_date ? (
                        <div>
                          <p className={`text-sm ${
                            isOverdue(milestone) ? 'text-red-600 font-medium' : ''
                          }`}>
                            {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                          </p>
                          {isOverdue(milestone) && (
                            <p className="text-xs text-red-500">Overdue</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No due date</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {milestone.assigned_to ? (
                          <>
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              {staffList.find(s => s.id === milestone.assigned_to)?.avatar_url ? (
                                <img 
                                  src={staffList.find(s => s.id === milestone.assigned_to)?.avatar_url}
                                  className="w-6 h-6 rounded-full"
                                  alt=""
                                />
                              ) : (
                                <span className="text-xs">
                                  {getAssignedName(milestone.assigned_to).charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm">
                              {getAssignedName(milestone.assigned_to)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${milestone.progress}%` }}
                            className={`h-full ${
                              milestone.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium w-12">
                          {milestone.progress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={milestone.progress}
                        onChange={(e) => handleProgressChange(milestone.id, parseInt(e.target.value))}
                        className="w-full mt-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMilestone(milestone);
                            setFormData({
                              title: milestone.title,
                              description: milestone.description || '',
                              due_date: milestone.due_date?.split('T')[0] || '',
                              priority: milestone.priority,
                              assigned_to: milestone.assigned_to || '',
                              tags: milestone.tags || [],
                              tagInput: ''
                            });
                            setShowAddModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(milestone.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMilestones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-5xl mb-4">🎯</p>
            <p className="text-gray-600 font-medium">No milestones found</p>
            <p className="text-sm text-gray-500 mt-1">
              {search ? 'Try adjusting your search' : 'Create your first milestone'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Enter milestone title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    placeholder="Describe this milestone..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={formData.tagInput}
                      onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                      className="flex-1 p-2 border rounded-lg"
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
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              tags: formData.tags.filter((_, i) => i !== index)
                            })}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
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
                    {editingMilestone ? 'Update' : 'Create'} Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-2">Delete Milestone</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this milestone? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} rounded-lg border p-3`}>
      <p className="text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};