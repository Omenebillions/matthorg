"use client";

export interface SalesChartProps {
  orgId: string;
}

const SalesChart = ({ orgId }: SalesChartProps) => {
  return (
    <div className="p-4 bg-white rounded shadow mt-6">
      <h3 className="text-lg font-semibold mb-2">Sales Chart</h3>
      <p className="text-sm text-gray-500">Org: {orgId}</p>
      {/* Chart code will come here later */}
    </div>
  );
};

export default SalesChart;