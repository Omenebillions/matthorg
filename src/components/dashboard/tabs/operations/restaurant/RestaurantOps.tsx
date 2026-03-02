'use client';

interface RestaurantOpsProps {
  orgId: string;
}

export default function RestaurantOps({ orgId }: RestaurantOpsProps) {
  return (
    <div className="bg-white rounded-xl p-8 text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h3 className="text-xl font-semibold mb-2">Restaurant Operations</h3>
      <p className="text-gray-500">
        Restaurant features coming soon! Your core dashboard is still fully functional.
      </p>
    </div>
  );
}