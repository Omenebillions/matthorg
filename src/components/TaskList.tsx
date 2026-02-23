// /src/app/dashboard/TaskList.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Task {
  id: string
  title: string
  status: string
  assigned_to: string
}

export default function TaskList() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', localStorage.getItem('org_id')) // Example org filter

      if (error) console.error(error)
      else setTasks(data || [])
    }
    fetchTasks()
  }, [])

  return (
    <table className="w-full table-auto border rounded-lg overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Title</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Assigned To</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id} className="border-t">
            <td className="px-4 py-2">{t.title}</td>
            <td className="px-4 py-2 capitalize">{t.status}</td>
            <td className="px-4 py-2">{t.assigned_to}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}