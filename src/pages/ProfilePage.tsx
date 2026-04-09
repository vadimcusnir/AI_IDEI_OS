import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserTier } from "@/hooks/useUserTier";
import { useSubscription } from "@/hooks/useSubscription";
import {
  User, Save, CheckCircle2,
  Bell, BellRing, Mail, Clock,
  Briefcase, Coins, MessageCircle, GitBranch, Star, ExternalLink, Crown, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AchievementsBadges } from "@/components/profile/AchievementsBadges";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { ControlledSection } from "@/components/ControlledSection";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion/PageTransition";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
  username: string | null;
}

export default function ProfilePage() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { tier } = useUserTier();
  const { subscriptionEnd, manageSubscription } = useSubscription();
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    bio: "",
    avatar_url: "",
    username: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { prefs, loading: prefsLoading, updatePrefs } = useNotificationPreferences();
  const { requestPermission, permissionStatus } = useNotifications();

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, bio, avatar_url, username")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setProfile({
        display_name: data.display_name || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
        username: data.username || null,
      });
    } else if (!error) {
      await supabase.from("profiles").insert({
        user_id: user!.id,
        display_name: user!.user_metadata?.full_name || "",
      } as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        username: profile.username || null,
      })
      .eq("user_id", user.id);

    if (error) {
      if (error.message.includes("unique")) {
        toast.error(t("errors:username_taken"));
      } else {
        toast.error(t("errors:save_failed", { message: error.message }));
      }
    } else {
      setSaved(true);
      toast.success(t("profile.profile_updated"));
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleEnablePush = async () => {
    const permission = await requestPermission();
    if (permission === "granted") {
      await updatePrefs({ push_enabled: true });
      toast.success(t("profile.push_enabled"));
    } else {
      toast.error(t("errors:notification_denied"));
    }
  };

  const avatarInitial = profile.display_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() || "?";

  if (authLoading || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Profile — AI-IDEI" description="Manage your AI-IDEI profile, notification preferences and settings." />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">{t("profile.title")}</h1>
                {(tier === "pro" || tier === "vip") && (
                  <Badge variant="outline" className="text-nano px-1.5 py-0 gap-0.5 border-[hsl(var(--gold-oxide)/0.3)] text-[hsl(var(--gold-oxide))]">
                    <Crown className="h-2.5 w-2.5" />
                    {tier === "vip" ? "VIP" : "PRO"}
                  </Badge>
                )}
              </div>
              <p className="text-micro text-muted-foreground mt-0.5">
                {(tier === "pro" || tier === "vip") && subscriptionEnd
                  ? `${tier.toUpperCase()} until ${new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : "Manage your identity and preferences"}
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className={cn(
                "gap-1.5 text-xs transition-all",
                saved && "bg-success text-success-foreground"
              )}
            >
              {saving ? (
                <Save className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>

          <StaggerContainer className="space-y-4">
            {/* Avatar section */}
            <StaggerItem>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-border shadow-sm"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-[hsl(var(--gold-oxide)/0.08)] border-2 border-border flex items-center justify-center shadow-sm">
                        <span className="text-2xl font-bold text-[hsl(var(--gold-oxide))]">{avatarInitial}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Avatar</p>
                    <p className="text-micro text-muted-foreground mb-3">
                      Enter a URL for your profile image.
                    </p>
                    <input
                      type="url"
                      value={profile.avatar_url}
                      onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                      placeholder={t("common:profile.avatar_url_placeholder")}
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus-ring transition-colors"
                    />
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Profile fields */}
            <StaggerItem>
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common:profile.display_name")}</label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder={t("common:profile.display_name_placeholder")}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus-ring transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common:profile.username")}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={profile.username || ""}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                      placeholder={t("common:profile.username_placeholder")}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus-ring transition-colors"
                    />
                  </div>
                  {profile.username && (
                    <Link
                      to={`/u/${profile.username}`}
                      className="inline-flex items-center gap-1 text-micro text-primary hover:underline mt-1.5"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      View public profile at /u/{profile.username}
                    </Link>
                  )}
                  {!profile.username && (
                    <p className="text-micro text-muted-foreground mt-1">
                      {t("common:profile.set_username_hint")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common:profile.bio")}</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder={t("common:profile.bio_placeholder")}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus-ring transition-colors resize-none"
                  />
                  <p className="text-micro text-muted-foreground text-right mt-0.5">
                    {profile.bio.length}/500
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* ─── Notification Preferences ─── */}
            <StaggerItem>
              <ControlledSection elementId="profile.notification_prefs">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[hsl(var(--gold-oxide))]" />
                  {t("profile.notification_prefs")}
                </h2>

                {prefsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Browser Push */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BellRing className="h-4 w-4 text-[hsl(var(--gold-oxide))]" />
                          <div>
                            <p className="text-xs font-medium">{t("profile.browser_notifications")}</p>
                            <p className="text-micro text-muted-foreground">
                              {t("profile.browser_notifications_desc")}
                            </p>
                          </div>
                        </div>
                        {prefs.push_enabled && permissionStatus === "granted" ? (
                          <Switch
                            checked={prefs.push_enabled}
                            onCheckedChange={(v) => updatePrefs({ push_enabled: v })}
                          />
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleEnablePush}>
                            <BellRing className="h-3 w-3" /> Enable
                          </Button>
                        )}
                      </div>

                      {prefs.push_enabled && (
                        <div className="ml-6 space-y-2">
                          <PrefToggle icon={Briefcase} label={t("profile.jobs_label")} checked={prefs.push_jobs} onChange={(v) => updatePrefs({ push_jobs: v })} />
                          <PrefToggle icon={Coins} label={t("profile.credits_label")} checked={prefs.push_credits} onChange={(v) => updatePrefs({ push_credits: v })} />
                          <PrefToggle icon={MessageCircle} label={t("profile.feedback_label")} checked={prefs.push_feedback} onChange={(v) => updatePrefs({ push_feedback: v })} />
                          <PrefToggle icon={GitBranch} label={t("profile.versions_label")} checked={prefs.push_versions} onChange={(v) => updatePrefs({ push_versions: v })} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border" />

                    {/* Email Digest */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <div>
                           <p className="text-xs font-medium">{t("profile.email_digest")}</p>
                          <p className="text-micro text-muted-foreground">
                            {t("profile.email_digest_desc")}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1.5 mb-3 ml-6">
                        {([
                          { key: "none", label: t("profile.digest_none") },
                          { key: "daily", label: t("profile.digest_daily") },
                          { key: "weekly", label: t("profile.digest_weekly") },
                        ] as const).map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => updatePrefs({ email_digest: opt.key })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-dense font-medium transition-all min-h-[2rem]",
                              prefs.email_digest === opt.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {prefs.email_digest !== "none" && (
                        <div className="ml-6 space-y-2">
                          <PrefToggle icon={Briefcase} label={t("profile.jobs_report")} checked={prefs.email_jobs} onChange={(v) => updatePrefs({ email_jobs: v })} />
                          <PrefToggle icon={Coins} label={t("profile.credits_report")} checked={prefs.email_credits} onChange={(v) => updatePrefs({ email_credits: v })} />
                          <PrefToggle icon={MessageCircle} label={t("profile.feedback_report")} checked={prefs.email_feedback} onChange={(v) => updatePrefs({ email_feedback: v })} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border" />

                    {/* Quiet Hours */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">{t("profile.quiet_hours")}</p>
                          <p className="text-micro text-muted-foreground">
                            {t("profile.quiet_hours_desc")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <select
                          value={prefs.quiet_hours_start ?? ""}
                          onChange={(e) => updatePrefs({ quiet_hours_start: e.target.value ? Number(e.target.value) : null })}
                          className="h-8 px-2 rounded-md border border-input bg-background text-xs focus-ring"
                        >
                          <option value="">Disabled</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground">→</span>
                        <select
                          value={prefs.quiet_hours_end ?? ""}
                          onChange={(e) => updatePrefs({ quiet_hours_end: e.target.value ? Number(e.target.value) : null })}
                          className="h-8 px-2 rounded-md border border-input bg-background text-xs focus-ring"
                        >
                          <option value="">—</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </ControlledSection>
            </StaggerItem>

            {/* Account info */}
            <StaggerItem>
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("profile.account_info")}</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="text-xs font-mono">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("profile.user_id")}</span>
                    <span className="text-micro font-mono text-muted-foreground/50">{user?.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("profile.created")}</span>
                    <span className="text-xs">{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US") : "—"}</span>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* XP & Level Progress */}
            <StaggerItem>
              <XPProgressBar />
            </StaggerItem>

            {/* Achievements */}
            <StaggerItem>
              <div className="bg-card border border-border rounded-xl p-5">
                <AchievementsBadges />
              </div>
            </StaggerItem>
            <StaggerItem>
              <SkillRadar />
            </StaggerItem>

            {/* Data & Privacy */}
            <StaggerItem>
              <Link
                to="/data-privacy"
                className="block bg-card border border-border rounded-xl p-5 hover:border-[hsl(var(--gold-oxide)/0.3)] hover-lift transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("profile.data_privacy")}</p>
                    <p className="text-micro text-muted-foreground mt-0.5">
                      {t("profile.data_privacy_desc")}
                    </p>
                  </div>
                  <span className="text-xs text-[hsl(var(--gold-oxide))]">→</span>
                </div>
              </Link>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
}

function PrefToggle({ icon: Icon, label, checked, onChange }: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1 min-h-[36px]">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
