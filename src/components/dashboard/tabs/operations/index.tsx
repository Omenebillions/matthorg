// /home/user/matthorg/src/components/dashboard/tabs/operations/index.tsx
'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import BreedingDashboard from './breeding/BreedingDashboard';
import RestaurantOps from './restaurant/RestaurantOps';
import RealEstateOps from './real-estate/RealEstateOps';

interface OperationsTabProps {
  orgId: string;
  industry: string;
}

export default function OperationsTab({ orgId, industry }: OperationsTabProps) {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const supabase = createClient();

  // Fetch organization data if needed
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgId) return;
      
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      setOrgData(data);
      setLoading(false);
    };

    fetchOrgData();
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route to the correct industry component
  switch(industry?.toLowerCase()) {
    case 'dog breeding':
    case 'livestock / ranch':
    case 'poultry farming':
    case 'veterinary':
    case 'kennel / boarding':
      return <BreedingDashboard orgId={orgId} />;
      
    case 'restaurant':
    case 'cafe / coffee shop':
    case 'bar / nightclub':
    case 'catering':
    case 'bakery':
    case 'food truck':
      return <RestaurantOps orgId={orgId} />;
      
    case 'real estate agency':
    case 'property management':
    case 'rentals / leasing':
      return <RealEstateOps orgId={orgId} />;
      
    // Add more industries as we build them
      
    default:
      // Generic operations for industries not yet customized
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold mb-2">Coming Soon!</h3>
          <p className="text-gray-500">
            Industry-specific features for {industry} are under development.
            <br />
            You'll still have access to all core features in the meantime.
          </p>
        </div>
      );
  }
}