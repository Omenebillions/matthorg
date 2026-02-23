// /src/app/dashboard/AttendanceTable.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Attendance {
  id: string
  staff_name: string
  date: string
  status: string
}

export default function AttendanceTable() {
  const supabase = createClient()
  const [logs, setLogs] = useState<Attendance[]>([])

  useEffect(() => {
    async function fetchAttendance() {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('organization_id', localStorage.getItem('org_id'))

      if (error) console.error(error)
      else setLogs(data || [])
    }
    fetchAttendance()
  }, [])

  return (
    <table className="w-full table-auto border rounded-lg overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Staff</th>
          <th className="px-4 py-2 text-left">Date</th>
          <th className="px-4 py-2 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id} className="border-t">
            <td className="px-4 py-2">{log.staff_name}</td>
            <td className="px-4 py-2">{new Date(log.date).toLocaleDateString()}</td>
            <td className="px-4 py-2 capitalize">{log.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}