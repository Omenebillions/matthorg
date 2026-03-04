// /home/user/matthorg/src/components/dashboard/SalesChart.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export interface SalesChartProps {
  orgId: string;
  onDataUpdate?: () => void;
  showControls?: boolean;
}

interface Sale {
  id: string;
  amount: number;
  customer_name?: string | null;
  payment_method?: string | null;
  payment_status?: 'paid' | 'pending' | 'refunded';
  status?: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  organization_id: string;
  created_by?: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  total: number;
  count: number;
  cash: number;
  card: number;
  transfer: number;
  mobile_money: number;
  credit: number;
  average: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

type ChartType = 'line' | 'bar' | 'area' | 'pie';
type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
type MetricType = 'sales' | 'count' | 'average';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Loading skeleton
function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border max-w-xs">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600">{entry.name}:</span>
              </div>
              <span className="text-sm font-medium">₦{entry.value?.toLocaleString() || 0}</span>
            </div>
          ))}
          
          {data && (
            <div className="pt-2 mt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium">{data.count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average:</span>
                <span className="font-medium">₦{(data.average || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Date range picker component
function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange 
}: { 
  startDate: string; 
  endDate: string; 
  onStartChange: (date: string) => void; 
  onEndChange: (date: string) => void; 
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="px-2 py-1 text-sm border rounded-lg"
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="px-2 py-1 text-sm border rounded-lg"
      />
    </div>
  );
}

export default function SalesChart({ orgId, onDataUpdate, showControls = true }: SalesChartProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Chart state
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [metricType, setMetricType] = useState<MetricType>('sales');
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      showToast(error.message || 'Failed to load sales data', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  // Initial load
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Real-time subscription
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel('sales-chart')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `organization_id=eq.${orgId}`
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setSales(prev => [payload.new, ...prev]);
        showToast('💰 New sale recorded!', 'success');
        if (onDataUpdate) onDataUpdate();
        break;
      case 'UPDATE':
        setSales(prev => 
          prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
        );
        break;
      case 'DELETE':
        setSales(prev => prev.filter(s => s.id !== payload.old.id));
        showToast('Sale deleted', 'info');
        if (onDataUpdate) onDataUpdate();
        break;
    }
    setLastUpdated(new Date());
  };

  // Get date range based on selection
  const getDateRange = useCallback(() => {
    const now = new Date();
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
        interval: 'day' as const,
        label: 'Custom Range'
      };
    }

    switch (timeRange) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
          start: today,
          end: now,
          interval: 'hour' as const,
          label: 'Today'
        };
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          interval: 'day' as const,
          label: 'This Week'
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          interval: 'day' as const,
          label: 'This Month'
        };
      case 'quarter':
        return {
          start: subDays(now, 90),
          end: now,
          interval: 'week' as const,
          label: 'Last 90 Days'
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          interval: 'month' as const,
          label: 'This Year'
        };
      default:
        return {
          start: subDays(now, 30),
          end: now,
          interval: 'day' as const,
          label: 'Last 30 Days'
        };
    }
  }, [timeRange, customStartDate, customEndDate]);

  const range = getDateRange();

  // Filter sales by date range and payment method
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const inDateRange = saleDate >= range.start && saleDate <= range.end;
      const matchesPayment = selectedPaymentMethod === 'all' || 
                            sale.payment_method === selectedPaymentMethod;
      return inDateRange && matchesPayment;
    });
  }, [sales, range, selectedPaymentMethod]);

  // Aggregate data based on interval
  const chartData = useMemo((): ChartDataPoint[] => {
    const dataMap = new Map<string, ChartDataPoint>();

    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at);
      let key: string;
      let displayDate: string;

      switch (range.interval) {
        case 'hour':
          key = format(date, 'yyyy-MM-dd-HH');
          displayDate = format(date, 'h a');
          break;
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          displayDate = format(date, 'MMM d');
          break;
        case 'week':
          const weekStart = startOfWeek(date);
          key = format(weekStart, 'yyyy-MM-dd');
          displayDate = `Week of ${format(weekStart, 'MMM d')}`;
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          displayDate = format(date, 'MMM yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
          displayDate = format(date, 'MMM d');
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: key,
          displayDate,
          timestamp: date.getTime(),
          total: 0,
          count: 0,
          cash: 0,
          card: 0,
          transfer: 0,
          mobile_money: 0,
          credit: 0,
          average: 0
        });
      }

      const data = dataMap.get(key)!;
      data.total += sale.amount;
      data.count += 1;

      // Track by payment method
      switch (sale.payment_method) {
        case 'cash':
          data.cash += sale.amount;
          break;
        case 'card':
          data.card += sale.amount;
          break;
        case 'transfer':
          data.transfer += sale.amount;
          break;
        case 'mobile_money':
          data.mobile_money += sale.amount;
          break;
        case 'credit':
          data.credit += sale.amount;
          break;
      }
    });

    // Calculate averages and convert to array
    const dataArray = Array.from(dataMap.values());
    dataArray.forEach(d => {
      d.average = d.count > 0 ? d.total / d.count : 0;
    });

    // Sort by date
    return dataArray.sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredSales, range]);

  // Prepare pie chart data
  const pieData = useMemo((): PieDataPoint[] => {
    const paymentMethods = new Map<string, { value: number; count: number }>();
    
    filteredSales.forEach(sale => {
      const method = sale.payment_method || 'other';
      const existing = paymentMethods.get(method) || { value: 0, count: 0 };
      paymentMethods.set(method, {
        value: existing.value + sale.amount,
        count: existing.count + 1
      });
    });

    const total = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    
    return Array.from(paymentMethods.entries()).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value: data.value,
      count: data.count,
      percentage: total > 0 ? (data.value / total) * 100 : 0
    }));
  }, [filteredSales]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    const avg = filteredSales.length > 0 ? total / filteredSales.length : 0;
    const maxDay = chartData.reduce((max, day) => day.total > max.total ? day : max, { total: 0 } as ChartDataPoint);
    const minDay = chartData.reduce((min, day) => day.total < min.total ? day : min, { total: Infinity } as ChartDataPoint);

    return {
      total,
      average: avg,
      maxDay: maxDay.total !== 0 ? maxDay : null,
      minDay: minDay.total !== Infinity ? minDay : null,
      count: filteredSales.length,
      paymentMethods: pieData
    };
  }, [filteredSales, chartData, pieData]);

  // Format Y axis ticks
  const formatYAxis = (value: any) => {
    if (typeof value !== 'number') return '₦0';
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value}`;
  };

  // Format pie chart tooltip
  const formatPieTooltip = (value: any, name: any, entry: any) => {
    if (typeof value !== 'number') return ['₦0', ''];
    const data = entry?.payload as PieDataPoint;
    return [
      `₦${value.toLocaleString()}${data?.percentage ? ` (${data.percentage.toFixed(1)}%)` : ''}`,
      data?.count ? `${data.count} transactions` : ''
    ];
  };

  // Export CSV
  const exportCSV = () => {
    const csv = [
      ['Date', 'Sales (₦)', 'Transactions', 'Average (₦)', 'Cash', 'Card', 'Transfer', 'Mobile Money', 'Credit'].join(','),
      ...chartData.map(day => 
        [
          day.displayDate,
          day.total,
          day.count,
          day.average.toFixed(2),
          day.cash,
          day.card,
          day.transfer,
          day.mobile_money,
          day.credit
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${range.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-6 transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto shadow-2xl' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Sales Analytics</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {isLive ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
          </div>
        </div>

        {showControls && (
          <div className="flex flex-wrap gap-2">
            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="px-2 py-1.5 text-sm border rounded-lg bg-white"
            >
              <option value="line">📈 Line Chart</option>
              <option value="bar">📊 Bar Chart</option>
              <option value="area">📉 Area Chart</option>
              <option value="pie">🥧 Pie Chart</option>
            </select>

            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-2 py-1.5 text-sm border rounded-lg bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Custom Date Range */}
            {timeRange === 'custom' && (
              <DateRangePicker
                startDate={customStartDate}
                endDate={customEndDate}
                onStartChange={setCustomStartDate}
                onEndChange={setCustomEndDate}
              />
            )}

            {/* Payment Method Filter */}
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-2 py-1.5 text-sm border rounded-lg bg-white"
            >
              <option value="all">💳 All Payments</option>
              <option value="cash">💰 Cash</option>
              <option value="card">💳 Card</option>
              <option value="transfer">🏦 Transfer</option>
              <option value="mobile_money">📱 Mobile Money</option>
              <option value="credit">📝 Credit</option>
            </select>

            {/* Metric Type Selector */}
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              className="px-2 py-1.5 text-sm border rounded-lg bg-white"
            >
              <option value="sales">💰 Sales Amount</option>
              <option value="count">📊 Transaction Count</option>
              <option value="average">📈 Average</option>
            </select>

            {/* Legend Toggle */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-2 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              title={showLegend ? 'Hide Legend' : 'Show Legend'}
            >
              {showLegend ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>

            {/* Export Button */}
            <button
              onClick={exportCSV}
              className="px-2 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              title="Export CSV"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchSales}
              className="px-2 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-2 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-blue-600">₦{metrics.total.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.count} transactions</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Average Sale</p>
          <p className="text-2xl font-bold text-green-600">₦{metrics.average.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Per transaction</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Best Day</p>
          <p className="text-2xl font-bold text-purple-600">
            {metrics.maxDay ? `₦${metrics.maxDay.total.toLocaleString()}` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{metrics.maxDay?.displayDate || 'No data'}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-orange-600">
            ₦{(metrics.total / (chartData.length || 1)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Over {chartData.length} days</p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {pieData.length > 0 && chartType !== 'pie' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {pieData.map((method, index) => (
            <div
              key={method.name}
              className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span>{method.name}:</span>
              <span className="font-medium">₦{method.value.toLocaleString()}</span>
              <span className="text-xs text-gray-500">({method.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-400px)]' : 'h-96'}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={isFullscreen ? 200 : 120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatPieTooltip} />
              {showLegend && <Legend />}
            </PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={metricType === 'sales' ? 'total' : metricType === 'count' ? 'count' : 'average'}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                name={metricType === 'sales' ? 'Sales' : metricType === 'count' ? 'Transactions' : 'Average'}
              />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar
                dataKey={metricType === 'sales' ? 'total' : metricType === 'count' ? 'count' : 'average'}
                fill="#3b82f6"
                name={metricType === 'sales' ? 'Sales' : metricType === 'count' ? 'Transactions' : 'Average'}
              />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey={metricType === 'sales' ? 'total' : metricType === 'count' ? 'count' : 'average'}
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTotal)"
                name={metricType === 'sales' ? 'Sales' : metricType === 'count' ? 'Transactions' : 'Average'}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Showing: {range.label}</span>
          <span>Period: {format(range.start, 'MMM d, yyyy')} - {format(range.end, 'MMM d, yyyy')}</span>
        </div>
        <button
          onClick={fetchSales}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Empty State */}
      {chartData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 font-medium">No sales data</p>
          <p className="text-sm text-gray-500 mt-2">
            {selectedPaymentMethod !== 'all' 
              ? 'Try changing the payment method filter'
              : timeRange === 'custom'
              ? 'No sales in this date range'
              : 'Add sales to see your analytics'}
          </p>
          {(selectedPaymentMethod !== 'all' || timeRange === 'custom') && (
            <button
              onClick={() => {
                setSelectedPaymentMethod('all');
                setTimeRange('month');
              }}
              className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}