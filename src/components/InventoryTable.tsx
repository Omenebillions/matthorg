// /src/app/dashboard/InventoryTable.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  price: number
}

export default function InventoryTable() {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    async function fetchInventory() {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', localStorage.getItem('org_id'))

      if (error) console.error(error)
      else setItems(data || [])
    }
    fetchInventory()
  }, [])

  return (
    <table className="w-full table-auto border rounded-lg overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Product</th>
          <th className="px-4 py-2 text-left">Quantity</th>
          <th className="px-4 py-2 text-left">Price</th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id} className="border-t">
            <td className="px-4 py-2">{i.name}</td>
            <td className="px-4 py-2">{i.quantity}</td>
            <td className="px-4 py-2">${i.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}