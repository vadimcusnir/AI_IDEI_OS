import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-2 w-20" />
          </div>
        ))}
      </div>
      {/* Pipeline */}
      <Skeleton className="h-28 w-full rounded-xl" />
      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="sm:col-span-2 h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
