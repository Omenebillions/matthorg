// components/dashboard/ParseQuota.tsx
interface ParseQuotaProps {
  remaining: number;
  limit: number;
}

export default function ParseQuota({ remaining, limit }: ParseQuotaProps) {
  const percentUsed = ((limit - remaining) / limit) * 100
  
  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Smart Parse Quota</span>
        <span className="text-xs text-gray-500">
          {remaining} / {limit} remaining
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            percentUsed > 80 ? 'bg-orange-500' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      {remaining < 10 && (
        <p className="text-xs text-orange-600 mt-2">
          ⚠️ Low on parses. <button className="underline">Upgrade to get more →</button>
        </p>
      )}
    </div>
  )
}