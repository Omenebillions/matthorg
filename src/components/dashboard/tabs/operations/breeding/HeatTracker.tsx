// /home/user/matthorg/src/components/dashboard/tabs/operations/breeding/HeatTracker.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, addDays } from 'date-fns';
import Modal from './Modal';

interface HeatTrackerProps {
  orgId: string;
  limit?: number;
}

export default function HeatTracker({ orgId, limit }: HeatTrackerProps) {
  const [heatCycles, setHeatCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [females, setFemales] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchHeatCycles();
    fetchFemales();
  }, [orgId]);

  const fetchHeatCycles = async () => {
    let query = supabase
      .from('heat_cycles')
      .select(`
        *,
        dog:dog_id (id, item_name)
      `)
      .eq('organization_id', orgId)
      .order('start_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data } = await query;
    setHeatCycles(data || []);
    setLoading(false);
  };

  const fetchFemales = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('id, item_name')
      .eq('organization_id', orgId)
      .eq('category', 'dogs')
      .eq('gender', 'female');
    setFemales(data || []);
  };

  const updateHeatStatus = async (id: string, status: string) => {
    await supabase
      .from('heat_cycles')
      .update({ status })
      .eq('id', id);
    fetchHeatCycles();
  };

  const AddHeatModal = () => {
    const [form, setForm] = useState({
      dog_id: '',
      start_date: '',
      intensity: 'medium',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      await supabase
        .from('heat_cycles')
        .insert({
          organization_id: orgId,
          ...form,
          expected_end_date: addDays(new Date(form.start_date), 21),
          status: 'in_heat'
        });

      setShowAddModal(false);
      fetchHeatCycles();
    };

    return (
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Track Heat Cycle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.dog_id}
            onChange={(e) => setForm({...form, dog_id: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select Female</option>
            {females.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.item_name}</option>
            ))}
          </select>

          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({...form, start_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />

          <select
            value={form.intensity}
            onChange={(e) => setForm({...form, intensity: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />

          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Start Heat Cycle
          </button>
        </form>
      </Modal>
    );
  };

  if (loading) {
    return <div className="animate-pulse space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Heat Cycles</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
        >
          + Track Heat
        </button>
      </div>

      <div className="space-y-2">
        {heatCycles.map(cycle => (
          <div key={cycle.id} className="border rounded-lg p-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{cycle.dog?.item_name}</p>
                <p className="text-sm text-gray-600">
                  Started: {format(new Date(cycle.start_date), 'MMM d, yyyy')}
                </p>
                {cycle.expected_end_date && (
                  <p className="text-sm text-gray-600">
                    Ends: {format(new Date(cycle.expected_end_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <select
                value={cycle.status}
                onChange={(e) => updateHeatStatus(cycle.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="in_heat">In Heat</option>
                <option value="breeding">Breeding</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {cycle.notes && (
              <p className="text-sm text-gray-500 mt-2">{cycle.notes}</p>
            )}
          </div>
        ))}
      </div>

      <AddHeatModal />
    </div>
  );
}