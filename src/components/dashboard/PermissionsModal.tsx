// /src/components/dashboard/PermissionsModal.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  currentPermissions: string[];
  onSave: (permissions: string[]) => void;
}

const availablePermissions = [
  { key: "sales:view", label: "View Sales" },
  { key: "sales:create", label: "Create Sales" },
  { key: "expenses:view", label: "View Expenses" },
  { key: "expenses:create", label: "Create Expenses" },
  { key: "inventory:view", label: "View Inventory" },
  { key: "inventory:manage", label: "Manage Inventory" },
  { key: "staff:view", label: "View Staff" },
  { key: "staff:manage", label: "Manage Staff" },
  { key: "tasks:view", label: "View Tasks" },
  { key: "tasks:create", label: "Create Tasks" },
  { key: "tasks:assign", label: "Assign Tasks" },
  { key: "reports:view", label: "View Reports" },
];

export default function PermissionsModal({ 
  isOpen, 
  onClose, 
  staffName, 
  currentPermissions, 
  onSave 
}: PermissionsModalProps) {
  const [selected, setSelected] = useState<string[]>(currentPermissions);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-2">Permissions for {staffName}</h2>
        <p className="text-sm text-gray-500 mb-4">Grant or restrict access to features</p>

        <div className="grid grid-cols-2 gap-4">
          {availablePermissions.map((perm) => (
            <label key={perm.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selected.includes(perm.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected([...selected, perm.key]);
                  } else {
                    setSelected(selected.filter(p => p !== perm.key));
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{perm.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Permissions
          </button>
        </div>
      </motion.div>
    </div>
  );
}