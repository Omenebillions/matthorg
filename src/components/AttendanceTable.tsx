// /src/app/dashboard/AttendanceTable.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Attendance {
  id: string
  staff_name: string
  staff_id?: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  hours_worked?: number
  notes?: string
  created_at?: string
}

interface AttendanceTableProps {
  orgId: string
  limit?: number
  showFilters?: boolean
}

export default function AttendanceTable({ 
  orgId, 
  limit = 10,
  showFilters = true 
}: AttendanceTableProps) {
  const supabase = createClient()
  const [logs, setLogs] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  })

  useEffect(() => {
    if (!orgId) return

    // Load initial attendance
    loadAttendance()

    // Subscribe to real-time changes - FIXED: using 'attendance' table
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',  // ← FIXED: Changed from 'attendance_logs' to 'attendance'
          filter: `organization_id=eq.${orgId}`
        },
        (payload) => {
          console.log('⏰ Attendance update:', payload)
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, filter, dateRange])

  // Load attendance from database
  const loadAttendance = async () => {
    setLoading(true)
    
    let query = supabase
      .from('attendance')  // ← FIXED: Changed from 'attendance_logs' to 'attendance'
      .select('*')
      .eq('organization_id', orgId)
      .order('date', { ascending: false })

    // Apply date filter
    const today = new Date()
    if (dateRange === 'today') {
      const todayStr = today.toISOString().split('T')[0]
      query = query.eq('date', todayStr)
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today.setDate(today.getDate() - 7)).toISOString()
      query = query.gte('date', weekAgo)
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today.setMonth(today.getMonth() - 1)).toISOString()
      query = query.gte('date', monthAgo)
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
    } else {
      setLogs(data || [])
      calculateStats(data || [])
    }
    setLoading(false)
  }

  // Calculate attendance stats
  const calculateStats = (data: Attendance[]) => {
    const stats = {
      present: data.filter(l => l.status === 'present').length,
      absent: data.filter(l => l.status === 'absent').length,
      late: data.filter(l => l.status === 'late').length,
      total: data.length
    }
    setStats(stats)
  }

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    setLogs(prev => {
      let updated
      switch (payload.eventType) {
        case 'INSERT':
          updated = [payload.new, ...prev].slice(0, limit)
          break
        case 'UPDATE':
          updated = prev.map(log => 
            log.id === payload.new.id ? { ...log, ...payload.new } : log
          )
          break
        case 'DELETE':
          updated = prev.filter(log => log.id !== payload.old.id)
          break
        default:
          updated = prev
      }
      calculateStats(updated)
      return updated
    })
  }

  // Mark attendance
  const markAttendance = async (staffId: string, status: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('attendance')  // ← FIXED: Changed from 'attendance_logs' to 'attendance'
      .insert({
        organization_id: orgId,
        staff_id: staffId,
        date: today,
        status: status,
        check_in: status === 'present' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error marking attendance:', error)
    }
  }

  // Update attendance
  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    const { error } = await supabase
      .from('attendance')  // ← FIXED: Changed from 'attendance_logs' to 'attendance'
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating attendance:', error)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'half_day': return 'bg-orange-100 text-orange-800'
      case 'leave': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'present': return '✅'
      case 'absent': return '❌'
      case 'late': return '⚠️'
      case 'half_day': return '🌓'
      case 'leave': return '🏖️'
      default: return '📋'
    }
  }

  if (loading) {
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
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
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
                    <div className="text-sm font-medium text-gray-900">
                      {log.staff_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.check_in ? new Date(log.check_in).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.check_out ? new Date(log.check_out).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.hours_worked ? `${log.hours_worked}h` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      <span className="mr-1">{getStatusIcon(log.status)}</span>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {log.status === 'absent' && (
                        <button
                          onClick={() => updateAttendance(log.id, { status: 'present', check_in: new Date().toISOString() })}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Mark Present
                        </button>
                      )}
                      {log.status === 'present' && !log.check_out && (
                        <button
                          onClick={() => {
                            const checkOut = new Date().toISOString()
                            const hours = log.check_in 
                              ? (new Date(checkOut).getTime() - new Date(log.check_in).getTime()) / (1000 * 60 * 60)
                              : 0
                            updateAttendance(log.id, { 
                              check_out: checkOut,
                              hours_worked: Math.round(hours * 10) / 10
                            })
                          }}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {logs.length} of {stats.total} records
        </span>
        <button
          onClick={() => loadAttendance()}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}