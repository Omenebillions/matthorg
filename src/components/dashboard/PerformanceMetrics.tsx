// src/components/dashboard/PerformanceMetrics.tsx
'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CircleStackIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMetricsProps {
  organizationId: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  showDetails?: boolean;
  onMetricClick?: (metric: string) => void;
}

interface MetricData {
  title: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  progress: number;
  target: number;
  actual: number;
  trend?: number;
  status: 'on_track' | 'ahead' | 'behind' | 'critical';
  details?: string;
}

// Loading skeleton
function MetricsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    ahead: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon, label: 'Ahead' },
    on_track: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircleIcon, label: 'On Track' },
    behind: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ExclamationTriangleIcon, label: 'Behind' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', icon: ExclamationTriangleIcon, label: 'Critical' },
  };

  const cfg = config[status as keyof typeof config] || config.on_track;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// Metric Card Component
function MetricCard({ metric, onClick }: { metric: MetricData; onClick?: () => void }) {
  const Icon = metric.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 text-white`} />
        </div>
        <StatusBadge status={metric.status} />
      </div>

      <h3 className="text-sm text-gray-600 mb-1">{metric.title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</p>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{metric.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metric.progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-2 rounded-full bg-gradient-to-r ${metric.color}`}
          />
        </div>
      </div>

      {/* Target vs Actual */}
      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Target</span>
          <p className="font-medium">{metric.target.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-500">Actual</span>
          <p className="font-medium">{metric.actual.toLocaleString()}</p>
        </div>
      </div>

      {/* Trend Indicator */}
      {metric.trend !== undefined && (
        <div className={`mt-2 text-xs flex items-center gap-1 ${
          metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          <ArrowTrendingUpIcon className={`w-3 h-3 ${metric.trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(metric.trend)}% from last period</span>
        </div>
      )}

      {/* Details Tooltip */}
      {metric.details && (
        <div className="mt-2 group relative inline-block">
          <InformationCircleIcon className="w-4 h-4 text-gray-400" />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 whitespace-nowrap z-10">
            {metric.details}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Detailed View Modal
function MetricDetailsModal({ metric, onClose }: { metric: MetricData; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">{metric.title} Details</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-xl font-bold">{metric.target.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Actual</p>
              <p className="text-xl font-bold">{metric.actual.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-blue-600">Progress</p>
            <p className="text-2xl font-bold text-blue-700">{metric.progress}%</p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div className={`bg-blue-600 h-2 rounded-full`} style={{ width: `${metric.progress}%` }} />
            </div>
          </div>

          {metric.trend !== undefined && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Trend</p>
              <p className={`text-lg font-bold ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.trend > 0 ? '+' : ''}{metric.trend}%
              </p>
            </div>
          )}

          {metric.details && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm">{metric.details}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export function PerformanceMetrics({ 
  organizationId, 
  timeframe = 'month',
  showDetails = true,
  onMetricClick 
}: PerformanceMetricsProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState({
    tasks: { total: 0, completed: 0 },
    sales: { target: 100000, actual: 75000 }, // Example targets
    inventory: { value: 0, items: 0 },
    staff: { total: 0, active: 0, productive: 0 },
  });

  // Fetch real data
  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch tasks data
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('organization_id', organizationId);

      if (tasksError) throw tasksError;

      // Fetch inventory data
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, sale_price')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (inventoryError) throw inventoryError;

      // Fetch staff data
      const { data: staff, error: staffError } = await supabase
        .from('staff_profiles')
        .select('status, last_seen')
        .eq('organization_id', organizationId);

      if (staffError) throw staffError;

      // Calculate metrics
      const taskCompletion = tasks?.length 
        ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
        : 0;

      const inventoryValue = inventory?.reduce((sum, item) => 
        sum + (item.quantity * (item.sale_price || 0)), 0) || 0;

      const activeStaff = staff?.filter(s => s.status === 'active').length || 0;
      const staffProductivity = staff?.length 
        ? (activeStaff / staff.length) * 100 
        : 0;

      setMetrics({
        tasks: { 
          total: tasks?.length || 0, 
          completed: tasks?.filter(t => t.status === 'completed').length || 0 
        },
        sales: { target: 100000, actual: 75000 }, // You'd fetch this from sales table
        inventory: { value: inventoryValue, items: inventory?.length || 0 },
        staff: { 
          total: staff?.length || 0, 
          active: activeStaff,
          productive: staffProductivity 
        },
      });

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      showToast(error.message || 'Failed to load metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
  }, [organizationId, timeframe]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channels = [
      supabase
        .channel('metrics-tasks')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${organizationId}` },
          () => fetchMetrics()
        )
        .subscribe(),

      supabase
        .channel('metrics-inventory')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${organizationId}` },
          () => fetchMetrics()
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        }),

      supabase
        .channel('metrics-staff')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'staff_profiles', filter: `organization_id=eq.${organizationId}` },
          () => fetchMetrics()
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [organizationId]);

  // Calculate performance metrics
  const performanceMetrics = useMemo((): MetricData[] => {
    const taskProgress = metrics.tasks.total > 0 
      ? (metrics.tasks.completed / metrics.tasks.total) * 100 
      : 0;

    const salesProgress = metrics.sales.target > 0 
      ? (metrics.sales.actual / metrics.sales.target) * 100 
      : 0;

    // Determine status based on progress
    const getStatus = (progress: number, type: string): MetricData['status'] => {
      if (progress >= 100) return 'ahead';
      if (progress >= 75) return 'on_track';
      if (progress >= 50) return 'behind';
      return 'critical';
    };

    return [
      {
        title: 'Task Completion',
        value: `${Math.round(taskProgress)}%`,
        icon: ChartBarIcon,
        color: 'from-blue-500 to-blue-600',
        progress: taskProgress,
        target: metrics.tasks.total,
        actual: metrics.tasks.completed,
        trend: 5.2, // You'd calculate this from historical data
        status: getStatus(taskProgress, 'tasks'),
        details: `${metrics.tasks.completed} of ${metrics.tasks.total} tasks completed`,
      },
      {
        title: 'Sales Target',
        value: `₦${metrics.sales.actual.toLocaleString()}`,
        icon: ArrowTrendingUpIcon,
        color: 'from-green-500 to-green-600',
        progress: salesProgress,
        target: metrics.sales.target,
        actual: metrics.sales.actual,
        trend: -2.1,
        status: getStatus(salesProgress, 'sales'),
        details: `${salesProgress.toFixed(1)}% of monthly target achieved`,
      },
      {
        title: 'Inventory Value',
        value: `₦${metrics.inventory.value.toLocaleString()}`,
        icon: CircleStackIcon,
        color: 'from-purple-500 to-purple-600',
        progress: 60, // You'd calculate this based on targets
        target: metrics.inventory.value,
        actual: metrics.inventory.value,
        status: 'on_track',
        details: `${metrics.inventory.items} items in stock`,
      },
      {
        title: 'Staff Productivity',
        value: `${Math.round(metrics.staff.productive)}%`,
        icon: UserGroupIcon,
        color: 'from-orange-500 to-orange-600',
        progress: metrics.staff.productive,
        target: metrics.staff.total,
        actual: metrics.staff.active,
        trend: 1.5,
        status: metrics.staff.productive >= 80 ? 'on_track' : 'behind',
        details: `${metrics.staff.active} of ${metrics.staff.total} staff active`,
      },
    ];
  }, [metrics]);

  const handleMetricClick = (metric: MetricData) => {
    if (showDetails) {
      setSelectedMetric(metric);
    }
    if (onMetricClick) {
      onMetricClick(metric.title);
    }
  };

  if (loading) {
    return <MetricsSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
            Performance Metrics
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 hidden sm:inline">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchMetrics}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded transition"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            {/* Timeframe Indicator */}
            <span className="text-xs text-gray-400 capitalize">
              {timeframe}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {performanceMetrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              metric={metric}
              onClick={() => handleMetricClick(metric)}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600">On Track</p>
            <p className="text-lg font-semibold text-green-700">
              {performanceMetrics.filter(m => m.status === 'on_track' || m.status === 'ahead').length}
            </p>
            <p className="text-xs text-gray-500">metrics</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-600">Needs Attention</p>
            <p className="text-lg font-semibold text-yellow-700">
              {performanceMetrics.filter(m => m.status === 'behind' || m.status === 'critical').length}
            </p>
            <p className="text-xs text-gray-500">metrics</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-3 text-xs text-gray-400 text-right">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <MetricDetailsModal
            metric={selectedMetric}
            onClose={() => setSelectedMetric(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(PerformanceMetrics);