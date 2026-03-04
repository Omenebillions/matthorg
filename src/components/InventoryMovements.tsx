// /src/components/InventoryMovements.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import {
  ArrowPathIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ShoppingCartIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface InventoryMovement {
  id: string;
  product_id: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
  movement_type: 'sale' | 'purchase' | 'return' | 'adjustment' | 'damage' | 'correction';
  reference_id?: string;
  reason?: string;
  created_by: string;
  created_at: string;
  product?: {
    id: string;
    item_name: string;
    sku?: string;
  };
  staff?: {
    full_name: string;
    email: string;
  };
  sale?: {
    id: string;
    customer_name?: string;
    amount: number;
  };
}

interface InventoryMovementsProps {
  productId?: string;
  organizationId: string;
  limit?: number;
  showFilters?: boolean;
}

// Movement type configuration
const movementConfig = {
  sale: { 
    label: 'Sale', 
    icon: ShoppingCartIcon, 
    color: 'bg-red-100 text-red-700 border-red-200',
    bg: 'bg-red-50',
    textColor: 'text-red-600'
  },
  purchase: { 
    label: 'Purchase', 
    icon: TruckIcon, 
    color: 'bg-green-100 text-green-700 border-green-200',
    bg: 'bg-green-50',
    textColor: 'text-green-600'
  },
  return: { 
    label: 'Return', 
    icon: ArrowUturnLeftIcon, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  adjustment: { 
    label: 'Adjustment', 
    icon: WrenchScrewdriverIcon, 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    bg: 'bg-yellow-50',
    textColor: 'text-yellow-600'
  },
  damage: { 
    label: 'Damage', 
    icon: ExclamationTriangleIcon, 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    bg: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  correction: { 
    label: 'Manual Correction', 
    icon: ArrowPathIcon, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
};

// Loading skeleton
function MovementsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-20 bg-gray-100 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

// Movement Card Component
function MovementCard({ movement }: { movement: InventoryMovement }) {
  const config = movementConfig[movement.movement_type] || movementConfig.adjustment;
  const Icon = config.icon;
  const change = movement.quantity_change;
  const isPositive = change > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 ${config.bg} hover:shadow-md transition`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left side - Icon and Type */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold ${config.textColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(movement.created_at).toLocaleString()}
              </span>
            </div>
            {movement.product && (
              <Link 
                href={`/dashboard/inventory/${movement.product.id}`}
                className="text-sm hover:text-blue-600 transition"
              >
                {movement.product.item_name}
                {movement.product.sku && <span className="text-gray-400 ml-1">({movement.product.sku})</span>}
              </Link>
            )}
          </div>
        </div>

        {/* Right side - Quantity Change */}
        <div className="flex items-center gap-4 ml-11 sm:ml-0">
          <div className="text-right">
            <div className="text-sm text-gray-500">Quantity</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 line-through text-sm">
                {movement.previous_quantity}
              </span>
              <span className="text-gray-500">→</span>
              <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {movement.new_quantity}
              </span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? '+' : ''}{change}
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="mt-3 ml-11 flex flex-wrap gap-4 text-xs text-gray-500">
        {/* Reference */}
        {movement.reference_id && movement.movement_type === 'sale' && (
          <Link 
            href={`/dashboard/sales/${movement.reference_id}`}
            className="hover:text-blue-600 flex items-center gap-1"
          >
            <ShoppingCartIcon className="w-3 h-3" />
            View Sale #{movement.reference_id.slice(0,8)}
          </Link>
        )}
        
        {/* Staff */}
        {movement.staff && (
          <span className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            By: {movement.staff.full_name}
          </span>
        )}
        
        {/* Reason */}
        {movement.reason && (
          <span className="flex items-center gap-1">
            <DocumentTextIcon className="w-3 h-3" />
            {movement.reason}
          </span>
        )}
      </div>

      {/* Sale Amount (if applicable) */}
      {movement.sale && (
        <div className="mt-2 ml-11 text-sm">
          <span className="text-gray-600">Amount: </span>
          <span className="font-medium">₦{movement.sale.amount.toLocaleString()}</span>
          {movement.sale.customer_name && (
            <span className="text-gray-500 ml-2">- {movement.sale.customer_name}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function InventoryMovements({ 
  productId, 
  organizationId,
  limit = 50,
  showFilters = true 
}: InventoryMovementsProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    sales: 0,
    purchases: 0,
    adjustments: 0,
    netChange: 0
  });

  // Fetch movements
  useEffect(() => {
    fetchMovements();
  }, [productId, organizationId, movementType, dateRange, limit]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          product:inventory (
            id,
            item_name,
            sku
          ),
          staff:created_by (
            full_name,
            email
          ),
          sale:sales!reference_id (
            id,
            customer_name,
            amount
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by organization (through product)
      if (organizationId) {
        query = query.eq('product.organization_id', organizationId);
      }

      // Filter by product
      if (productId) {
        query = query.eq('product_id', productId);
      }

      // Filter by movement type
      if (movementType !== 'all') {
        query = query.eq('movement_type', movementType);
      }

      // Filter by date range
      const now = new Date();
      if (dateRange === 'today') {
        const today = now.toISOString().split('T')[0];
        query = query.gte('created_at', `${today}T00:00:00Z`);
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('created_at', weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        query = query.gte('created_at', monthAgo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovements(data || []);
      calculateStats(data || []);
      
    } catch (error: any) {
      console.error('Error fetching movements:', error);
      showToast(error.message || 'Failed to load movements', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data: InventoryMovement[]) => {
    const stats = {
      total: data.length,
      sales: data.filter(m => m.movement_type === 'sale').length,
      purchases: data.filter(m => m.movement_type === 'purchase').length,
      adjustments: data.filter(m => ['adjustment', 'correction', 'damage'].includes(m.movement_type)).length,
      netChange: data.reduce((sum, m) => sum + (m.quantity_change || 0), 0)
    };
    setStats(stats);
  };

  // Filter by search term
  const filteredMovements = movements.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.product?.item_name.toLowerCase().includes(term) ||
      m.product?.sku?.toLowerCase().includes(term) ||
      m.movement_type.toLowerCase().includes(term) ||
      m.reason?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <MovementsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-lg font-bold">Inventory Movement History</h2>
          <button
            onClick={fetchMovements}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          <div className="bg-gray-50 p-2 rounded text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <p className="text-xs text-red-600">Sales</p>
            <p className="text-lg font-bold text-red-700">{stats.sales}</p>
          </div>
          <div className="bg-green-50 p-2 rounded text-center">
            <p className="text-xs text-green-600">Purchases</p>
            <p className="text-lg font-bold text-green-700">{stats.purchases}</p>
          </div>
          <div className="bg-yellow-50 p-2 rounded text-center">
            <p className="text-xs text-yellow-600">Adjustments</p>
            <p className="text-lg font-bold text-yellow-700">{stats.adjustments}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded text-center">
            <p className="text-xs text-blue-600">Net Change</p>
            <p className={`text-lg font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.netChange > 0 ? '+' : ''}{stats.netChange}
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Movement Type Filter */}
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[140px]"
            >
              <option value="all">All Movements</option>
              <option value="sale">Sales</option>
              <option value="purchase">Purchases</option>
              <option value="return">Returns</option>
              <option value="adjustment">Adjustments</option>
              <option value="damage">Damage</option>
              <option value="correction">Corrections</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}
      </div>

      {/* Movements List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredMovements.length > 0 ? (
            filteredMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-lg border"
            >
              <ArrowPathIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No movements found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || movementType !== 'all' ? 'Try adjusting your filters' : 'No inventory changes recorded yet'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {filteredMovements.length > 0 && (
        <div className="text-xs text-gray-400 flex justify-between items-center">
          <span>Showing {filteredMovements.length} of {movements.length} movements</span>
          <button
            onClick={fetchMovements}
            className="text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
