// src/components/dashboard/industries/BreederDashboard.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Dog,
  Baby,
  Heart,
  Activity,
  Calendar,
  Syringe,
  PawPrint,
  Clock,
} from 'lucide-react'

interface BreederDashboardProps {
  data: any
}

export default function BreederDashboard({ data }: BreederDashboardProps) {
  // Sample data - in reality, this comes from the main dashboard
  const breedingStats = [
    { label: 'Total Dogs', value: data.dogCount || 24, icon: Dog, color: 'blue' },
    { label: 'In Heat', value: data.femalesInHeat || 3, icon: Heart, color: 'pink' },
    { label: 'Upcoming Litters', value: data.upcomingLitters || 2, icon: Baby, color: 'green' },
    { label: 'Health Due', value: data.healthDue || 5, icon: Syringe, color: 'orange' },
  ]

  const upcomingLitters = [
    { id: 1, dam: 'Bella', sire: 'Max', due: '2024-03-15', puppies: 6 },
    { id: 2, dam: 'Luna', sire: 'Rocky', due: '2024-03-28', puppies: 4 },
  ]

  const healthReminders = [
    { id: 1, dog: 'Charlie', type: 'Vaccination', due: '2024-03-10' },
    { id: 2, dog: 'Daisy', type: 'Deworming', due: '2024-03-12' },
    { id: 3, dog: 'Max', type: 'Checkup', due: '2024-03-15' },
  ]

  return (
    <div className="space-y-6">
      {/* Breeding Stats */}
      <div className="grid grid-cols-2 gap-4">
        {breedingStats.map((stat, i) => {
          const Icon = stat.icon
          const colors = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            pink: 'bg-pink-50 text-pink-600 border-pink-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
          }
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${colors[stat.color as keyof typeof colors]} rounded-xl p-4 border`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-75">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Litters */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Baby className="w-4 h-4 text-green-600" />
              Upcoming Litters
            </h3>
            <Link href="/breeder/litters" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingLitters.map((litter) => (
              <div key={litter.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{litter.dam} x {litter.sire}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(litter.due).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm bg-white px-2 py-1 rounded-full">
                  {litter.puppies} puppies
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Reminders */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Syringe className="w-4 h-4 text-orange-600" />
              Health Reminders
            </h3>
            <Link href="/breeder/health" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {healthReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="w-4 h-4 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{reminder.dog}</p>
                  <p className="text-xs text-gray-600">{reminder.type} • Due {new Date(reminder.due).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/breeder/heat"
          className="flex flex-col items-center p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition"
        >
          <Heart className="w-5 h-5 text-pink-600 mb-1" />
          <span className="text-xs text-pink-600">Track Heat</span>
        </Link>
        <Link
          href="/breeder/litters/new"
          className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition"
        >
          <Baby className="w-5 h-5 text-green-600 mb-1" />
          <span className="text-xs text-green-600">New Litter</span>
        </Link>
        <Link
          href="/breeder/health"
          className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition"
        >
          <Syringe className="w-5 h-5 text-orange-600 mb-1" />
          <span className="text-xs text-orange-600">Health</span>
        </Link>
        <Link
          href="/breeder/dogs/new"
          className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
        >
          <Dog className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-xs text-blue-600">Add Dog</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-2">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-gray-400" />
            <span>New litter registered for Bella (6 puppies)</span>
            <span className="text-xs text-gray-400 ml-auto">2h ago</span>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>Luna started heat cycle</span>
            <span className="text-xs text-gray-400 ml-auto">5h ago</span>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Syringe className="w-4 h-4 text-orange-400" />
            <span>Max received vaccinations</span>
            <span className="text-xs text-gray-400 ml-auto">1d ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}