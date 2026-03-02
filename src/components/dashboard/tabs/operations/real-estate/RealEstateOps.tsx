'use client';

interface RealEstateOpsProps {
  orgId: string;
}

export default function RealEstateOps({ orgId }: RealEstateOpsProps) {
  return (
    <div className="bg-white rounded-xl p-8 text-center">
      <div className="text-6xl mb-4">🏠</div>
      <h3 className="text-xl font-semibold mb-2">Real Estate Operations</h3>
      <p className="text-gray-500">
        Real estate features coming soon! Your core dashboard is still fully functional.
      </p>
    </div>
  );
}
