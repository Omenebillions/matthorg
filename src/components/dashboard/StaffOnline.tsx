'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/useToast';
import {
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role_id?: string;
  role_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  department?: string | null;
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  last_seen?: string | null;
  created_at: string;
}

interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  hours_worked?: number | null;
}

interface StaffOnlineProps {
  organizationId: string;
  limit?: number;
  showFilters?: boolean;
  onStaffClick?: (staffId: string) => void;
  refreshInterval?: number; // in milliseconds
}

interface OnlineStats {
  total: number;
  active: number;
  online: number;
  offline: number;
  present: number;
  late: number;
  leave: number;
}

// Loading skeleton
function StaffOnlineSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, isOnline }: { status: string; isOnline: boolean }) {
  const config = {
    active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon, label: 'Active' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ClockIcon, label: 'Pending' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircleIcon, label: 'Inactive' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon, label: 'Suspended' },
  };

  const cfg = config[status as keyof typeof config] || config.active;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.text}`}>
      {isOnline ? (
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {isOnline ? 'Online' : cfg.label}
    </span>
  );
}

// Staff Card Component
function StaffCard({ 
  staff, 
  attendance, 
  onClick,
  showDetails = false 
}: { 
  staff: StaffProfile; 
  attendance: Attendance[];
  onClick?: () => void;
  showDetails?: boolean;
}) {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.staff_id === staff.id && a.date === today);
  const isOnline = !!(todayAttendance?.check_in && !todayAttendance?.check_out);
  const isPresent = todayAttendance?.status === 'present' || todayAttendance?.status === 'late';
  const hoursWorked = todayAttendance?.hours_worked || 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:shadow-md transition-all cursor-pointer ${
        isOnline ? 'border-l-4 border-green-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative">
          {staff.avatar_url ? (
            <img
              src={staff.avatar_url}
              alt={staff.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(staff.full_name)}
            </div>
          )}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 truncate">
              {staff.full_name}
            </p>
            {staff.role_name && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {staff.role_name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
            {staff.department && (
              <span className="truncate">{staff.department}</span>
            )}
            {isPresent && hoursWorked > 0 && (
              <>
                <span>•</span>
                <span className="text-green-600">{hoursWorked}h today</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <StatusBadge status={staff.status} isOnline={isOnline} />
      </div>
    </motion.div>
  );
}

export default function StaffOnline({ 
  organizationId, 
  limit = 10,
  showFilters = true,
  onStaffClick,
  refreshInterval = 30000 // 30 seconds default
}: StaffOnlineProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch staff and attendance data
  const fetchData = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);

      // Fetch staff profiles
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('organization_id', organizationId)
        .order('full_name');

      if (staffError) throw staffError;

      // Transform staff data with role names
      const transformedStaff = staffData?.map(s => ({
        ...s,
        role_name: s.role?.name || 'Staff'
      })) || [];

      setStaff(transformedStaff);

      // Extract unique departments
      const uniqueDepts = [...new Set(transformedStaff.map(s => s.department).filter(Boolean))] as string[];
      setDepartments(uniqueDepts);

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      setAttendance(attendanceData || []);
      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('Error fetching staff data:', error);
      showToast(error.message || 'Failed to load staff data', 'error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, showToast]);

  // Initial load
  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const staffChannel = supabase
      .channel('staff-online')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_profiles', filter: `organization_id=eq.${organizationId}` },
        () => fetchData()
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-online')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `organization_id=eq.${organizationId}` },
        () => fetchData()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Refresh data periodically
    const interval = setInterval(fetchData, refreshInterval);

    return () => {
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(attendanceChannel);
      clearInterval(interval);
    };
  }, [organizationId, fetchData, refreshInterval]);

  // Calculate statistics
  const stats = useMemo((): OnlineStats => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const online = todayAttendance.filter(a => a.check_in && !a.check_out).length;
    const present = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = todayAttendance.filter(a => a.status === 'late').length;
    const leave = todayAttendance.filter(a => a.status === 'leave').length;
    const offline = total - present;

    return { total, active, online, offline, present, late, leave };
  }, [staff, attendance]);

  // Filter staff based on search and filters
  const filteredStaff = useMemo(() => {
    return staff
      .filter(member => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            member.full_name.toLowerCase().includes(term) ||
            member.email.toLowerCase().includes(term) ||
            member.department?.toLowerCase().includes(term) ||
            member.role_name?.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .filter(member => {
        if (departmentFilter === 'all') return true;
        return member.department === departmentFilter;
      })
      .filter(member => {
        if (statusFilter === 'all') return true;
        return member.status === statusFilter;
      })
      .slice(0, limit);
  }, [staff, searchTerm, departmentFilter, statusFilter, limit]);

  if (loading) {
    return <StaffOnlineSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-600" />
            Staff Online
          </h2>
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 hidden sm:inline">
                {isLive ? 'Live' : 'Connecting...'}
              </span>
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded transition"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-600">Online Now</p>
            <p className="text-lg font-bold text-green-600">{stats.online}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-600">Present</p>
            <p className="text-lg font-bold text-blue-600">{stats.present}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-600">Late</p>
            <p className="text-lg font-bold text-yellow-600">{stats.late}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-600">On Leave</p>
            <p className="text-lg font-bold text-purple-600">{stats.leave}</p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {/* Department Filter */}
              {departments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border rounded-lg flex-1 min-w-[120px]"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg flex-1 min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                attendance={attendance}
                onClick={() => onStaffClick?.(member.id)}
                showDetails={true}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No staff found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No staff members added yet'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>Total: {stats.total}</span>
          <span>•</span>
          <span>Active: {stats.active}</span>
          <span>•</span>
          <span>Online: {stats.online}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3 h-3" />
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* View All Link */}
      {staff.length > limit && (
        <div className="mt-3 text-center">
          <Link
            href="/dashboard/staff"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Staff ({staff.length}) →
          </Link>
        </div>
      )}
    </div>
  );
}