import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Save, Trash2, Settings, Clock, Zap,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceManifest {
  id: string;
  service_key: string;
  pipeline_class: string;
  input_schema: any;
  output_schema: any;
  access_requirements: any;
  pipeline_steps: any[];
  dependencies: string[];
  estimated_duration_seconds: number;
  is_validated: boolean;
}

interface ServiceOption {
  service_key: string;
  name: string;
  credits_cost: number;
}

const CLASS_CONFIG: Record<string, { label: string; desc: string; color: string }> = {
  S: { label: "Sync", desc: "<20s", color: "text-emerald-500" },
  C: { label: "Cognitive", desc: "1-5min", color: "text-amber-500" },
  X: { label: "Extended", desc: "5-15min", color: "text-rose-500" },
};

export function ServiceManifestTab() {
  const { t } = useTranslation();
  const [manifests, setManifests] = useState<ServiceManifest[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newServiceKey, setNewServiceKey] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from("service_manifests").select("*").order("service_key"),
      supabase.from("service_catalog").select("service_key, name, credits_cost").eq("is_active", true).order("name"),
    ]);
    setManifests((m as ServiceManifest[]) || []);
    setServices((s as ServiceOption[]) || []);
    setLoading(false);
  };

  const createManifest = async () => {
    if (!newServiceKey) return;
    const existing = manifests.find(m => m.service_key === newServiceKey);
    if (existing) { toast.error(t("toast_manifest_exists")); return; }

    const { error } = await supabase.from("service_manifests").insert({
      service_key: newServiceKey,
      pipeline_class: "S",
      pipeline_steps: [],
      dependencies: [],
      estimated_duration_seconds: 30,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("toast_manifest_created"));
    setNewServiceKey("");
    load();
  };

  const updateManifest = async (manifest: ServiceManifest) => {
    setSaving(manifest.id);
    const { error } = await supabase.from("service_manifests").update({
      pipeline_class: manifest.pipeline_class,
      estimated_duration_seconds: manifest.estimated_duration_seconds,
      is_validated: manifest.is_validated,
      pipeline_steps: manifest.pipeline_steps,
      dependencies: manifest.dependencies,
      input_schema: manifest.input_schema,
      output_schema: manifest.output_schema,
      access_requirements: manifest.access_requirements,
    }).eq("id", manifest.id);
    if (error) toast.error(error.message);
    else toast.success(t("toast_manifest_saved"));
    setSaving(null);
  };

  const deleteManifest = async (id: string) => {
    const { error } = await supabase.from("service_manifests").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("toast_manifest_deleted")); load(); }
  };

  const updateField = (id: string, field: keyof ServiceManifest, value: any) => {
    setManifests(prev => prev.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Services that don't have manifests yet
  const availableServices = services.filter(
    s => !manifests.some(m => m.service_key === s.service_key)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create new manifest */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={newServiceKey}
          onChange={e => setNewServiceKey(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-[200px]"
        >
          <option value="">Selectează un serviciu...</option>
          {availableServices.map(s => (
            <option key={s.service_key} value={s.service_key}>
              {s.name} ({s.service_key})
            </option>
          ))}
        </select>
        <Button size="sm" onClick={createManifest} disabled={!newServiceKey} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Adaugă Manifest
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(CLASS_CONFIG).map(([key, cfg]) => {
          const count = manifests.filter(m => m.pipeline_class === key).length;
          return (
            <div key={key} className="border border-border rounded-lg p-3 bg-card text-center">
              <p className={cn("text-lg font-bold", cfg.color)}>{count}</p>
              <p className="text-micro text-muted-foreground">{cfg.label} ({cfg.desc})</p>
            </div>
          );
        })}
      </div>

      {/* Manifest list */}
      {manifests.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
          Niciun manifest configurat. Adaugă manifeste pentru servicii.
        </div>
      ) : (
        <div className="space-y-2">
          {manifests.map(manifest => {
            const isExpanded = expanded === manifest.id;
            const svc = services.find(s => s.service_key === manifest.service_key);
            const classConfig = CLASS_CONFIG[manifest.pipeline_class] || CLASS_CONFIG.S;

            return (
              <div key={manifest.id} className="border border-border rounded-lg bg-card">
                <div className="flex items-center gap-3 p-3">
                  <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {svc?.name || manifest.service_key}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn("text-nano", classConfig.color)}>
                        {classConfig.label}
                      </Badge>
                      <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {manifest.estimated_duration_seconds}s
                      </span>
                      {manifest.is_validated ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => updateManifest(manifest)}
                      disabled={saving === manifest.id}
                      className="h-7 w-7 p-0"
                    >
                      {saving === manifest.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Save className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => deleteManifest(manifest.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : manifest.id)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-micro text-muted-foreground uppercase">Clasă Pipeline</label>
                        <select
                          value={manifest.pipeline_class}
                          onChange={e => updateField(manifest.id, "pipeline_class", e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs mt-1"
                        >
                          {Object.entries(CLASS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label} ({cfg.desc})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-micro text-muted-foreground uppercase">Durată estimată (s)</label>
                        <Input
                          type="number"
                          value={manifest.estimated_duration_seconds}
                          onChange={e => updateField(manifest.id, "estimated_duration_seconds", Number(e.target.value))}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-micro text-muted-foreground uppercase">Validat</label>
                      <button
                        onClick={() => updateField(manifest.id, "is_validated", !manifest.is_validated)}
                        className={cn(
                          "h-5 w-9 rounded-full transition-colors relative",
                          manifest.is_validated ? "bg-emerald-500" : "bg-muted"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform",
                          manifest.is_validated ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                    <div>
                      <label className="text-micro text-muted-foreground uppercase">Dependențe (separate prin virgulă)</label>
                      <Input
                        value={manifest.dependencies.join(", ")}
                        onChange={e => updateField(manifest.id, "dependencies",
                          e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        )}
                        className="h-8 text-xs mt-1"
                        placeholder="service-key-1, service-key-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
