// /home/user/matthorg/src/components/dashboard/tabs/operations/breeding/HealthRecords.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, addDays } from 'date-fns';
import Modal from './Modal';

interface HealthRecordsProps {
  orgId: string;
  limit?: number;
}

export default function HealthRecords({ orgId, limit }: HealthRecordsProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dogs, setDogs] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchRecords();
    fetchDogs();
  }, [orgId]);

  const fetchRecords = async () => {
    let query = supabase
      .from('health_records')
      .select(`
        *,
        dog:dog_id (id, item_name)
      `)
      .eq('organization_id', orgId)
      .order('due_date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data } = await query;
    setRecords(data || []);
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

  const updateRecordStatus = async (id: string, status: string) => {
    await supabase
      .from('health_records')
      .update({ status })
      .eq('id', id);
    fetchRecords();
  };

  const AddHealthModal = () => {
    const [form, setForm] = useState({
      dog_id: '',
      record_type: 'vaccination',
      due_date: '',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      await supabase
        .from('health_records')
        .insert({
          organization_id: orgId,
          ...form,
          status: 'due'
        });

      setShowAddModal(false);
      fetchRecords();
    };

    return (
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Health Record">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.dog_id}
            onChange={(e) => setForm({...form, dog_id: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select Dog</option>
            {dogs.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.item_name}</option>
            ))}
          </select>

          <select
            value={form.record_type}
            onChange={(e) => setForm({...form, record_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="vaccination">Vaccination</option>
            <option value="deworming">Deworming</option>
            <option value="checkup">Checkup</option>
            <option value="injury">Injury</option>
            <option value="surgery">Surgery</option>
          </select>

          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({...form, due_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
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
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Record
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
        <h3 className="font-semibold">Health Records</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
        >
          + Add Record
        </button>
      </div>

      <div className="space-y-2">
        {records.map(record => (
          <div key={record.id} className="border rounded-lg p-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{record.dog?.item_name}</p>
                <p className="text-sm text-gray-600">
                  {record.record_type} • Due: {format(new Date(record.due_date), 'MMM d, yyyy')}
                </p>
              </div>
              <select
                value={record.status}
                onChange={(e) => updateRecordStatus(record.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="due">Due</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {record.notes && (
              <p className="text-sm text-gray-500 mt-2">{record.notes}</p>
            )}
          </div>
        ))}
      </div>

      <AddHealthModal />
    </div>
  );
}