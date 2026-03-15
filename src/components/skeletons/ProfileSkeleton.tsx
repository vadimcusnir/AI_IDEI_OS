import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        {/* Avatar card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className={i === 2 ? "h-24 w-full rounded-lg" : "h-10 w-full rounded-lg"} />
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Skeleton className="h-4 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <Skeleton className="h-3 w-24 mb-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
