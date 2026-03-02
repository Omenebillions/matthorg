// /home/user/matthorg/src/components/dashboard/tabs/operations/breeding/LittersTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Modal from './Modal';

interface LittersTableProps {
  orgId: string;
  limit?: number;
}

export default function LittersTable({ orgId, limit }: LittersTableProps) {
  const [litters, setLitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dogs, setDogs] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchLitters();
    fetchDogs();
  }, [orgId]);

  const fetchLitters = async () => {
    let query = supabase
      .from('litters')
      .select(`
        *,
        dam:dam_id (id, item_name),
        sire:sire_id (id, item_name)
      `)
      .eq('organization_id', orgId)
      .order('due_date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data } = await query;
    setLitters(data || []);
    setLoading(false);
  };

  const fetchDogs = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('id, item_name')
      .eq('organization_id', orgId)
      .eq('category', 'dogs');
    setDogs(data || []);
  };

  const updateLitterStatus = async (id: string, status: string) => {
    await supabase
      .from('litters')
      .update({ status })
      .eq('id', id);
    fetchLitters();
  };

  const AddLitterModal = () => {
    const [form, setForm] = useState({
      dam_id: '',
      sire_id: '',
      litter_name: '',
      due_date: '',
      puppy_count: '',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      await supabase
        .from('litters')
        .insert({
          organization_id: orgId,
          ...form,
          puppy_count: parseInt(form.puppy_count) || 0,
          status: 'upcoming'
        });

      setShowAddModal(false);
      fetchLitters();
    };

    return (
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Litter">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dam (Mother)</label>
            <select
              value={form.dam_id}
              onChange={(e) => setForm({...form, dam_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select Dam</option>
              {dogs.map(dog => (
                <option key={dog.id} value={dog.id}>{dog.item_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sire (Father)</label>
            <select
              value={form.sire_id}
              onChange={(e) => setForm({...form, sire_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select Sire</option>
              {dogs.map(dog => (
                <option key={dog.id} value={dog.id}>{dog.item_name}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Litter Name (optional)"
            value={form.litter_name}
            onChange={(e) => setForm({...form, litter_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <input
            type="date"
            placeholder="Due Date"
            value={form.due_date}
            onChange={(e) => setForm({...form, due_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />

          <input
            type="number"
            placeholder="Expected Puppy Count"
            value={form.puppy_count}
            onChange={(e) => setForm({...form, puppy_count: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Litter
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
        <h3 className="font-semibold">Litters</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
        >
          + New Litter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Dam</th>
              <th className="px-4 py-2 text-left">Sire</th>
              <th className="px-4 py-2 text-left">Due Date</th>
              <th className="px-4 py-2 text-left">Puppies</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {litters.map(litter => (
              <tr key={litter.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{litter.litter_name || 'Unnamed'}</td>
                <td className="px-4 py-2">{litter.dam?.item_name}</td>
                <td className="px-4 py-2">{litter.sire?.item_name}</td>
                <td className="px-4 py-2">
                  {litter.due_date ? format(new Date(litter.due_date), 'MMM d, yyyy') : 'TBD'}
                </td>
                <td className="px-4 py-2">{litter.puppy_count || 0}</td>
                <td className="px-4 py-2">
                  <select
                    value={litter.status}
                    onChange={(e) => updateLitterStatus(litter.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="weaned">Weaned</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:underline text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddLitterModal />
    </div>
  );
}