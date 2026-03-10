import { useState } from "react";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { Bell, X, CheckCircle2, AlertCircle, Coins, Zap, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTIF_ICONS: Record<string, React.ElementType> = {
  job_completed: CheckCircle2,
  job_failed: AlertCircle,
  extraction_done: Zap,
  credits_low: Coins,
  version_created: GitBranch,
};

const NOTIF_COLORS: Record<string, string> = {
  job_completed: "text-status-validated",
  job_failed: "text-destructive",
  extraction_done: "text-primary",
  credits_low: "text-ai-accent",
  version_created: "text-muted-foreground",
};

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs font-semibold">Notifications</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[9px] text-primary hover:underline">Mark all read</button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[9px] text-muted-foreground hover:text-foreground ml-2">Clear</button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Bell className="h-5 w-5 opacity-20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const Icon = NOTIF_ICONS[notif.type] || Bell;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                        !notif.read && "bg-primary/5"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", NOTIF_COLORS[notif.type])} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                        <p className="text-[8px] text-muted-foreground/60 mt-0.5">
                          {notif.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
