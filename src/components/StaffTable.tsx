// /src/app/dashboard/StaffTable.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Staff {
  id: string
  name: string
  role: string
  email: string
}

export default function StaffTable() {
  const supabase = createClient()
  const [staff, setStaff] = useState<Staff[]>([])

  useEffect(() => {
    async function fetchStaff() {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('organization_id', localStorage.getItem('org_id'))

      if (error) console.error(error)
      else setStaff(data || [])
    }
    fetchStaff()
  }, [])

  return (
    <table className="w-full table-auto border rounded-lg overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Name</th>
          <th className="px-4 py-2 text-left">Role</th>
          <th className="px-4 py-2 text-left">Email</th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="px-4 py-2">{s.name}</td>
            <td className="px-4 py-2 capitalize">{s.role}</td>
            <td className="px-4 py-2">{s.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}