/**
 * ModuleRegistryPanel — Admin SSOT for system modules.
 * Fail-closed: if not in registry, module cannot execute.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Search, Box, Cpu, Brain, TrendingUp, Layers, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Module {
  id: string;
  module_key: string;
  name: string;
  module_type: string;
  status: string;
  description: string;
  min_tier: string;
  version: string;
}

const TYPE_ICONS: Record<string, typeof Box> = {
  ui: Box, api: Cpu, ai: Brain, economy: TrendingUp, infrastructure: Layers,
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400",
  deprecated: "text-amber-400",
  blocked: "text-red-400",
  pending: "text-muted-foreground",
};

export function ModuleRegistryPanel() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("system_modules") as any)
      .select("id, module_key, name, module_type, status, description, min_tier, version")
      .order("name");
    setModules((data || []) as Module[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (mod: Module) => {
    const newStatus = mod.status === "active" ? "blocked" : "active";
    const { error } = await (supabase.from("system_modules") as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", mod.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`${mod.name} → ${newStatus}`);
    load();
  };

  const filtered = modules.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.module_key.includes(search.toLowerCase())) return false;
    if (typeFilter && m.module_type !== typeFilter) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const typeCounts = modules.reduce<Record<string, number>>((acc, m) => {
    acc[m.module_type] = (acc[m.module_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {["ui", "api", "ai", "economy", "infrastructure"].map(t => {
          const Icon = TYPE_ICONS[t] || Box;
          return (
            <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] uppercase tracking-wider transition-all",
                typeFilter === t ? "border-primary/30 bg-primary/5 text-primary" : "border-border/15 text-muted-foreground hover:border-border/30")}>
              <Icon className="h-3 w-3" />
              {t} ({typeCounts[t] || 0})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/40" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules..." className="h-8 text-xs pl-8" />
      </div>

      {/* Module list */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No modules registered. Add modules to enable fail-closed enforcement.</p>
        ) : filtered.map(mod => {
          const Icon = TYPE_ICONS[mod.module_type] || Box;
          return (
            <div key={mod.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border/10 hover:border-border/20 transition-all">
              <Icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">{mod.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/30">{mod.module_key}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/40 truncate">{mod.description || "—"}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/30">{mod.min_tier}</span>
              <span className="text-[10px] text-muted-foreground/30">v{mod.version}</span>
              <button onClick={() => toggleStatus(mod)} className={cn("text-[10px] uppercase tracking-wider font-semibold", STATUS_COLORS[mod.status])}>
                {mod.status}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/30 text-center">
        {modules.length} modules registered • {modules.filter(m => m.status === "active").length} active • fail-closed enforcement
      </p>
    </div>
  );
}
