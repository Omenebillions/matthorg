// /src/components/MilestonesTable.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { format, isBefore, differenceInDays } from 'date-fns';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserGroupIcon,
  FlagIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PhotoIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'ordered' | 'received' | 'installed';
  cost?: number;
  supplier?: string;
}

interface Photo {
  id: string;
  url: string;
  caption?: string;
  taken_at: string;
  taken_by?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

interface ChangeOrder {
  id: string;
  description: string;
  amount: number;
  reason: string;
  approved: boolean;
  approved_by?: string;
  created_at: string;
}

interface Milestone {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  assigned_to?: string | null;
  created_by?: string | null;
  completed_at?: string | null;
  started_at?: string | null;
  
  // Industry-specific fields
  project_id?: string | null;
  project_name?: string | null;
  location?: string | null;
  phase?: string | null;
  work_type?: string | null;
  materials?: Material[] | null;
  equipment_needed?: string[] | null;
  safety_requirements?: string[] | null;
  permits?: string[] | null;
  
  // Financial tracking
  estimated_cost?: number | null;
  actual_cost?: number | null;
  budget_variance?: number | null;
  
  // Time tracking
  estimated_hours?: number | null;
  actual_hours?: number | null;
  
  // Dependencies
  dependencies?: string[] | null;
  blocked_by?: string[] | null;
  
  // Documentation
  attachments?: Attachment[] | null;
  photos?: Photo[] | null;
  notes?: string[] | null;
  inspection_required?: boolean;
  inspection_passed?: boolean | null;
  inspection_date?: string | null;
  inspected_by?: string | null;
  
  // Weather impact
  weather_dependent?: boolean;
  weather_notes?: string | null;
  
  // Change orders
  change_orders?: ChangeOrder[] | null;
  
  tags?: string[] | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
}

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
  specialty?: string;
}

interface MilestonesTableProps {
  organizationId: string;
  currentUserId?: string;
  projectId?: string;
  industry?: 'construction' | 'oil_gas' | 'painting' | 'manufacturing' | 'general';
  viewMode?: 'board' | 'table' | 'gantt';
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';
type SortField = 'due_date' | 'priority' | 'status' | 'title' | 'progress' | 'phase' | 'location';
type SortOrder = 'asc' | 'desc';

// Loading skeleton
function MilestonesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="bg-white rounded-lg border">
        {[1,2,3].map(i => (
          <div key={i} className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, color, icon, subtitle }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${colors[color] || colors.blue} rounded-lg border p-4`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
    </motion.div>
  );
};

// Gantt Chart View Component
function GanttView({ milestones }: { milestones: Milestone[] }) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);
  
  const totalDays = differenceInDays(endDate, startDate);
  
  return (
    <div className="bg-white rounded-lg border p-4 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Timeline header */}
        <div className="flex mb-4 border-b pb-2">
          <div className="w-64 font-medium">Milestone</div>
          <div className="flex-1 flex">
            {Array.from({ length: totalDays }).map((_, i) => {
              const date = new Date(startDate);
              date.setDate(date.getDate() + i);
              if (date.getDate() === 1 || i === 0) {
                return (
                  <div key={i} className="flex-1 text-xs text-gray-500">
                    {format(date, 'MMM d')}
                  </div>
                );
              }
              return <div key={i} className="flex-1"></div>;
            })}
          </div>
        </div>

        {/* Gantt bars */}
        <AnimatePresence>
          {milestones.map((milestone) => {
            if (!milestone.due_date) return null;
            
            const dueDate = new Date(milestone.due_date);
            const startOffset = Math.max(0, differenceInDays(dueDate, startDate));
            const position = (startOffset / totalDays) * 100;
            
            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center mb-2 h-10"
              >
                <div className="w-64 truncate pr-2">
                  <p className="font-medium text-sm">{milestone.title}</p>
                  <p className="text-xs text-gray-500">{milestone.phase || 'General'}</p>
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`absolute h-6 rounded ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in_progress' ? 'bg-blue-500' :
                      milestone.status === 'cancelled' ? 'bg-gray-300' :
                      isBefore(dueDate, new Date()) ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{
                      left: `${position}%`,
                      width: '20px',
                      opacity: 0.8
                    }}
                    title={`${milestone.title}: Due ${format(dueDate, 'MMM d, yyyy')}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Kanban Board View
function KanbanView({ 
  milestones, 
  onStatusChange,
  onEdit,
  onDelete 
}: any) {
  const columns = [
    { id: 'pending', title: 'Pending', color: 'bg-yellow-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'on_hold', title: 'On Hold', color: 'bg-orange-100' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100' },
    { id: 'cancelled', title: 'Cancelled', color: 'bg-gray-100' },
  ];

  const getColumnMilestones = (status: string) => 
    milestones.filter((m: Milestone) => m.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
      {columns.map(column => (
        <div key={column.id} className="bg-gray-50 rounded-lg p-3 min-w-[250px]">
          <div className={`${column.color} p-2 rounded-lg mb-3`}>
            <h3 className="font-medium text-sm">{column.title}</h3>
            <p className="text-xs mt-1">{getColumnMilestones(column.id).length} items</p>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {getColumnMilestones(column.id).map((milestone: Milestone) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{milestone.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      milestone.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      milestone.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      milestone.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {milestone.priority}
                    </span>
                  </div>
                  
                  {milestone.location && (
                    <p className="text-xs text-gray-500 mb-2 flex items-center">
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      {milestone.location}
                    </p>
                  )}
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{milestone.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${milestone.progress}%` }}
                        className={`h-full ${
                          milestone.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {milestone.due_date && (
                    <p className={`text-xs mb-2 flex items-center ${
                      isBefore(new Date(milestone.due_date), new Date()) && 
                      milestone.status !== 'completed'
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      Due {format(new Date(milestone.due_date), 'MMM d')}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <div className="flex -space-x-1">
                      {milestone.assigned_to ? (
                        <div className="w-5 h-5 bg-gray-200 rounded-full border border-white" />
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(milestone)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(milestone.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MilestonesTable({ 
  organizationId,
  currentUserId,
  projectId,
  industry = 'general',
  viewMode: initialViewMode = 'table'
}: MilestonesTableProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  
  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>(projectId || 'all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState(initialViewMode);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Milestone | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assigned_to: '',
    project_id: projectId || '',
    phase: '',
    location: '',
    work_type: '',
    estimated_hours: '',
    estimated_cost: '',
    materials: [] as Material[],
    equipment_needed: [] as string[],
    safety_requirements: [] as string[],
    weather_dependent: false,
    inspection_required: false,
    tags: [] as string[],
    tagInput: ''
  });

  // Load initial data
  useEffect(() => {
    loadMilestones();
    loadStaff();
    if (industry !== 'general') {
      loadProjects();
    }
  }, [organizationId, projectId]);

  // Load milestones
  const loadMilestones = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('milestones')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: any) {
      console.error('Error loading milestones:', error);
      showToast(error.message || 'Failed to load milestones', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load staff
  const loadStaff = async () => {
    const { data } = await supabase
      .from('staff_profiles')
      .select('id, full_name, email, avatar_url, role')
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    
    if (data) setStaffList(data);
  };

  // Load projects
  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, client, location, status')
      .eq('organization_id', organizationId);
    
    if (data) setProjects(data);
  };

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('milestones-table')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
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
  }, [organizationId, supabase]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setMilestones(prev => [payload.new, ...prev]);
        showToast('New milestone added', 'success');
        break;
      case 'UPDATE':
        setMilestones(prev => 
          prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
        );
        break;
      case 'DELETE':
        setMilestones(prev => prev.filter(m => m.id !== payload.old.id));
        showToast('Milestone deleted', 'info');
        break;
    }
  };

  // Filter and sort milestones
  const filteredMilestones = milestones
    .filter(m => {
      const matchesSearch = 
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.location?.toLowerCase().includes(search.toLowerCase()) ||
        m.tags?.some(tag => tag?.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || m.priority === priorityFilter;
      const matchesPhase = phaseFilter === 'all' || m.phase === phaseFilter;
      const matchesProject = projectFilter === 'all' || m.project_id === projectFilter;
      const matchesLocation = locationFilter === 'all' || m.location === locationFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesPhase && matchesProject && matchesLocation;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof Milestone];
      let bValue: any = b[sortField as keyof Milestone];
      
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

  // Get unique values for filters
  const phases = [...new Set(milestones.map(m => m.phase).filter((p): p is string => !!p))];
  const locations = [...new Set(milestones.map(m => m.location).filter((l): l is string => !!l))];

  // Statistics
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
    pending: milestones.filter(m => m.status === 'pending').length,
    onHold: milestones.filter(m => m.status === 'on_hold').length,
    overdue: milestones.filter(m => 
      m.due_date && 
      isBefore(new Date(m.due_date), new Date()) && 
      m.status !== 'completed'
    ).length,
    critical: milestones.filter(m => m.priority === 'critical' && m.status !== 'completed').length,
    totalBudget: milestones.reduce((sum, m) => sum + (m.estimated_cost || 0), 0),
    actualCost: milestones.reduce((sum, m) => sum + (m.actual_cost || 0), 0),
  };

  // Handle add/edit milestone
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const milestoneData = {
        organization_id: organizationId,
        project_id: formData.project_id || null,
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        phase: formData.phase || null,
        location: formData.location || null,
        work_type: formData.work_type || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        materials: formData.materials,
        equipment_needed: formData.equipment_needed,
        safety_requirements: formData.safety_requirements,
        weather_dependent: formData.weather_dependent,
        inspection_required: formData.inspection_required,
        tags: formData.tags,
        status: editingMilestone ? editingMilestone.status : 'pending',
        progress: editingMilestone ? editingMilestone.progress : 0,
        updated_at: new Date().toISOString()
      };

      if (editingMilestone) {
        const { error } = await supabase
          .from('milestones')
          .update(milestoneData)
          .eq('id', editingMilestone.id);

        if (error) throw error;
        showToast('Milestone updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('milestones')
          .insert({
            ...milestoneData,
            created_at: new Date().toISOString(),
            created_by: currentUserId
          });

        if (error) throw error;
        showToast('Milestone created successfully', 'success');
      }

      setShowAddModal(false);
      setEditingMilestone(null);
      resetForm();
      
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      showToast(error.message || 'Failed to save milestone', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      assigned_to: '',
      project_id: projectId || '',
      phase: '',
      location: '',
      work_type: '',
      estimated_hours: '',
      estimated_cost: '',
      materials: [],
      equipment_needed: [],
      safety_requirements: [],
      weather_dependent: false,
      inspection_required: false,
      tags: [],
      tagInput: ''
    });
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const update: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'in_progress' && !editingMilestone?.started_at) {
        update.started_at = new Date().toISOString();
      }
      
      if (newStatus === 'completed') {
        update.completed_at = new Date().toISOString();
        update.progress = 100;
      }
      
      const { error } = await supabase
        .from('milestones')
        .update(update)
        .eq('id', id);

      if (error) throw error;
      showToast('Status updated', 'success');
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  // Handle progress update
  const handleProgressChange = async (id: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ 
          progress,
          status: progress === 100 ? 'completed' : 
                  progress > 0 ? 'in_progress' : 'pending',
          completed_at: progress === 100 ? new Date().toISOString() : null,
          started_at: progress > 0 && !editingMilestone?.started_at ? 
                     new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
    } catch (error: any) {
      console.error('Error updating progress:', error);
      showToast(error.message || 'Failed to update progress', 'error');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setShowDeleteConfirm(null);
      showToast('Milestone deleted', 'success');
      
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      showToast(error.message || 'Failed to delete milestone', 'error');
    }
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
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'in_progress': return <ClockIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'on_hold': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />;
      default: return <FlagIcon className="w-4 h-4" />;
    }
  };

  // Check if milestone is overdue
  const isOverdue = (milestone: Milestone) => {
    return milestone.due_date && 
           isBefore(new Date(milestone.due_date), new Date()) && 
           milestone.status !== 'completed';
  };

  // Get assigned staff name
  const getAssignedName = (id?: string | null) => {
    if (!id) return 'Unassigned';
    const staff = staffList.find(s => s.id === id);
    return staff?.full_name || 'Unknown';
  };

  if (loading) {
    return <MilestonesSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Project Milestones</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? `${milestones.length} milestones` : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'table' ? 'bg-white shadow' : ''
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'board' ? 'bg-white shadow' : ''
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'gantt' ? 'bg-white shadow' : ''
              }`}
            >
              Gantt
            </button>
          </div>

          <button
            onClick={() => {
              setEditingMilestone(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Stats Cards - Industry specific */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total" 
          value={stats.total} 
          color="blue" 
          icon="📊"
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          color="yellow" 
          icon="⚙️"
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          color="green" 
          icon="✅"
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdue} 
          color="red" 
          icon="⚠️"
          subtitle={`${stats.critical} critical`}
        />
        {industry !== 'general' && (
          <StatCard 
            title="Budget" 
            value={`₦${(stats.actualCost || 0).toLocaleString()}`} 
            color="purple" 
            icon="💰"
            subtitle={`of ₦${(stats.totalBudget || 0).toLocaleString()}`}
          />
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
            className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {phases.length > 0 && (
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Phases</option>
              {phases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          )}

          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
          >
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="title">Sort by Title</option>
            <option value="progress">Sort by Progress</option>
            {industry !== 'general' && (
              <>
                <option value="phase">Sort by Phase</option>
                <option value="location">Sort by Location</option>
              </>
            )}
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* View Mode */}
      {viewMode === 'gantt' ? (
        <GanttView milestones={filteredMilestones} />
      ) : viewMode === 'board' ? (
        <KanbanView 
          milestones={filteredMilestones}
          onStatusChange={handleStatusChange}
          onEdit={(m: Milestone) => {
            setEditingMilestone(m);
            setFormData({
              title: m.title,
              description: m.description || '',
              due_date: m.due_date?.split('T')[0] || '',
              priority: m.priority,
              assigned_to: m.assigned_to || '',
              project_id: m.project_id || '',
              phase: m.phase || '',
              location: m.location || '',
              work_type: m.work_type || '',
              estimated_hours: m.estimated_hours?.toString() || '',
              estimated_cost: m.estimated_cost?.toString() || '',
              materials: m.materials || [],
              equipment_needed: m.equipment_needed || [],
              safety_requirements: m.safety_requirements || [],
              weather_dependent: m.weather_dependent || false,
              inspection_required: m.inspection_required || false,
              tags: m.tags || [],
              tagInput: ''
            });
            setShowAddModal(true);
          }}
          onDelete={(id: string) => setShowDeleteConfirm(id)}
        />
      ) : (
        /* Table View */
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
                  {industry !== 'general' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phase/Location
                    </th>
                  )}
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
                  {industry !== 'general' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  )}
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
                        <div className="cursor-pointer" onClick={() => setShowDetailsModal(milestone)}>
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
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {industry !== 'general' && (
                        <td className="px-4 py-3">
                          {milestone.phase && (
                            <p className="text-sm font-medium">{milestone.phase}</p>
                          )}
                          {milestone.location && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              {milestone.location}
                            </p>
                          )}
                        </td>
                      )}
                      
                      <td className="px-4 py-3">
                        <select
                          value={milestone.status}
                          onChange={(e) => handleStatusChange(milestone.id, e.target.value)}
                          className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(milestone.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="on_hold">On Hold</option>
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
                                    src={staffList.find(s => s.id === milestone.assigned_to)?.avatar_url || ''}
                                    className="w-6 h-6 rounded-full object-cover"
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
                      
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${milestone.progress}%` }}
                                className={`h-full ${
                                  milestone.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                              />
                            </div>
                            <span className="text-xs font-medium w-10">
                              {milestone.progress}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={milestone.progress}
                            onChange={(e) => handleProgressChange(milestone.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </td>
                      
                      {industry !== 'general' && (
                        <td className="px-4 py-3">
                          {milestone.estimated_cost ? (
                            <div>
                              <p className="text-sm font-medium">
                                ₦{milestone.estimated_cost.toLocaleString()}
                              </p>
                              {milestone.actual_cost && (
                                <p className={`text-xs ${
                                  milestone.actual_cost > milestone.estimated_cost 
                                    ? 'text-red-500' 
                                    : 'text-green-500'
                                }`}>
                                  Actual: ₦{milestone.actual_cost.toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      
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
                                project_id: milestone.project_id || '',
                                phase: milestone.phase || '',
                                location: milestone.location || '',
                                work_type: milestone.work_type || '',
                                estimated_hours: milestone.estimated_hours?.toString() || '',
                                estimated_cost: milestone.estimated_cost?.toString() || '',
                                materials: milestone.materials || [],
                                equipment_needed: milestone.equipment_needed || [],
                                safety_requirements: milestone.safety_requirements || [],
                                weather_dependent: milestone.weather_dependent || false,
                                inspection_required: milestone.inspection_required || false,
                                tags: milestone.tags || [],
                                tagInput: ''
                              });
                              setShowAddModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(milestone.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDetailsModal(milestone)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="View Details"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
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
              <FlagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No milestones found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Try adjusting your search' : 'Create your first milestone'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
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

                {/* Project Selection (if available) */}
                {projects.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Project</label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} - {project.client}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dates and Assignment */}
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

                <div className="grid grid-cols-2 gap-4">
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
                          {staff.full_name} {staff.role ? `(${staff.role})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {industry !== 'general' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Work Type</label>
                      <input
                        type="text"
                        value={formData.work_type}
                        onChange={(e) => setFormData({...formData, work_type: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Foundation, Piping, Painting"
                      />
                    </div>
                  )}
                </div>

                {/* Industry-specific fields */}
                {industry !== 'general' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Phase</label>
                        <input
                          type="text"
                          value={formData.phase}
                          onChange={(e) => setFormData({...formData, phase: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                          placeholder="e.g., Phase 1, Foundation"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                          placeholder="Site location"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Est. Hours</label>
                        <input
                          type="number"
                          value={formData.estimated_hours}
                          onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                          placeholder="0"
                          min="0"
                          step="0.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Est. Cost (₦)</label>
                        <input
                          type="number"
                          value={formData.estimated_cost}
                          onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                          className="w-full p-2 border rounded-lg"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Toggles for special requirements */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.weather_dependent}
                      onChange={(e) => setFormData({...formData, weather_dependent: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Weather Dependent</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.inspection_required}
                      onChange={(e) => setFormData({...formData, inspection_required: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Inspection Required</span>
                  </label>
                </div>

                {/* Tags */}
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

                {/* Form Actions */}
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{showDetailsModal.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {format(new Date(showDetailsModal.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {showDetailsModal.description && (
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-gray-600">{showDetailsModal.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-gray-500">Status</h4>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor(showDetailsModal.status)}`}>
                      {showDetailsModal.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500">Priority</h4>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getPriorityColor(showDetailsModal.priority)}`}>
                      {showDetailsModal.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-gray-500">Due Date</h4>
                    <p className="font-medium">
                      {showDetailsModal.due_date 
                        ? format(new Date(showDetailsModal.due_date), 'MMMM d, yyyy')
                        : 'No due date'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500">Assigned To</h4>
                    <p className="font-medium">{getAssignedName(showDetailsModal.assigned_to)}</p>
                  </div>
                </div>

                {showDetailsModal.location && (
                  <div>
                    <h4 className="text-sm text-gray-500">Location</h4>
                    <p className="font-medium">{showDetailsModal.location}</p>
                  </div>
                )}

                {showDetailsModal.phase && (
                  <div>
                    <h4 className="text-sm text-gray-500">Phase</h4>
                    <p className="font-medium">{showDetailsModal.phase}</p>
                  </div>
                )}

                {showDetailsModal.estimated_cost && (
                  <div>
                    <h4 className="text-sm text-gray-500">Estimated Cost</h4>
                    <p className="font-medium">₦{showDetailsModal.estimated_cost.toLocaleString()}</p>
                  </div>
                )}

                {showDetailsModal.actual_cost && (
                  <div>
                    <h4 className="text-sm text-gray-500">Actual Cost</h4>
                    <p className={`font-medium ${
                      showDetailsModal.actual_cost > (showDetailsModal.estimated_cost || 0) 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      ₦{showDetailsModal.actual_cost.toLocaleString()}
                    </p>
                  </div>
                )}

                {showDetailsModal.materials && showDetailsModal.materials.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Materials</h4>
                    <div className="space-y-2">
                      {showDetailsModal.materials.map((material: Material) => (
                        <div key={material.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-xs text-gray-500">
                              {material.quantity} {material.unit} • {material.supplier || 'No supplier'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            material.status === 'received' ? 'bg-green-100 text-green-700' :
                            material.status === 'ordered' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {material.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showDetailsModal.tags && showDetailsModal.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {showDetailsModal.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}