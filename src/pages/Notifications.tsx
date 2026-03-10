import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import {
  Bell, CheckCircle2, AlertCircle, Coins, Zap, GitBranch,
  CheckCheck, Trash2, Filter, Loader2, BellRing, BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  job_completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Job Completed" },
  job_failed: { icon: AlertCircle, color: "text-destructive", label: "Job Failed" },
  extraction_done: { icon: Zap, color: "text-primary", label: "Extraction" },
  credits_low: { icon: Coins, color: "text-amber-500", label: "Credits" },
  version_created: { icon: GitBranch, color: "text-muted-foreground", label: "Version" },
  info: { icon: Bell, color: "text-muted-foreground", label: "Info" },
};

type FilterType = "all" | "unread" | string;

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, clearAll, loading } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const typeFilters = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "job_completed", label: "Completed" },
    { key: "job_failed", label: "Failed" },
    { key: "credits_low", label: "Credits" },
    { key: "version_created", label: "Versions" },
  ];

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) markRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const { isSupported, isSubscribed, subscribe, unsubscribe, loading: pushLoading } = usePushSubscription();

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications disabled.");
    } else {
      const ok = await subscribe();
      if (ok) toast.success("Push notifications enabled!");
      else toast.error("Could not enable push notifications.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs gap-1.5 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Push notification toggle */}
      {isSupported && (
        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl border mb-4 transition-colors",
          isSubscribed ? "bg-primary/5 border-primary/20" : "bg-card border-border"
        )}>
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <BellRing className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs font-semibold">
                {isSubscribed ? "Push notifications active" : "Enable push notifications"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isSubscribed ? "You receive alerts even when you're not on the site." : "Get notified when a job completes or credits run low."}
              </p>
            </div>
          </div>
          <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleTogglePush}
            disabled={pushLoading}
          >
            {pushLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isSubscribed ? "Dezactivează" : "Activează"}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {typeFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Nicio notificare încă" : "Nicio notificare pentru acest filtru"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ro });

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors group",
                  !notif.read
                    ? "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className={cn("mt-0.5 p-1.5 rounded-lg bg-background border border-border shrink-0", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{notif.title}</p>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{config.label}</span>
                  </div>
                </div>
                {notif.link && (
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0">
                    Deschide →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
