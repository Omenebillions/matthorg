// /home/user/matthorg/src/components/dashboard/tabs/operations/breeding/BreedingDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LittersTable from './LittersTable';
import HeatTracker from './HeatTracker';
import HealthRecords from './HealthRecords';
import BreedingPairs from './BreedingPairs';

interface BreedingDashboardProps {
  orgId: string;
}

export default function BreedingDashboard({ orgId }: BreedingDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [stats, setStats] = useState({
    totalDogs: 0,
    inHeat: 0,
    upcomingLitters: 0,
    healthDue: 0,
    availablePuppies: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadBreedingStats();
  }, [orgId]);

  const loadBreedingStats = async () => {
    setLoading(true);
    
    try {
      // Get total dogs count (from inventory where category is 'dogs')
      const { count: dogs, error: dogsError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('category', 'dogs');

      if (dogsError) console.error('Error fetching dogs:', dogsError);

      // Get females in heat from heat_cycles table
      const { count: heat, error: heatError } = await supabase
        .from('heat_cycles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'in_heat');

      if (heatError) console.error('Error fetching heat cycles:', heatError);

      // Get upcoming litters
      const { count: litters, error: littersError } = await supabase
        .from('litters')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('due_date', new Date().toISOString().split('T')[0]);

      if (littersError) console.error('Error fetching litters:', littersError);

      // Get health due (vaccinations, checkups)
      const { count: health, error: healthError } = await supabase
        .from('health_records')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'due');

      if (healthError) console.error('Error fetching health records:', healthError);

      // Get available puppies
      const { count: puppies, error: puppiesError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('category', 'puppies')
        .eq('status', 'available');

      if (puppiesError) console.error('Error fetching puppies:', puppiesError);

      setStats({
        totalDogs: dogs || 0,
        inHeat: heat || 0,
        upcomingLitters: litters || 0,
        healthDue: health || 0,
        availablePuppies: puppies || 0,
      });
      
    } catch (error) {
      console.error('Error loading breeding stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'litters', label: 'Litters', icon: '🐾' },
    { id: 'heat', label: 'Heat Cycles', icon: '🔥' },
    { id: 'health', label: 'Health', icon: '💉' },
    { id: 'breeding', label: 'Breeding Pairs', icon: '🐕‍🦺' },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs for breeding */}
      <div className="border-b flex gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeSubTab === tab.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards (visible in all tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard 
          label="Total Dogs" 
          value={stats.totalDogs} 
          icon="🐕" 
          color="bg-blue-50 border-blue-200" 
          loading={loading}
        />
        <StatCard 
          label="In Heat" 
          value={stats.inHeat} 
          icon="🔥" 
          color="bg-red-50 border-red-200" 
          loading={loading}
        />
        <StatCard 
          label="Upcoming Litters" 
          value={stats.upcomingLitters} 
          icon="🐾" 
          color="bg-green-50 border-green-200" 
          loading={loading}
        />
        <StatCard 
          label="Health Due" 
          value={stats.healthDue} 
          icon="💉" 
          color="bg-yellow-50 border-yellow-200" 
          loading={loading}
        />
        <StatCard 
          label="Available Puppies" 
          value={stats.availablePuppies} 
          icon="🐶" 
          color="bg-purple-50 border-purple-200" 
          loading={loading}
        />
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Litters */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Litters</h3>
              <button 
                onClick={() => setActiveSubTab('litters')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            <LittersTable orgId={orgId} limit={3} />
          </div>

          {/* Health Reminders */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Health Reminders</h3>
              <button 
                onClick={() => setActiveSubTab('health')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            <HealthRecords orgId={orgId} limit={3} />
          </div>

          {/* Heat Cycles */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Current Heat Cycles</h3>
              <button 
                onClick={() => setActiveSubTab('heat')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            <HeatTracker orgId={orgId} limit={3} />
          </div>

          {/* Breeding Pairs */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Active Breeding Pairs</h3>
              <button 
                onClick={() => setActiveSubTab('breeding')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            <BreedingPairs orgId={orgId} limit={3} />
          </div>
        </div>
      )}

      {activeSubTab === 'litters' && <LittersTable orgId={orgId} />}
      {activeSubTab === 'heat' && <HeatTracker orgId={orgId} />}
      {activeSubTab === 'health' && <HealthRecords orgId={orgId} />}
      {activeSubTab === 'breeding' && <BreedingPairs orgId={orgId} />}
    </div>
  );
}

// Stat Card Component
const StatCard = ({ label, value, icon, color, loading }: any) => (
  <div className={`${color} p-4 rounded-xl border`}>
    {loading ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </>
    )}
  </div>
);