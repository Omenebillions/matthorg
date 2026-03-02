// /home/user/matthorg/src/components/dashboard/tabs/sales/SalesOverview.tsx
'use client';

interface SalesOverviewProps {
  stats: {
    total: number;
    today: number;
    week: number;
    month: number;
    averageOrder: number;
    topProduct: string;
    customerCount: number;
  };
}

export default function SalesOverview({ stats }: SalesOverviewProps) {
  const cards = [
    { label: 'Total Revenue', value: `₦${stats.total.toLocaleString()}`, icon: '💰', color: 'bg-green-50 border-green-200' },
    { label: "Today's Sales", value: `₦${stats.today.toLocaleString()}`, icon: '📊', color: 'bg-blue-50 border-blue-200' },
    { label: 'This Week', value: `₦${stats.week.toLocaleString()}`, icon: '📅', color: 'bg-purple-50 border-purple-200' },
    { label: 'This Month', value: `₦${stats.month.toLocaleString()}`, icon: '📆', color: 'bg-orange-50 border-orange-200' },
    { label: 'Avg Order', value: `₦${stats.averageOrder.toLocaleString()}`, icon: '📉', color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Customers', value: stats.customerCount, icon: '👥', color: 'bg-indigo-50 border-indigo-200' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`${card.color} p-4 rounded-xl border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}