// /home/user/matthorg/src/components/dashboard/tabs/sales/SalesTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import SalesOverview from './SalesOverview';
import SalesTable from './SalesTable';
import Invoices from './Invoices';
import Customers from './Customers';
import SalesChart from '../../SalesChart'; // Import your existing SalesChart

interface SalesTabProps {
  orgId: string;
  initialSales?: any[];
  totalSales?: number;
}

export default function SalesTab({ orgId, initialSales = [], totalSales = 0 }: SalesTabProps) {
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState(!initialSales.length);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    total: totalSales,
    today: 0,
    week: 0,
    month: 0,
    averageOrder: 0,
    topProduct: '',
    customerCount: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [orgId, dateRange]);

  const fetchSales = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*, product:product_id (item_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    setSales(data || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [todayData, weekData, monthData, customers] = await Promise.all([
      supabase.from('sales').select('amount').eq('organization_id', orgId).gte('created_at', today),
      supabase.from('sales').select('amount').eq('organization_id', orgId).gte('created_at', weekAgo),
      supabase.from('sales').select('amount').eq('organization_id', orgId).gte('created_at', monthAgo),
      supabase.from('sales').select('customer_name').eq('organization_id', orgId).not('customer_name', 'is', null),
    ]);

    const todaySum = todayData.data?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const weekSum = weekData.data?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const monthSum = monthData.data?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const avgOrder = sales.length > 0 ? stats.total / sales.length : 0;
    const customerCount = new Set(customers.data?.map(c => c.customer_name)).size;

    setStats(prev => ({
      ...prev,
      today: todaySum,
      week: weekSum,
      month: monthSum,
      averageOrder: avgOrder,
      customerCount,
    }));
  };

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📝' },
    { id: 'invoices', label: 'Invoices', icon: '🧾' },
    { id: 'customers', label: 'Customers', icon: '👤' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with date filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Analysis</h2>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-lg text-sm ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <SalesOverview stats={stats} />

      {/* Charts Section - Using your existing SalesChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <SalesChart orgId={orgId} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-lg font-semibold mb-4">Sales by Product</h3>
          {/* You can add another chart here later */}
          <p className="text-gray-500 text-center py-8">Coming soon...</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b flex gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg whitespace-nowrap transition ${
              activeSubTab === tab.id
                ? 'bg-blue-100 text-blue-700 font-medium border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Already showing charts above, so maybe show top products here */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                <p className="text-gray-500 text-center py-8">Coming soon...</p>
              </div>
            </div>
          )}

          {activeSubTab === 'transactions' && (
            <SalesTable sales={sales} loading={loading} orgId={orgId} />
          )}

          {activeSubTab === 'invoices' && (
            <Invoices orgId={orgId} />
          )}

          {activeSubTab === 'customers' && (
            <Customers orgId={orgId} />
          )}

          {activeSubTab === 'reports' && (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-gray-500">Sales reports coming soon...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}