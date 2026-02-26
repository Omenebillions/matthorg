// /src/components/dashboard/RoleBadge.tsx
"use client";

interface RoleBadgeProps {
  role: string;
}

const roleColors = {
  ceo: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  staff: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const colorClass = roleColors[role as keyof typeof roleColors] || roleColors.staff;
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${colorClass}`}>
      {role.toUpperCase()}
    </span>
  );
}