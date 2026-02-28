// src/components/dashboard/PerformanceMetrics.tsx
'use client';

import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CircleStackIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMetricsProps {
  taskCompletion: number;
  salesTarget: number;
  inventoryValue: number;
  staffProductivity: number;
}

export function PerformanceMetrics({
  taskCompletion,
  salesTarget,
  inventoryValue,
  staffProductivity,
}: PerformanceMetricsProps) {
  const metrics = [
    {
      title: 'Task Completion',
      value: `${Math.round(taskCompletion)}%`,
      icon: ChartBarIcon,
      color: 'from-blue-500 to-blue-600',
      progress: taskCompletion,
    },
    {
      title: 'Sales Target',
      value: `₦${(salesTarget * 0.75).toLocaleString()} / ₦${salesTarget.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      color: 'from-green-500 to-green-600',
      progress: 75, // Calculate actual progress
    },
    {
      title: 'Inventory Value',
      value: `₦${inventoryValue.toLocaleString()}`,
      icon: CircleStackIcon,
      color: 'from-purple-500 to-purple-600',
      progress: 60,
    },
    {
      title: 'Staff Productivity',
      value: `${staffProductivity}%`,
      icon: UserGroupIcon,
      color: 'from-orange-500 to-orange-600',
      progress: staffProductivity,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
        Performance Metrics
      </h2>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">{metric.title}</span>
              <span className="text-sm font-semibold">{metric.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${metric.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${metric.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
        <div className="bg-green-50 p-2 rounded">
          <p className="text-xs text-green-600">On Track</p>
          <p className="text-sm font-semibold">4 goals</p>
        </div>
        <div className="bg-yellow-50 p-2 rounded">
          <p className="text-xs text-yellow-600">Attention</p>
          <p className="text-sm font-semibold">1 area</p>
        </div>
      </div>
    </div>
  );
}