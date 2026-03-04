// /src/app/dashboard/inventory/movements/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import InventoryMovements from '@/components/InventoryMovements';

export default async function MovementsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get organization ID from user metadata
  const organizationId = user.app_metadata?.organization_id;
  if (!organizationId) redirect('/dashboard');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Movements</h1>
        <p className="text-gray-500">Track all stock changes and adjustments</p>
      </div>
      
      <InventoryMovements 
        organizationId={organizationId}
        limit={100}
        showFilters={true}
      />
    </div>
  );
}
