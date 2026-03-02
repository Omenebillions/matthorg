// /home/user/matthorg/src/components/dashboard/tabs/staff/StaffTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import StaffTable from '../../StaffTable';

interface StaffTabProps {
  orgId: string;
  currentUserId?: string;
}

export default function StaffTab({ orgId, currentUserId }: StaffTabProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch staff data
  useEffect(() => {
    fetchStaff();
  }, [orgId]);

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    setStaff(data || []);
    setLoading(false);
  };

  // Handlers
  const handleRoleChange = async (id: string, role: string) => {
    await supabase
      .from('staff_profiles')
      .update({ role })
      .eq('id', id);
    fetchStaff();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase
      .from('staff_profiles')
      .update({ status })
      .eq('id', id);
    fetchStaff();
  };

  const handlePermissionsClick = (staffMember: any) => {
    // You can open your permissions modal here
    console.log('Open permissions for:', staffMember);
  };

  return (
    <div className="space-y-6">
      <StaffTable 
        staff={staff}
        loading={loading}
        onRoleChange={handleRoleChange}
        onPermissionsClick={handlePermissionsClick}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}