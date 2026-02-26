// /home/user/matthorg/src/components/dashboard/StaffTable.tsx
"use client";

interface StaffTableProps {
  staff: any[];
  orgId?: string; // Added to fix TS2322
  onRoleChange?: (staffId: string, newRole: string) => void;
  onPermissionsClick?: (staff: any) => void;
}

export default function StaffTable({ 
  staff, 
  orgId, // Destructured prop
  onRoleChange, 
  onPermissionsClick 
}: StaffTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {staff.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4">{member.full_name}</td>
              <td className="px-6 py-4">{member.email}</td>
              <td className="px-6 py-4">
                <select
                  value={member.role}
                  onChange={(e) => onRoleChange?.(member.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="ceo">CEO</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onPermissionsClick?.(member)}
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
  );
}