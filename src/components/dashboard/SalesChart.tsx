// /src/components/dashboard/SalesChart.tsx
"use client";

import { useEffect, useState } from 'react';
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
  TooltipProps
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface SalesChartProps {
  orgId: string;
}

interface Sale {
  id: string;
  amount: number;
  customer_name?: string;
  payment_method?: string;
  created_at: string;
  organization_id: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  total: number;
  count: number;
  cash: number;
  card: number;
  transfer: number;
  mobile_money: number;
}

interface PieDataPoint {
  name: string;
  value: number;
}

interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
  payload?: {
    count?: number;
  };
}

type ChartType = 'line' | 'bar' | 'area' | 'pie';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';
type MetricType = 'sales' | 'count' | 'average';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesChart({ orgId }: SalesChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [metricType, setMetricType] = useState<MetricType>('sales');
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  // Live sales data
  const { data: sales = [], isLive } = useRealtime<Sale>(
    { table: 'sales', filter: `organization_id=eq.${orgId}` },
    []
  );

  // Process data based on time range
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          format: 'EEE',
          interval: 'day' as const
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          format: 'MMM d',
          interval: 'day' as const
        };
      case 'quarter':
        return {
          start: subDays(now, 90),
          end: now,
          format: 'MMM',
          interval: 'week' as const
        };
      case 'year':
        return {
          start: subDays(now, 365),
          end: now,
          format: 'MMM',
          interval: 'month' as const
        };
    }
  };

  const range = getDateRange();

  // Filter sales by date range and payment method
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const inDateRange = saleDate >= range.start && saleDate <= range.end;
    const matchesPayment = selectedPaymentMethod === 'all' || 
                          sale.payment_method === selectedPaymentMethod;
    return inDateRange && matchesPayment;
  });

  // Aggregate data based on interval
  const getChartData = (): ChartDataPoint[] => {
    const data: { [key: string]: ChartDataPoint } = {};

    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at);
      let key: string;

      switch (range.interval) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          key = `Week of ${format(date, 'MMM d')}`;
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!data[key]) {
        data[key] = {
          date: key,
          displayDate: range.interval === 'day' 
            ? format(date, range.format)
            : key,
          total: 0,
          count: 0,
          cash: 0,
          card: 0,
          transfer: 0,
          mobile_money: 0
        };
      }

      data[key].total += sale.amount;
      data[key].count += 1;

      // Track by payment method
      switch (sale.payment_method) {
        case 'cash':
          data[key].cash += sale.amount;
          break;
        case 'card':
          data[key].card += sale.amount;
          break;
        case 'transfer':
          data[key].transfer += sale.amount;
          break;
        case 'mobile_money':
          data[key].mobile_money += sale.amount;
          break;
      }
    });

    // Convert to array and sort by date
    return Object.values(data).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Prepare pie chart data
  const getPieData = (): PieDataPoint[] => {
    const paymentMethods: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      const method = sale.payment_method || 'other';
      paymentMethods[method] = (paymentMethods[method] || 0) + sale.amount;
    });

    return Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const chartData = getChartData();
  const pieData = getPieData();

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageSale = filteredSales.length > 0 
    ? totalSales / filteredSales.length 
    : 0;
  const bestDay = chartData.length > 0
    ? chartData.reduce((max, day) => day.total > max.total ? day : max, chartData[0])
    : null;

  // Custom tooltip - fixed type issues
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₦{entry.value?.toLocaleString() || 0}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            {payload[0]?.payload?.count || 0} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y axis ticks - fixed type issue
  const formatYAxis = (value: any) => {
    if (typeof value !== 'number') return `₦0`;
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value}`;
  };

  // Format pie chart tooltip
  const formatPieTooltip = (value: any) => {
    if (typeof value !== 'number') return `₦0`;
    return `₦${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-6 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Sales Analytics</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isLive ? `${filteredSales.length} transactions` : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="px-2 py-1 text-sm border rounded-lg"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Pie Chart</option>
          </select>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-2 py-1 text-sm border rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-2 py-1 text-sm border rounded-lg"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-50"
          >
            {isFullscreen ? 'Exit Fullscreen' : '⛶'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Total Sales</p>
          <p className="text-xl font-bold text-blue-600">₦{totalSales.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{filteredSales.length} transactions</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Average Sale</p>
          <p className="text-xl font-bold text-green-600">₦{averageSale.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Per transaction</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Best Day</p>
          <p className="text-xl font-bold text-purple-600">
            {bestDay ? `₦${bestDay.total.toLocaleString()}` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">{bestDay?.displayDate || 'No data'}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Daily Average</p>
          <p className="text-xl font-bold text-orange-600">
            ₦{(totalSales / (chartData.length || 1)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Over {chartData.length} days</p>
        </div>
      </div>

      {/* Chart */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-80'}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
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
          ) : (
            <>
              {chartType === 'line' && (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                    name="Sales"
                  />
                  {selectedPaymentMethod === 'all' && (
                    <>
                      <Line type="monotone" dataKey="cash" stroke="#10b981" name="Cash" />
                      <Line type="monotone" dataKey="card" stroke="#f59e0b" name="Card" />
                      <Line type="monotone" dataKey="transfer" stroke="#8b5cf6" name="Transfer" />
                    </>
                  )}
                </LineChart>
              )}

              {chartType === 'bar' && (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Bar dataKey="total" fill="#3b82f6" name="Sales" />
                  {selectedPaymentMethod === 'all' && (
                    <>
                      <Bar dataKey="cash" fill="#10b981" name="Cash" />
                      <Bar dataKey="card" fill="#f59e0b" name="Card" />
                      <Bar dataKey="transfer" fill="#8b5cf6" name="Transfer" />
                    </>
                  )}
                </BarChart>
              )}

              {chartType === 'area' && (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  {showLegend && <Legend />}
                  <Area
                    type="monotone"
                    dataKey="total"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f680"
                    name="Sales"
                  />
                  {selectedPaymentMethod === 'all' && (
                    <>
                      <Area type="monotone" dataKey="cash" stackId="1" stroke="#10b981" fill="#10b98180" name="Cash" />
                      <Area type="monotone" dataKey="card" stackId="1" stroke="#f59e0b" fill="#f59e0b80" name="Card" />
                      <Area type="monotone" dataKey="transfer" stackId="1" stroke="#8b5cf6" fill="#8b5cf680" name="Transfer" />
                    </>
                  )}
                </AreaChart>
              )}
            </>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend Toggle and Export Options */}
      <div className="flex justify-between items-center mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">Show Legend</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = [
                ['Date', 'Sales', 'Transactions', 'Cash', 'Card', 'Transfer'].join(','),
                ...chartData.map(day => 
                  [day.displayDate, day.total, day.count, day.cash, day.card, day.transfer].join(',')
                )
              ].join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sales-${timeRange}-${Date.now()}.csv`;
              a.click();
            }}
            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Empty State */}
      {chartData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-5xl mb-3">📊</p>
          <p className="text-gray-600 font-medium">No sales data</p>
          <p className="text-sm text-gray-500 mt-1">
            Add sales to see your analytics
          </p>
        </div>
      )}
    </motion.div>
  );
}