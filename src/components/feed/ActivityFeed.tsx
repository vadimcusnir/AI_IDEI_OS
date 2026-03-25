import { useActivityFeed, type ActivityItem } from "@/hooks/useActivityFeed";
import { formatDistanceToNow } from "date-fns";
import { Brain, FileText, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const ICON_MAP: Record<string, React.ElementType> = {
  neuron_created: Brain,
  artifact_created: FileText,
  job_completed: Zap,
};

function FeedItem({ item }: { item: ActivityItem }) {
  const Icon = ICON_MAP[item.event_type] || Zap;
  return (
    <div className="flex gap-3 py-2 px-1">
      <div className="mt-0.5 rounded-full bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  workspaceId?: string;
  limit?: number;
  className?: string;
}

/**
 * P3-008: Activity Feed component
 * Renders a timeline of workspace activities.
 */
export function ActivityFeed({ workspaceId, limit = 20, className }: ActivityFeedProps) {
  const { data: feed, isLoading } = useActivityFeed(workspaceId, limit);

  if (isLoading) {
    return (
      <div className={cn("flex justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className={cn("text-center py-8 text-sm text-muted-foreground", className)}>
        No recent activity
      </div>
    );
  }

  return (
    <ScrollArea className={cn("max-h-[400px]", className)}>
      <div className="divide-y divide-border">
        {feed.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </div>
    </ScrollArea>
  );
}
