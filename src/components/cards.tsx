// /src/app/dashboard/Cards.tsx
'use client'
import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import React from 'react'

interface CardProps {
  title: string
  value: number | string
  color?: string
}

export default function Card({ title, value, color = 'bg-white' }: CardProps) {
  return (
    <div className={`${color} p-6 rounded-2xl shadow-md`}>
      <h2 className="text-gray-500 text-sm font-semibold mb-2">{title}</h2>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}