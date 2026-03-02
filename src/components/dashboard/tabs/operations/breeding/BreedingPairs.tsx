// /home/user/matthorg/src/components/dashboard/tabs/operations/breeding/BreedingPairs.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import Modal from './Modal';

interface BreedingPairsProps {
  orgId: string;
  limit?: number;
}

export default function BreedingPairs({ orgId, limit }: BreedingPairsProps) {
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [males, setMales] = useState<any[]>([]);
  const [females, setFemales] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchPairs();
    fetchDogs();
  }, [orgId]);

  const fetchPairs = async () => {
    let query = supabase
      .from('breeding_pairs')
      .select(`
        *,
        male:male_id (id, item_name),
        female:female_id (id, item_name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data } = await query;
    setPairs(data || []);
    setLoading(false);
  };

  const fetchDogs = async () => {
    const { data: malesData } = await supabase
      .from('inventory')
      .select('id, item_name')
      .eq('organization_id', orgId)
      .eq('category', 'dogs')
      .eq('gender', 'male');
    
    const { data: femalesData } = await supabase
      .from('inventory')
      .select('id, item_name')
      .eq('organization_id', orgId)
      .eq('category', 'dogs')
      .eq('gender', 'female');

    setMales(malesData || []);
    setFemales(femalesData || []);
  };

  const updatePairStatus = async (id: string, status: string) => {
    await supabase
      .from('breeding_pairs')
      .update({ status })
      .eq('id', id);
    fetchPairs();
  };

  const AddPairModal = () => {
    const [form, setForm] = useState({
      male_id: '',
      female_id: '',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      await supabase
        .from('breeding_pairs')
        .insert({
          organization_id: orgId,
          ...form,
          status: 'active'
        });

      setShowAddModal(false);
      fetchPairs();
    };

    return (
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Breeding Pair">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.male_id}
            onChange={(e) => setForm({...form, male_id: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select Male</option>
            {males.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.item_name}</option>
            ))}
          </select>

          <select
            value={form.female_id}
            onChange={(e) => setForm({...form, female_id: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select Female</option>
            {females.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.item_name}</option>
            ))}
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
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Add Pair
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
        <h3 className="font-semibold">Breeding Pairs</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
        >
          + Add Pair
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pairs.map(pair => (
          <div key={pair.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐕</span>
                <span className="font-medium">{pair.male?.item_name}</span>
              </div>
              <span className="text-xl">❤️</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{pair.female?.item_name}</span>
                <span className="text-2xl">🐕</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-2 border-t">
              <select
                value={pair.status}
                onChange={(e) => updatePairStatus(pair.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="active">Active</option>
                <option value="breeding">Breeding</option>
                <option value="resting">Resting</option>
                <option value="retired">Retired</option>
              </select>
              
              {pair.notes && (
                <p className="text-xs text-gray-500">{pair.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AddPairModal />
    </div>
  );
}