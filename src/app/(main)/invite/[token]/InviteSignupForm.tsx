// /home/user/matthorg/src/app/(main)/invite/[token]/InviteSignupForm.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface InviteSignupFormProps {
  invite: {
    id: string;
    organization_id: string;
    email: string | null;
    role: string;
    permissions: string[];
    organizations: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  };
}

export default function InviteSignupForm({ invite }: InviteSignupFormProps) {
  const [form, setForm] = useState({
    full_name: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Determine email (from invite or prompt user)
      const email = invite.email || prompt("Please enter your email address:");
      if (!email) throw new Error("Email is required");

      // Create auth user
      const { data: auth, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
          }
        }
      });

      if (authError) throw authError;

      // Create staff profile
      const { error: staffError } = await supabase
        .from('staff_profiles')
        .insert({
          id: auth.user?.id,
          full_name: form.full_name,
          email,
          role: invite.role,
          permissions: invite.permissions,
          organization_id: invite.organization_id,
        });

      if (staffError) throw staffError;

      // Mark invitation as used
      await supabase
        .from('staff_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invite.id);

      // Redirect to login
      router.push('/login?message=Account created! Please log in.');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8"
      >
        {/* Organization header */}
        <div className="text-center mb-6">
          {invite.organizations.logo_url && (
            <img 
              src={invite.organizations.logo_url} 
              alt={invite.organizations.name}
              className="w-16 h-16 mx-auto mb-3 rounded-full object-cover"
            />
          )}
          <h1 className="text-2xl font-bold">Join {invite.organizations.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            You've been invited as {invite.role}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({...form, full_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          {invite.email && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Account will be created for: <strong>{invite.email}</strong>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
          >
            {loading ? 'Creating Account...' : 'Accept Invitation & Join'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}