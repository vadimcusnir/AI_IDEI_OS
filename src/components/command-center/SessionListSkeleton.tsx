/**
 * SessionListSkeleton — Placeholder while sessions are loading.
 * Mirrors SessionList layout for zero CLS.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SessionListSkeletonProps {
  rows?: number;
  className?: string;
}

export function SessionListSkeleton({ rows = 3, className }: SessionListSkeletonProps) {
  return (
    <div className={cn("space-y-1", className)} aria-hidden="true">
      <div className="flex items-center justify-between px-2 py-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-2 px-2 py-1.5">
          <Skeleton className="h-3 w-3 rounded-sm mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full max-w-[240px]" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
