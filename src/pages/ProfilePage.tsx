import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Loader2, User, Save, CheckCircle2,
  Bell, BellRing, Mail, Clock,
  Briefcase, Coins, MessageCircle, GitBranch, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
  username: string | null;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
        toast.error("This username is already taken.");
      } else {
        toast.error("Save error: " + error.message);
      }
    } else {
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleEnablePush = async () => {
    const permission = await requestPermission();
    if (permission === "granted") {
      await updatePrefs({ push_enabled: true });
      toast.success("Browser notifications enabled!");
    } else {
      toast.error("Notification permission was denied.");
    }
  };

  const avatarInitial = profile.display_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() || "?";

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold tracking-tight">My Profile</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-1.5 text-xs"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>

        {/* Avatar section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-border"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-border flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{avatarInitial}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Avatar</p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Enter a URL for your profile image.
              </p>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your name"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input
                type="text"
                value={profile.username || ""}
                onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                placeholder="username"
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Profilul tău public va fi accesibil la /u/{profile.username || "username"}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Descrie-te pe scurt..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-0.5">
              {profile.bio.length}/500
            </p>
          </div>
        </div>

        {/* ─── Notification Preferences ─── */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Preferințe notificări
          </h2>

          {prefsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto my-4" />
          ) : (
            <div className="space-y-5">
              {/* Browser Push */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium">Notificări browser</p>
                      <p className="text-[10px] text-muted-foreground">
                        Primești alerte pe desktop chiar dacă nu ești pe pagină
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
                      <BellRing className="h-3 w-3" /> Activează
                    </Button>
                  )}
                </div>

                {prefs.push_enabled && (
                  <div className="ml-6 space-y-2">
                    <PrefToggle
                      icon={Briefcase}
                      label="Joburi finalizate / eșuate"
                      checked={prefs.push_jobs}
                      onChange={(v) => updatePrefs({ push_jobs: v })}
                    />
                    <PrefToggle
                      icon={Coins}
                      label="Alerte credite scăzute"
                      checked={prefs.push_credits}
                      onChange={(v) => updatePrefs({ push_credits: v })}
                    />
                    <PrefToggle
                      icon={MessageCircle}
                      label="Feedback și răspunsuri"
                      checked={prefs.push_feedback}
                      onChange={(v) => updatePrefs({ push_feedback: v })}
                    />
                    <PrefToggle
                      icon={GitBranch}
                      label="Versiuni noi salvate"
                      checked={prefs.push_versions}
                      onChange={(v) => updatePrefs({ push_versions: v })}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Email Digest */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Digest email</p>
                    <p className="text-[10px] text-muted-foreground">
                      Rezumat periodic trimis pe email
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3 ml-6">
                  {(
                    [
                      { key: "none", label: "Dezactivat" },
                      { key: "daily", label: "Zilnic" },
                      { key: "weekly", label: "Săptămânal" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => updatePrefs({ email_digest: opt.key })}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                        prefs.email_digest === opt.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {prefs.email_digest !== "none" && (
                  <div className="ml-6 space-y-2">
                    <PrefToggle
                      icon={Briefcase}
                      label="Raport joburi"
                      checked={prefs.email_jobs}
                      onChange={(v) => updatePrefs({ email_jobs: v })}
                    />
                    <PrefToggle
                      icon={Coins}
                      label="Raport credite"
                      checked={prefs.email_credits}
                      onChange={(v) => updatePrefs({ email_credits: v })}
                    />
                    <PrefToggle
                      icon={MessageCircle}
                      label="Raport feedback"
                      checked={prefs.email_feedback}
                      onChange={(v) => updatePrefs({ email_feedback: v })}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Quiet Hours */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Ore liniștite</p>
                    <p className="text-[10px] text-muted-foreground">
                      Fără notificări browser în interval
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <select
                    value={prefs.quiet_hours_start ?? ""}
                    onChange={(e) => updatePrefs({ quiet_hours_start: e.target.value ? Number(e.target.value) : null })}
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                  >
                    <option value="">Dezactivat</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">→</span>
                  <select
                    value={prefs.quiet_hours_end ?? ""}
                    onChange={(e) => updatePrefs({ quiet_hours_end: e.target.value ? Number(e.target.value) : null })}
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs"
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

        {/* Account info (read-only) */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Informații cont</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-xs font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ID utilizator</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">{user?.id.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Creat la</span>
              <span className="text-xs">{user?.created_at ? new Date(user.created_at).toLocaleDateString("ro-RO") : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrefToggle({ icon: Icon, label, checked, onChange }: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
