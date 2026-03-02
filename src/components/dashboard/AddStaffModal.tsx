// /home/user/matthorg/src/components/dashboard/AddStaffModal.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess?: () => void;
  showNotif?: (type: 'success' | 'error', message: string) => void;
}

export default function AddStaffModal({ 
  isOpen, 
  onClose, 
  orgId, 
  onSuccess,
  showNotif 
}: AddStaffModalProps) {
  const [step, setStep] = useState<'form' | 'link'>('form');
  const [form, setForm] = useState({
    email: "",
    role: "staff",
    permissions: [] as string[],
  });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const allPermissions = [
    { id: 'sales:view', label: 'View Sales' },
    { id: 'sales:create', label: 'Create Sales' },
    { id: 'expenses:view', label: 'View Expenses' },
    { id: 'expenses:create', label: 'Create Expenses' },
    { id: 'inventory:view', label: 'View Inventory' },
    { id: 'inventory:manage', label: 'Manage Inventory' },
    { id: 'staff:view', label: 'View Staff' },
    { id: 'tasks:view', label: 'View Tasks' },
    { id: 'tasks:create', label: 'Create Tasks' },
    { id: 'reports:view', label: 'View Reports' },
  ];

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const generateInviteLink = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Generate unique token
      const token = crypto.randomUUID();
      
      // Save to database
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert({
          organization_id: orgId,
          email: form.email || null,
          token,
          role: form.role,
          permissions: form.permissions,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create invite link
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      setStep('link');
      
      if (showNotif) showNotif('success', 'Invitation created successfully!');
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('Invite error:', error);
      setError(error.message || 'Failed to create invitation');
      if (showNotif) showNotif('error', 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setStep('form');
    setForm({
      email: "",
      role: "staff",
      permissions: [],
    });
    setInviteLink("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          {children}
        </motion.div>
      </div>
    );
  };

  // Step 1: Invitation Form
  if (step === 'form') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="colleague@company.com"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to create a generic link anyone can use
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({...form, role: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer (Read Only)</option>
            </select>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              {allPermissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={generateInviteLink}
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
            >
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 2: Show Invite Link
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Created">
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🔗</div>
          <p className="font-medium">Share this link with your team member</p>
        </div>

        {/* Invite Link Display */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Done
          </button>
          <button
            onClick={() => setStep('form')}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
          >
            Create Another
          </button>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-500 text-center">
          Link expires in 7 days • Anyone with this link can join your organization
        </p>
      </div>
    </Modal>
  );
}