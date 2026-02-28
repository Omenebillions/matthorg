// /home/user/matthorg/src/components/dashboard/TaskList.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface TaskListProps {
  tasks?: any[]; // Make optional since we'll fetch live
  orgId: string; // Required for real-time
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export default function TaskList({ 
  tasks: initialTasks = [], 
  orgId,
  onStatusChange 
}: TaskListProps) {
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "" });
  
  const supabase = createClient();

  // Load initial tasks and setup real-time subscription
  useEffect(() => {
    if (!orgId) return;

    // Load initial tasks
    loadTasks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${orgId}`
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
  }, [orgId]);

  // Load tasks from database
  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setTasks(prev => [payload.new, ...prev]);
        break;
      case 'UPDATE':
        setTasks(prev => 
          prev.map(task => 
            task.id === payload.new.id ? { ...task, ...payload.new } : task
          )
        );
        break;
      case 'DELETE':
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        break;
    }
  };

  // Update task status
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error && onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  // Start editing task
  const startEdit = (task: any) => {
    setEditingTask(task.id);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });
  };

  // Save edited task
  const saveEdit = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: editForm.title,
        description: editForm.description,
        due_date: editForm.due_date || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error) {
      setEditingTask(null);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (!error) {
        // Task will be removed by real-time subscription
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with live status */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? 'Live' : 'Connecting...'}
            </span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {tasks.length} tasks
            </span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    {editingTask === task.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Task title"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Description"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTask === task.id ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status?.replace('_', ' ') || 'pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTask === task.id ? (
                      <input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {editingTask === task.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(task.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTask(null)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(task)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No tasks yet. Click "Add Task" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick add task */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => {
            // You can implement quick add modal here
            alert('Quick add task - to be implemented');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Task
        </button>
      </div>
    </div>
  );
}