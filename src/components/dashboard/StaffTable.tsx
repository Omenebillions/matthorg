// /home/user/matthorg/src/components/dashboard/tabs/staff/StaffTable.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface StaffTableProps {
  staff: any[];
  loading: boolean;
  onRoleChange: (id: string, role: string) => void;
  onPermissionsClick: (staff: any) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function StaffTable({ 
  staff, 
  loading, 
  onRoleChange, 
  onPermissionsClick,
  onStatusChange 
}: StaffTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.department?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roles = ['all', 'ceo', 'admin', 'manager', 'staff', 'viewer'];
  const statuses = ['all', 'active', 'on_leave', 'inactive'];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b bg-gray-50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {roles.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Staff Member</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Department</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Last Active</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-gray-500">ID: {member.id.slice(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm">{member.email}</p>
                  {member.phone && (
                    <p className="text-xs text-gray-500">{member.phone}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {member.department || '—'}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={member.role || 'staff'}
                    onChange={(e) => onRoleChange(member.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={member.status || 'active'}
                    onChange={(e) => onStatusChange(member.id, e.target.value)}
                    className={`text-sm border rounded px-2 py-1 ${
                      member.status === 'active' ? 'bg-green-50 text-green-700' :
                      member.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {member.last_active 
                    ? format(new Date(member.last_active), 'MMM d, h:mm a')
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onPermissionsClick(member)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No staff members found
        </div>
      )}
    </div>
  );
}