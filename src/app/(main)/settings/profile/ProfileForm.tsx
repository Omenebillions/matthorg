// /home/user/matthorg/src/app/(main)/settings/profile/ProfileForm.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  profile: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from('staff_profiles')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile?.id);

    if (error) {
      setMessage("Error updating profile");
    } else {
      setMessage("Profile updated successfully!");
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => setForm({...form, first_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => setForm({...form, last_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}