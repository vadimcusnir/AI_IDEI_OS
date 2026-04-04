import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Save, Loader2, Play, Trash2, Plus, BookmarkCheck, Globe, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Preset {
  id: string;
  name: string;
  description: string;
  service_keys: string[];
  is_public: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
}

interface Props {
  allServiceKeys: string[];
  selectedKeys: Set<string>;
  onApplyPreset: (keys: string[]) => void;
}

export function ServicePresets({ allServiceKeys, selectedKeys, onApplyPreset }: Props) {
  const { user } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPresets();
  }, [user]);

  const loadPresets = async () => {
    // Load own + public presets
    const { data } = await supabase
      .from("service_presets")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(50);
    setPresets((data as Preset[]) || []);
    setLoading(false);
  };

  const savePreset = async () => {
    if (!user || !newName.trim() || selectedKeys.size === 0) return;
    setSaving(true);

    const { error } = await supabase.from("service_presets").insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc.trim(),
      service_keys: [...selectedKeys],
      is_public: isPublic,
    } as any);

    if (error) {
      toast.error("Eroare la salvare");
    } else {
      toast.success("Preset salvat!");
      setSaveOpen(false);
      setNewName("");
      setNewDesc("");
      loadPresets();
    }
    setSaving(false);
  };

  const applyPreset = async (preset: Preset) => {
    // Filter to only keys that exist in current catalog
    const valid = preset.service_keys.filter(k => allServiceKeys.includes(k));
    onApplyPreset(valid);

    // Increment usage
    await supabase
      .from("service_presets")
      .update({ usage_count: preset.usage_count + 1 } as any)
      .eq("id", preset.id);

    toast.success(`Preset "${preset.name}" aplicat — ${valid.length} servicii`);
  };

  const deletePreset = async (id: string) => {
    await supabase.from("service_presets").delete().eq("id", id);
    setPresets(prev => prev.filter(p => p.id !== id));
    toast.success("Preset șters");
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  const myPresets = presets.filter(p => p.user_id === user?.id);
  const publicPresets = presets.filter(p => p.is_public && p.user_id !== user?.id);

  return (
    <div className="space-y-3">
      {/* Save current selection as preset */}
      <div className="flex items-center gap-2">
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              disabled={selectedKeys.size === 0}
            >
              <Save className="h-3 w-3" />
              Salvează preset ({selectedKeys.size})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Salvează Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Numele preset-ului"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Descriere (opțional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Globe className="h-3 w-3" />
                Public (vizibil pentru toți utilizatorii)
              </label>
              <p className="text-micro text-muted-foreground">
                {selectedKeys.size} servicii selectate
              </p>
              <Button
                onClick={savePreset}
                disabled={!newName.trim() || saving}
                className="w-full gap-1.5 text-sm"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvează
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My presets */}
      {myPresets.length > 0 && (
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <BookmarkCheck className="h-3 w-3 inline mr-1" />
            Preseturile mele
          </p>
          <div className="space-y-1.5">
            {myPresets.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    {p.is_public ? (
                      <Globe className="h-2.5 w-2.5 text-muted-foreground/50" />
                    ) : (
                      <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                    )}
                  </div>
                  <p className="text-micro text-muted-foreground">
                    {p.service_keys.length} servicii · folosit de {p.usage_count}×
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => applyPreset(p)}
                >
                  <Play className="h-3 w-3" /> Aplică
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deletePreset(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public presets */}
      {publicPresets.length > 0 && (
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Globe className="h-3 w-3 inline mr-1" />
            Preset-uri comunitate
          </p>
          <div className="space-y-1.5">
            {publicPresets.slice(0, 5).map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate">{p.name}</span>
                  <p className="text-micro text-muted-foreground">
                    {p.service_keys.length} servicii · {p.usage_count}× folosit
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => applyPreset(p)}
                >
                  <Play className="h-3 w-3" /> Aplică
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
