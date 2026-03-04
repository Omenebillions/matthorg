// /home/user/matthorg/src/components/dashboard/tabs/staff/StaffTable.tsx
'use client';

import { useState, useMemo } from 'react';
import { format, formatDistance } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import RoleBadge from '@/components/dashboard/RoleBadge';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  role: string;
  role_id?: string;
  permissions?: string[];
  status: 'active' | 'on_leave' | 'inactive' | 'pending' | 'suspended';
  last_active?: string | null;
  last_seen?: string | null;
  created_at: string;
  avatar_url?: string | null;
  organization_id: string;
  notes?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  start_date?: string | null;
}

interface StaffTableProps {
  staff: StaffMember[];
  loading: boolean;
  onRoleChange: (id: string, role: string, roleId?: string) => Promise<void>;
  onPermissionsClick: (staff: StaffMember) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onRefresh?: () => void;
  onViewDetails?: (staff: StaffMember) => void;
  onContact?: (staff: StaffMember, type: 'email' | 'phone') => void;
}

type SortField = 'name' | 'role' | 'status' | 'last_active' | 'department' | 'created_at';
type SortOrder = 'asc' | 'desc';

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { bg: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircleIcon, label: 'Active' },
    on_leave: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: CalendarIcon, label: 'On Leave' },
    inactive: { bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircleIcon, label: 'Inactive' },
    pending: { bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: ClockIcon, label: 'Pending' },
    suspended: { bg: 'bg-red-100 text-red-700 border-red-200', icon: XCircleIcon, label: 'Suspended' },
  };

  const cfg = config[status as keyof typeof config] || config.active;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// Table Header Component with sorting
function TableHeader({ 
  field, 
  currentSort, 
  currentOrder, 
  onSort,
  children 
}: { 
  field: SortField; 
  currentSort: SortField; 
  currentOrder: SortOrder; 
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = currentSort === field;
  
  return (
    <th 
      className="px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 transition"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          currentOrder === 'asc' 
            ? <ChevronUpIcon className="w-4 h-4" />
            : <ChevronDownIcon className="w-4 h-4" />
        )}
      </div>
    </th>
  );
}

export default function StaffTable({ 
  staff, 
  loading, 
  onRoleChange,
  onPermissionsClick,
  onStatusChange,
  onRefresh,
  onViewDetails,
  onContact 
}: StaffTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Get unique departments and roles for filters
  const departments = useMemo(() => {
    const depts = staff.map(s => s.department).filter(Boolean) as string[];
    return ['all', ...new Set(depts)];
  }, [staff]);

  const roles = useMemo(() => {
    const roleNames = staff.map(s => s.role).filter(Boolean) as string[];
    return ['all', ...new Set(roleNames)];
  }, [staff]);

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    let filtered = staff.filter(member => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const email = member.email.toLowerCase();
      const department = member.department?.toLowerCase() || '';
      const position = member.position?.toLowerCase() || '';
      const searchTerm = search.toLowerCase();

      const matchesSearch = search === '' || 
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        department.includes(searchTerm) ||
        position.includes(searchTerm);

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'last_active':
          aValue = a.last_active ? new Date(a.last_active).getTime() : 0;
          bValue = b.last_active ? new Date(b.last_active).getTime() : 0;
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [staff, search, roleFilter, statusFilter, departmentFilter, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle role change
  const handleRoleChange = async (id: string, role: string) => {
    setChangingRole(id);
    await onRoleChange(id, role);
    setChangingRole(null);
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: string) => {
    setChangingStatus(id);
    await onStatusChange(id, status);
    setChangingStatus(null);
  };

  // Get initials for avatar
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header with Refresh */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-blue-600" />
          Staff Directory
          <span className="text-sm font-normal text-gray-500 ml-2">
            {filteredStaff.length} of {staff.length} members
          </span>
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
          >
            <option value="all">All Roles</option>
            {roles.filter(r => r !== 'all').map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Department Filter */}
          {departments.length > 1 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white min-w-[120px]"
            >
              <option value="all">All Depts</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader field="name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort}>
                Staff Member
              </TableHeader>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <TableHeader field="department" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort}>
                Department
              </TableHeader>
              <TableHeader field="role" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort}>
                Role
              </TableHeader>
              <TableHeader field="status" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort}>
                Status
              </TableHeader>
              <TableHeader field="last_active" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort}>
                Last Active
              </TableHeader>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredStaff.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => onViewDetails?.(member)}
                >
                  {/* Staff Member */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {getInitials(member.first_name, member.last_name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {member.id.slice(0, 8)} • Joined {format(new Date(member.created_at), 'MMM yyyy')}
                        </p>
                        {member.position && (
                          <p className="text-xs text-gray-500 mt-0.5">{member.position}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onContact?.(member, 'email');
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {member.email}
                        </button>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContact?.(member, 'phone');
                            }}
                            className="text-sm text-gray-600 hover:text-blue-600"
                          >
                            {member.phone}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4">
                    {member.department ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {member.department}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={changingRole === member.id}
                      className="border rounded px-2 py-1 text-sm bg-white hover:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="ceo">CEO</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <select
                      value={member.status}
                      onChange={(e) => handleStatusChange(member.id, e.target.value)}
                      disabled={changingStatus === member.id}
                      className={`text-sm border rounded px-2 py-1 ${
                        member.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        member.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        member.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        member.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>

                  {/* Last Active */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {member.last_active ? (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span title={format(new Date(member.last_active), 'PPpp')}>
                          {formatDistance(new Date(member.last_active), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermissionsClick(member);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      Permissions
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredStaff.length === 0 && (
        <div className="p-12 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No staff members found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first staff member to get started'}
          </p>
          {(search || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
              className="mt-4 px-4 py-2 text-sm text-blue-600 border rounded-lg hover:bg-blue-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      {filteredStaff.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
          <span>
            Showing {filteredStaff.length} of {staff.length} staff members
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              Last updated: {format(new Date(), 'h:mm a')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}