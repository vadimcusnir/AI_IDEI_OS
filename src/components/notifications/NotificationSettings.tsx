import { useNotificationPreferences, NotificationPrefs } from "@/hooks/useNotificationPreferences";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, Mail, Clock, BellRing, Zap, Coins,
  MessageCircle, GitBranch, Loader2, Moon, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

export function NotificationSettings() {
  const { prefs, loading, saving, updatePrefs } = useNotificationPreferences();
  const { isSupported, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushSubscription();
  const { t } = useTranslation(["common", "errors"]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!isSupported) {
        toast.error(t("errors:push_not_supported"));
        return;
      }
      const success = await subscribe();
      if (success) {
        await updatePrefs({ push_enabled: true });
        toast.success(t("common:push_enabled"));
      } else {
        toast.error(t("errors:push_enable_failed"));
      }
    } else {
      await unsubscribe();
      await updatePrefs({ push_enabled: false });
      toast(t("common:push_disabled"));
    }
  };

  const pushActive = prefs.push_enabled && isSubscribed;

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BellRing className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("common:notification_settings.push_title")}</h3>
          {pushActive && (
            <Badge variant="outline" className="text-micro h-5 bg-primary/10 text-primary border-primary/30">
              {t("common:active")}
            </Badge>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
          {!isSupported && (
            <div className="flex items-center gap-2 text-micro text-destructive bg-destructive/10 rounded-lg p-2.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              <span>{t("errors:push_not_supported")}</span>
            </div>
          )}
          <ToggleRow
            icon={Bell}
            label={t("common:notification_settings.push_enable")}
            description={t("common:notification_settings.push_enable_desc")}
            checked={pushActive}
            onChange={handlePushToggle}
            disabled={pushLoading || !isSupported}
          />
          {pushActive && (
            <>
              <Separator />
              <ToggleRow
                icon={Zap}
                label={t("common:notification_settings.job_updates")}
                description={t("common:notification_settings.job_updates_desc")}
                checked={prefs.push_jobs}
                onChange={(v) => updatePrefs({ push_jobs: v })}
              />
              <ToggleRow
                icon={Coins}
                label={t("common:notification_settings.credit_alerts")}
                description={t("common:notification_settings.credit_alerts_desc")}
                checked={prefs.push_credits}
                onChange={(v) => updatePrefs({ push_credits: v })}
              />
              <ToggleRow
                icon={MessageCircle}
                label={t("common:notification_settings.feedback_responses")}
                description={t("common:notification_settings.feedback_responses_desc")}
                checked={prefs.push_feedback}
                onChange={(v) => updatePrefs({ push_feedback: v })}
              />
              <ToggleRow
                icon={GitBranch}
                label={t("common:notification_settings.version_updates")}
                description={t("common:notification_settings.version_updates_desc")}
                checked={prefs.push_versions}
                onChange={(v) => updatePrefs({ push_versions: v })}
              />
            </>
          )}
        </div>
      </section>

      {/* Email Digest */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("common:notification_settings.email_digest")}</h3>
        </div>
        <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">{t("common:notification_settings.digest_frequency")}</p>
              <p className="text-micro text-muted-foreground">{t("common:notification_settings.digest_frequency_desc")}</p>
            </div>
            <Select
              value={prefs.email_digest}
              onValueChange={(v) => updatePrefs({ email_digest: v as NotificationPrefs["email_digest"] })}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">{t("common:notification_settings.realtime")}</SelectItem>
                <SelectItem value="daily">{t("common:notification_settings.daily")}</SelectItem>
                <SelectItem value="weekly">{t("common:notification_settings.weekly")}</SelectItem>
                <SelectItem value="none">{t("common:notification_settings.off")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {prefs.email_digest !== "none" && (
            <>
              <Separator />
              <ToggleRow
                icon={Zap}
                label={t("common:notification_settings.job_notifications")}
                description={t("common:notification_settings.job_notifications_desc")}
                checked={prefs.email_jobs}
                onChange={(v) => updatePrefs({ email_jobs: v })}
              />
              <ToggleRow
                icon={Coins}
                label={t("common:notification_settings.credit_alerts_email")}
                description={t("common:notification_settings.credit_alerts_email_desc")}
                checked={prefs.email_credits}
                onChange={(v) => updatePrefs({ email_credits: v })}
              />
              <ToggleRow
                icon={MessageCircle}
                label={t("common:notification_settings.feedback_updates")}
                description={t("common:notification_settings.feedback_updates_desc")}
                checked={prefs.email_feedback}
                onChange={(v) => updatePrefs({ email_feedback: v })}
              />
            </>
          )}
        </div>
      </section>

      {/* Quiet Hours */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("common:notification_settings.quiet_hours")}</h3>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card">
          <p className="text-micro text-muted-foreground mb-3">
            {t("common:notification_settings.quiet_hours_desc")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-micro text-muted-foreground mb-1 block">{t("common:notification_settings.from")}</Label>
              <Select
                value={prefs.quiet_hours_start?.toString() ?? "none"}
                onValueChange={(v) => updatePrefs({ quiet_hours_start: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t("common:notification_settings.off")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common:notification_settings.off")}</SelectItem>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value.toString()}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-micro text-muted-foreground mb-1 block">{t("common:notification_settings.to")}</Label>
              <Select
                value={prefs.quiet_hours_end?.toString() ?? "none"}
                onValueChange={(v) => updatePrefs({ quiet_hours_end: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t("common:notification_settings.off")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common:notification_settings.off")}</SelectItem>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value.toString()}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {saving && (
        <p className="text-micro text-muted-foreground text-center animate-pulse">{t("common:saving")}</p>
      )}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between", disabled && "opacity-50")}>
      <div className="flex items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-micro text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}