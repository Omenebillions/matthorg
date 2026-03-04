// /home/user/matthorg/src/hooks/useOrganization.ts
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  industry: string | null;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseOrganizationReturn {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Get staff profile with organization
      const { data: staff, error: staffError } = await supabase
        .from('staff_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (staffError) throw staffError;
      if (!staff) throw new Error('Staff profile not found');

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', staff.organization_id)
        .single();

      if (orgError) throw orgError;
      if (!org) throw new Error('Organization not found');

      setOrganization(org);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  return {
    organization,
    isLoading,
    error,
    refresh: fetchOrganization,
  };
}
