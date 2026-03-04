// /home/user/matthorg/src/components/dashboard/DashboardSkeleton.tsx
export function DashboardSkeleton() {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Welcome Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                <div>
                  <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-48"></div>
                </div>
              </div>
              <div className="w-32 h-10 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
  
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
  
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
  
        {/* Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-3"></div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded mb-3"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }