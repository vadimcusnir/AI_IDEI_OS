import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { Bell, CheckCircle2, AlertCircle, Coins, Zap, GitBranch, MessageCircle, MessageSquarePlus, Trophy, Newspaper, Star, Users, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const NOTIF_ICONS: Record<string, React.ElementType> = {
  job_completed: CheckCircle2,
  job_failed: AlertCircle,
  extraction_done: Zap,
  credits_low: Coins,
  version_created: GitBranch,
  feedback_new: MessageSquarePlus,
  feedback_response: MessageCircle,
  forum_reply: MessageCircle,
  forum_mention: Users,
  changelog: Newspaper,
  level_up: Trophy,
  vip_milestone: Star,
  artifact_created: CheckCircle2,
  marketplace_sale: ShoppingBag,
};

const NOTIF_COLORS: Record<string, string> = {
  job_completed: "text-success",
  job_failed: "text-destructive",
  extraction_done: "text-primary",
  credits_low: "text-warning",
  version_created: "text-muted-foreground",
  feedback_new: "text-primary",
  feedback_response: "text-success",
  forum_reply: "text-primary",
  forum_mention: "text-primary",
  changelog: "text-primary",
  level_up: "text-semantic-amber",
  vip_milestone: "text-tier-vip",
  artifact_created: "text-success",
  marketplace_sale: "text-success",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 5);

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) markRead(notif.id);
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors relative"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-2 left-2 sm:left-auto sm:absolute sm:right-0 top-[var(--header-height,48px)] sm:top-10 z-50 sm:w-80 sm:max-w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs font-semibold">{t("notifications")}</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                    {t("mark_all_read")}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {recent.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-5 w-5 opacity-20 mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground">{t("no_notifications")}</p>
                </div>
              ) : (
                recent.map((notif) => {
                  const Icon = NOTIF_ICONS[notif.type] || Bell;
                   const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                     addSuffix: true,
                   });
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                        !notif.read && "bg-primary/5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 mt-0.5 shrink-0",
                          NOTIF_COLORS[notif.type] || "text-muted-foreground"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">{timeAgo}</p>
                      </div>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="w-full px-4 py-2 text-center text-[11px] text-primary font-medium hover:bg-muted/50 transition-colors border-t border-border"
              >
                {t("view_all_notifications")} →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
