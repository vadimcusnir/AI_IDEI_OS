import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, User, Camera, Save, ArrowLeft, CheckCircle2,
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
      // Profile doesn't exist yet, create it
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
        toast.error("Acest username este deja folosit.");
      } else {
        toast.error("Eroare la salvare: " + error.message);
      }
    } else {
      setSaved(true);
      toast.success("Profil actualizat cu succes!");
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
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
          <h1 className="text-lg font-semibold tracking-tight">Profilul meu</h1>
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
            {saved ? "Salvat" : "Salvează"}
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
                Introdu un URL pentru imaginea de profil.
              </p>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://exemplu.com/avatar.jpg"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nume afișat</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Numele tău"
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

        {/* Account info (read-only) */}
        <div className="bg-card border border-border rounded-xl p-6 mt-4">
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
