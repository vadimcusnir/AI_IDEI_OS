import { useNotificationPreferences, NotificationPrefs } from "@/hooks/useNotificationPreferences";
import { usePushSubscription } from "@/hooks/usePushSubscription";
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
        toast.error("Browser-ul tău nu suportă push notifications");
        return;
      }
      const success = await subscribe();
      if (success) {
        await updatePrefs({ push_enabled: true });
        toast.success("Push notifications activate!");
      } else {
        toast.error("Nu am putut activa push notifications. Verifică permisiunile browser-ului.");
      }
    } else {
      await unsubscribe();
      await updatePrefs({ push_enabled: false });
      toast("Push notifications dezactivate");
    }
  };

  const pushActive = prefs.push_enabled && isSubscribed;

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BellRing className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Push Notifications</h3>
          {pushActive && (
            <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-600 border-green-500/30">
              Active
            </Badge>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
          {!isSupported && (
            <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-500/10 rounded-lg p-2.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Browser-ul tău nu suportă push notifications</span>
            </div>
          )}
          <ToggleRow
            icon={Bell}
            label="Enable push notifications"
            description="Receive browser alerts even when you're away"
            checked={pushActive}
            onChange={handlePushToggle}
            disabled={pushLoading || !isSupported}
          />
          {pushActive && (
            <>
              <Separator />
              <ToggleRow
                icon={Zap}
                label="Job updates"
                description="When jobs complete or fail"
                checked={prefs.push_jobs}
                onChange={(v) => updatePrefs({ push_jobs: v })}
              />
              <ToggleRow
                icon={Coins}
                label="Credit alerts"
                description="Low balance warnings"
                checked={prefs.push_credits}
                onChange={(v) => updatePrefs({ push_credits: v })}
              />
              <ToggleRow
                icon={MessageCircle}
                label="Feedback responses"
                description="When admins reply to your feedback"
                checked={prefs.push_feedback}
                onChange={(v) => updatePrefs({ push_feedback: v })}
              />
              <ToggleRow
                icon={GitBranch}
                label="Version updates"
                description="When new neuron versions are saved"
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
          <h3 className="text-sm font-semibold">Email Digest</h3>
        </div>
        <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Digest frequency</p>
              <p className="text-[10px] text-muted-foreground">How often to receive email summaries</p>
            </div>
            <Select
              value={prefs.email_digest}
              onValueChange={(v) => updatePrefs({ email_digest: v as NotificationPrefs["email_digest"] })}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="none">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {prefs.email_digest !== "none" && (
            <>
              <Separator />
              <ToggleRow
                icon={Zap}
                label="Job notifications"
                description="Include job status in digest"
                checked={prefs.email_jobs}
                onChange={(v) => updatePrefs({ email_jobs: v })}
              />
              <ToggleRow
                icon={Coins}
                label="Credit alerts"
                description="Include credit warnings in digest"
                checked={prefs.email_credits}
                onChange={(v) => updatePrefs({ email_credits: v })}
              />
              <ToggleRow
                icon={MessageCircle}
                label="Feedback updates"
                description="Include feedback activity in digest"
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
          <h3 className="text-sm font-semibold">Quiet Hours</h3>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card">
          <p className="text-[10px] text-muted-foreground mb-3">
            Suppress push notifications during these hours (UTC)
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">From</Label>
              <Select
                value={prefs.quiet_hours_start?.toString() ?? "none"}
                onValueChange={(v) => updatePrefs({ quiet_hours_start: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Off" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Off</SelectItem>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value.toString()}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">To</Label>
              <Select
                value={prefs.quiet_hours_end?.toString() ?? "none"}
                onValueChange={(v) => updatePrefs({ quiet_hours_end: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Off" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Off</SelectItem>
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
        <p className="text-[10px] text-muted-foreground text-center animate-pulse">Saving…</p>
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
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
