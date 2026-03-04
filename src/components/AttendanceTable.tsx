// /src/app/dashboard/AttendanceTable.tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Attendance {
  id: string
  organization_id: string
  staff_id: string
  staff_name?: string
  date: string
  check_in?: string | null
  check_out?: string | null
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  hours_worked?: number | null
  notes?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
  staff_profiles?: {
    full_name: string
    avatar_url?: string | null
  }
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string | null
}

interface AttendanceTableProps {
  orgId: string
  limit?: number
  showFilters?: boolean
  showQuickActions?: boolean
  onAttendanceChange?: () => void
}

// Loading skeleton
function AttendanceSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'present':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="w-3 h-3 mr-1" />,
          label: 'Present'
        }
      case 'absent':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircleIcon className="w-3 h-3 mr-1" />,
          label: 'Absent'
        }
      case 'late':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ExclamationTriangleIcon className="w-3 h-3 mr-1" />,
          label: 'Late'
        }
      case 'half_day':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <ClockIcon className="w-3 h-3 mr-1" />,
          label: 'Half Day'
        }
      case 'leave':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: '🏖️',
          label: 'Leave'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: '📋',
          label: status
        }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// Edit Modal Component
function EditAttendanceModal({ 
  isOpen, 
  onClose, 
  attendance,
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  attendance: Attendance | null
  onSave: (id: string, updates: Partial<Attendance>) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    check_in: '',
    check_out: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (attendance) {
      setFormData({
        status: attendance.status || 'present',
        notes: attendance.notes || '',
        check_in: attendance.check_in?.slice(0, 16) || '',
        check_out: attendance.check_out?.slice(0, 16) || '',
      })
    }
  }, [attendance])

  if (!isOpen || !attendance) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const updates: Partial<Attendance> = {
      status: formData.status as any,
      notes: formData.notes || null,
    }
    
    if (formData.check_in) {
      updates.check_in = new Date(formData.check_in).toISOString()
    }
    if (formData.check_out) {
      updates.check_out = new Date(formData.check_out).toISOString()
    }
    
    // Calculate hours worked if both check-in and check-out exist
    if (updates.check_in && updates.check_out) {
      const hours = (new Date(updates.check_out).getTime() - new Date(updates.check_in).getTime()) / (1000 * 60 * 60)
      updates.hours_worked = Math.round(hours * 10) / 10
    }
    
    await onSave(attendance.id, updates)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Attendance Record</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
            <input
              type="datetime-local"
              value={formData.check_in}
              onChange={(e) => setFormData({...formData, check_in: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
            <input
              type="datetime-local"
              value={formData.check_out}
              onChange={(e) => setFormData({...formData, check_out: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
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
  )
}

// Main Component
export default function AttendanceTable({ 
  orgId, 
  limit = 10,
  showFilters = true,
  showQuickActions = true,
  onAttendanceChange
}: AttendanceTableProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [logs, setLogs] = useState<Attendance[]>([])
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    half_day: 0,
    leave: 0,
    total: 0
  })

  // Load staff for quick actions
  const loadStaff = useCallback(async () => {
    if (!orgId) return
    
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id, full_name, email, avatar_url')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('full_name')
    
    if (error) {
      console.error('Error loading staff:', error)
    } else {
      setStaff(data || [])
    }
  }, [orgId, supabase])

  // Load attendance from database
  const loadAttendance = useCallback(async () => {
    if (!orgId) return
    
    setLoading(true)
    
    let query = supabase
      .from('attendance')
      .select(`
        *,
        staff_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', orgId)
      .order('date', { ascending: false })
      .order('check_in', { ascending: false })

    // Apply date filter
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    if (dateRange === 'today') {
      query = query.eq('date', todayStr)
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('date', weekAgo.toISOString().split('T')[0])
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      query = query.gte('date', monthAgo.toISOString().split('T')[0])
    }

    // Apply status filter
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    // Apply limit
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error loading attendance:', error)
      showToast('Failed to load attendance records', 'error')
    } else {
      const formattedData = data.map(item => ({
        ...item,
        staff_name: item.staff_profiles?.full_name || 'Unknown Staff'
      }))
      setLogs(formattedData || [])
      calculateStats(formattedData || [])
    }
    setLoading(false)
  }, [orgId, dateRange, filter, limit, supabase, showToast])

  // Calculate attendance stats
  const calculateStats = (data: Attendance[]) => {
    const stats = {
      present: data.filter(l => l.status === 'present').length,
      absent: data.filter(l => l.status === 'absent').length,
      late: data.filter(l => l.status === 'late').length,
      half_day: data.filter(l => l.status === 'half_day').length,
      leave: data.filter(l => l.status === 'leave').length,
      total: data.length
    }
    setStats(stats)
  }

  // Initial load
  useEffect(() => {
    if (!orgId) return

    loadAttendance()
    if (showQuickActions) {
      loadStaff()
    }

    // Subscribe to real-time changes
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `organization_id=eq.${orgId}`
        },
        (payload) => {
          console.log('⏰ Attendance update:', payload)
          handleRealtimeUpdate(payload)
          if (onAttendanceChange) onAttendanceChange()
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, dateRange, filter, loadAttendance, loadStaff, showQuickActions, supabase, onAttendanceChange])

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    setLogs(prev => {
      let updated
      switch (payload.eventType) {
        case 'INSERT':
          updated = [payload.new, ...prev].slice(0, limit)
          showToast('New attendance record added', 'success')
          break
        case 'UPDATE':
          updated = prev.map(log => 
            log.id === payload.new.id ? { ...log, ...payload.new } : log
          )
          showToast('Attendance record updated', 'success')
          break
        case 'DELETE':
          updated = prev.filter(log => log.id !== payload.old.id)
          showToast('Attendance record deleted', 'info')
          break
        default:
          updated = prev
      }
      calculateStats(updated)
      return updated
    })
  }

  // Mark attendance
  const markAttendance = async (staffId: string, staffName: string, status: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    // Check if already marked for today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('organization_id', orgId)
      .eq('staff_id', staffId)
      .eq('date', today)
      .maybeSingle()
    
    if (existing) {
      showToast('Attendance already marked for today', 'warning')
      return
    }
    
    const { error } = await supabase
      .from('attendance')
      .insert({
        organization_id: orgId,
        staff_id: staffId,
        staff_name: staffName,
        date: today,
        status: status,
        check_in: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error marking attendance:', error)
      showToast(error.message || 'Failed to mark attendance', 'error')
    } else {
      showToast('Attendance marked successfully', 'success')
    }
  }

  // Update attendance
  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    const { error } = await supabase
      .from('attendance')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) {
      console.error('Error updating attendance:', error)
      showToast(error.message || 'Failed to update attendance', 'error')
    } else {
      showToast('Attendance updated successfully', 'success')
    }
  }

  // Delete attendance
  const deleteAttendance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return
    
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) {
      console.error('Error deleting attendance:', error)
      showToast(error.message || 'Failed to delete attendance', 'error')
    } else {
      showToast('Attendance deleted successfully', 'success')
    }
  }

  // Check out
  const handleCheckOut = async (log: Attendance) => {
    const checkOut = new Date().toISOString()
    const hours = log.check_in 
      ? (new Date(checkOut).getTime() - new Date(log.check_in).getTime()) / (1000 * 60 * 60)
      : 0
    
    await updateAttendance(log.id, { 
      check_out: checkOut,
      hours_worked: Math.round(hours * 10) / 10
    })
  }

  if (loading) {
    return <AttendanceSkeleton />
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with stats and live status */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Attendance Logs</h3>
            <p className="text-sm text-gray-500">Real-time staff attendance tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
              <span className="text-xs text-gray-500">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>
            <button
              onClick={() => loadAttendance()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{stats.present}</div>
            <div className="text-xs text-green-600">Present</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            <div className="text-xs text-red-600">Absent</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
            <div className="text-xs text-yellow-600">Late</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-700">{stats.half_day}</div>
            <div className="text-xs text-orange-600">Half Day</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-700">{stats.leave}</div>
            <div className="text-xs text-purple-600">Leave</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 text-sm rounded ${
                  dateRange === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-3 py-1 text-sm rounded ${
                  dateRange === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-3 py-1 text-sm rounded ${
                  dateRange === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('present')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'present' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Present
              </button>
              <button
                onClick={() => setFilter('absent')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'absent' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => setFilter('late')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'late' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Late
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick mark attendance (if enabled) */}
      {showQuickActions && staff.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Mark Attendance</h4>
          <div className="flex flex-wrap gap-2">
            {staff.slice(0, 5).map(person => {
              const today = new Date().toISOString().split('T')[0]
              const alreadyMarked = logs.some(l => 
                l.staff_id === person.id && l.date.split('T')[0] === today
              )
              
              return (
                <button
                  key={person.id}
                  onClick={() => markAttendance(person.id, person.full_name, 'present')}
                  disabled={alreadyMarked}
                  className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${
                    alreadyMarked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={alreadyMarked ? 'Already marked today' : `Mark ${person.full_name} as present`}
                >
                  <UserIcon className="w-3 h-3" />
                  {person.full_name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Attendance table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        {log.staff_profiles?.avatar_url ? (
                          <img src={log.staff_profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          log.staff_name?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.staff_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.check_in ? new Date(log.check_in).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.check_out ? new Date(log.check_out).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {log.hours_worked ? `${log.hours_worked}h` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingAttendance(log)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {log.status === 'absent' && (
                        <button
                          onClick={() => updateAttendance(log.id, { 
                            status: 'present', 
                            check_in: new Date().toISOString() 
                          })}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 text-sm"
                          title="Mark Present"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      {log.status === 'present' && !log.check_out && (
                        <button
                          onClick={() => handleCheckOut(log)}
                          className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 text-sm"
                          title="Check Out"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteAttendance(log.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No attendance records found</p>
                  <p className="text-sm mt-1">
                    {filter !== 'all' || dateRange !== 'today' 
                      ? 'Try adjusting your filters'
                      : 'Staff will appear here when they clock in'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {logs.length} of {stats.total} records
        </span>
        <button
          onClick={() => loadAttendance()}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Edit Modal */}
      <EditAttendanceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingAttendance(null)
        }}
        attendance={editingAttendance}
        onSave={updateAttendance}
      />
    </div>
  )
}