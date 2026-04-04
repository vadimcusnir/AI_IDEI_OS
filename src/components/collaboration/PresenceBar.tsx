import { useWorkspacePresence } from "@/hooks/useWorkspacePresence";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PresenceBarProps {
  workspaceId?: string;
  className?: string;
}

/**
 * P3-006: Presence indicator bar showing online workspace members.
 */
export function PresenceBar({ workspaceId, className }: PresenceBarProps) {
  const { onlineUsers } = useWorkspacePresence(workspaceId);

  if (onlineUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((u) => (
            <Tooltip key={u.userId}>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-micro bg-primary/20 text-primary">
                    {(u.email || u.userId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>{u.email || u.userId}</p>
                {u.page && (
                  <p className="text-muted-foreground">on {u.page}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {onlineUsers.length > 5 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{onlineUsers.length - 5}
          </span>
        )}
        <div className="h-2 w-2 rounded-full bg-success animate-pulse ml-1" />
      </div>
    </TooltipProvider>
  );
}
