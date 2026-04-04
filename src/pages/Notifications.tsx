import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  Bell, CheckCircle2, AlertCircle, Coins, Zap, GitBranch,
  CheckCheck, Trash2, Filter, Loader2, BellRing, BellOff,
  Settings, MessageSquarePlus, MessageCircle, Trophy, ShoppingBag,
  Newspaper, Star, Users, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  job_completed: { icon: CheckCircle2, color: "text-primary", label: "Job Completed" },
  job_failed: { icon: AlertCircle, color: "text-destructive", label: "Job Failed" },
  extraction_done: { icon: Zap, color: "text-primary", label: "Extraction" },
  credits_low: { icon: Coins, color: "text-accent-foreground", label: "Credits" },
  version_created: { icon: GitBranch, color: "text-muted-foreground", label: "Version" },
  feedback_new: { icon: MessageSquarePlus, color: "text-primary", label: "Feedback" },
  feedback_response: { icon: MessageCircle, color: "text-primary", label: "Response" },
  forum_reply: { icon: MessageCircle, color: "text-primary", label: "Forum Reply" },
  forum_mention: { icon: Users, color: "text-primary", label: "Mention" },
  changelog: { icon: Newspaper, color: "text-primary", label: "Changelog" },
  level_up: { icon: Trophy, color: "text-accent-foreground", label: "Level Up" },
  vip_milestone: { icon: Star, color: "text-accent-foreground", label: "VIP" },
  artifact_created: { icon: CheckCircle2, color: "text-primary", label: "Artifact" },
  marketplace_sale: { icon: ShoppingBag, color: "text-primary", label: "Sale" },
  info: { icon: Bell, color: "text-muted-foreground", label: "Info" },
};

type FilterType = "all" | "unread" | string;

function groupByDay(notifications: AppNotification[]) {
  const groups: { label: string; notifications: AppNotification[] }[] = [];
  const map = new Map<string, AppNotification[]>();

  for (const n of notifications) {
    const date = new Date(n.created_at);
    let key: string;
    if (isToday(date)) key = "Today";
    else if (isYesterday(date)) key = "Yesterday";
    else if (isThisWeek(date)) key = format(date, "EEEE");
    else key = format(date, "MMM d, yyyy");

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }

  for (const [label, notifs] of map) {
    groups.push({ label, notifications: notifs });
  }

  return groups;
}

function SwipeableNotifRow({
  notif,
  index,
  onClick,
  onDismiss,
  openLabel,
}: {
  notif: AppNotification;
  index: number;
  onClick: () => void;
  onDismiss: (id: string) => void;
  openLabel: string;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, -80, 0], [0, 0.5, 1]);
  const bg = useTransform(x, [-150, 0], ["hsl(var(--destructive) / 0.15)", "transparent"]);
  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDismiss(notif.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25, ease: "easeOut" }}
      layout
    >
      <motion.button
        style={{ x, opacity, backgroundColor: bg as any }}
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors group touch-pan-y",
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
            <span className="text-micro text-muted-foreground/60">{timeAgo}</span>
            <span className="text-micro px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{config.label}</span>
          </div>
        </div>
        {notif.link && (
          <span className="text-micro text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0">
            {openLabel} →
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}

export default function Notifications() {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, clearAll, loading } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const filtered = notifications
    .filter((n) => !dismissed.has(n.id))
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "unread") return !n.read;
      return n.type === filter;
    });

  const groups = groupByDay(filtered);

  const typeFilters = [
    { key: "all", label: t("notifications.title") === "Notifications" ? "All" : t("jobs.filter_all") },
    { key: "unread", label: t("notifications.unread_count", { count: unreadCount }) },
    { key: "job_completed", label: t("notifications.completed") },
    { key: "job_failed", label: t("notifications.failed") },
    { key: "credits_low", label: t("notifications.credits") },
    { key: "forum_reply", label: "Forum" },
    { key: "level_up", label: "XP" },
  ];

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) markRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    markRead(id);
    toast(t("notifications_extra.dismissed"), {
      action: {
        label: t("notifications_extra.undo"),
        onClick: () => setDismissed((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      },
    });
  }, [markRead, t]);

  const { isSupported, isSubscribed, subscribe, unsubscribe, loading: pushLoading } = usePushSubscription();

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success(t("notifications.push_disabled_toast"));
    } else {
      const ok = await subscribe();
      if (ok) toast.success(t("notifications.push_enabled_toast"));
      else toast.error(t("notifications.push_enable_failed"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
      <SEOHead title={`${t("notifications.title")} — AI-IDEI`} description={t("notifications.description")} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 sm:mb-6"
      >
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t("notifications.title")}
        </h1>
      </motion.div>

      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="inbox" className="text-xs gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            {t("notifications_extra.inbox")} {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            {t("notifications_extra.settings")}
          </TabsTrigger>
        </TabsList>

        {/* ═══ INBOX TAB ═══ */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Push toggle */}
          {isSupported && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                isSubscribed ? "bg-primary/5 border-primary/20" : "bg-card border-border"
              )}
            >
              <div className="flex items-center gap-3">
                {isSubscribed ? (
                  <BellRing className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-semibold">
                    {isSubscribed ? t("notifications.push_active") : t("notifications.push_enable")}
                  </p>
                  <p className="text-micro text-muted-foreground">
                    {isSubscribed ? t("notifications.push_active_desc") : t("notifications.push_enable_desc")}
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
                {isSubscribed ? t("notifications_extra.disable") : t("notifications_extra.enable")}
              </Button>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} ${t("notifications_extra.unread")}` : `${t("notifications_extra.all_caught_up")} ✓`}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} className="text-dense sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3">
                  <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t("notifications_extra.mark_all_read")}
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-dense sm:text-xs gap-1 sm:gap-1.5 text-muted-foreground h-7 sm:h-8 px-2 sm:px-3">
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t("notifications_extra.clear")}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-dense font-medium transition-colors whitespace-nowrap",
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {filter === "all" ? t("notifications.no_notifications") : t("notifications.no_filter_results")}
              </p>
              <p className="text-dense text-muted-foreground/60 mt-1">
                {filter === "all"
                  ? t("notifications_extra.empty_hint")
                  : t("notifications_extra.filter_hint")}
              </p>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="mt-3 text-xs"
                >
                  {t("notifications_extra.show_all")}
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence mode="popLayout">
                {groups.map((group) => (
                  <motion.div
                    key={group.label}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-micro font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-micro text-muted-foreground/40">
                        {group.notifications.length}
                      </span>
                    </div>

                    {/* Notifications in this group */}
                    <div className="space-y-1">
                      <AnimatePresence mode="popLayout">
                        {group.notifications.map((notif, i) => (
                          <SwipeableNotifRow
                            key={notif.id}
                            notif={notif}
                            index={i}
                            onClick={() => handleClick(notif)}
                            onDismiss={handleDismiss}
                            openLabel={t("notifications_extra.open")}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Swipe hint for mobile */}
              {filtered.length > 0 && (
                <p className="text-center text-micro text-muted-foreground/40 md:hidden">
                  ← {t("notifications_extra.swipe_hint")}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ SETTINGS TAB ═══ */}
        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
