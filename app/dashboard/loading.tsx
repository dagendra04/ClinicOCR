export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-32 mb-2" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-9 w-32" />
          <div className="skeleton h-9 w-44" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-4 w-28 mb-3" />
            <div className="skeleton h-9 w-16" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-12 h-14 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-24 mb-2" />
                <div className="flex gap-1">
                  <div className="skeleton h-4 w-16 rounded-full" />
                  <div className="skeleton h-4 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-4 w-28 mb-1" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
