/**
 * ServiceCompositionEditor — Admin control for managing L2→L3 and L1→L2/L3 relationships.
 * Used inside the AdminServicesCatalogTab edit dialog for L2 and L1 services.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Plus, X, Loader2, Zap, Layers, GripVertical } from "lucide-react";

interface ComponentItem {
  id: string;
  service_name: string;
  service_slug: string;
  category: string;
  internal_credit_cost: number;
}

interface Props {
  level: "L1" | "L2";
  selectedIds: string[];
  optionalIds?: string[];
  onChange: (ids: string[]) => void;
  onOptionalChange?: (ids: string[]) => void;
}

export function ServiceCompositionEditor({ level, selectedIds, optionalIds = [], onChange, onOptionalChange }: Props) {
  const [available, setAvailable] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const childTable = level === "L2" ? "services_level_3" : "services_level_2";
  const childLabel = level === "L2" ? "L3" : "L2";

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from(childTable) as any)
      .select("id, service_name, service_slug, category, internal_credit_cost")
      .eq("status", "active")
      .order("service_name");
    setAvailable((data || []) as ComponentItem[]);
    setLoading(false);
  }, [childTable]);

  useEffect(() => { load(); }, [load]);

  const filteredAvailable = available.filter(a => {
    if (selectedIds.includes(a.id) || optionalIds.includes(a.id)) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.service_name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedItems = selectedIds.map(id => available.find(a => a.id === id)).filter(Boolean) as ComponentItem[];
  const optionalItems = optionalIds.map(id => available.find(a => a.id === id)).filter(Boolean) as ComponentItem[];
  const totalCost = selectedItems.reduce((s, c) => s + c.internal_credit_cost, 0);

  const addComponent = (id: string) => onChange([...selectedIds, id]);
  const removeComponent = (id: string) => onChange(selectedIds.filter(i => i !== id));
  const addOptional = (id: string) => onOptionalChange?.([...optionalIds, id]);
  const removeOptional = (id: string) => onOptionalChange?.(optionalIds.filter(i => i !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...selectedIds];
    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
    onChange(copy);
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">
          Componente {childLabel} ({selectedIds.length}) • {totalCost}N total
        </p>
      </div>

      {/* Selected components with order */}
      {selectedItems.length > 0 && (
        <div className="space-y-1">
          {selectedItems.map((c, i) => (
            <div key={c.id} className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-card">
              <button onClick={() => moveUp(i)} className="text-muted-foreground hover:text-foreground" disabled={i === 0}>
                <GripVertical className="h-3 w-3" />
              </button>
              <span className="text-nano text-muted-foreground font-mono w-4">{i + 1}</span>
              {childLabel === "L3"
                ? <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
                : <Layers className="h-3 w-3 text-blue-500 shrink-0" />
              }
              <span className="text-xs flex-1 truncate">{c.service_name}</span>
              <Badge variant="outline" className="text-nano">{c.internal_credit_cost}N</Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeComponent(c.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Optional L3 for L1 */}
      {level === "L1" && onOptionalChange && (
        <>
          <p className="text-micro text-muted-foreground uppercase tracking-wider font-medium">
            Opțional L3 ({optionalIds.length})
          </p>
          {optionalItems.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {optionalItems.map(c => (
                <Badge key={c.id} variant="outline" className="text-nano gap-1 pr-1">
                  {c.service_name}
                  <button onClick={() => removeOptional(c.id)}><X className="h-2.5 w-2.5" /></button>
                </Badge>
              ))}
            </div>
          )}
        </>
      )}

      {/* Available to add */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Caută ${childLabel}...`} className="h-7 text-xs pl-7" />
      </div>

      <ScrollArea className="h-[150px]">
        <div className="space-y-1">
          {filteredAvailable.map(c => (
            <div key={c.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
              {childLabel === "L3"
                ? <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
                : <Layers className="h-3 w-3 text-blue-500 shrink-0" />
              }
              <span className="text-xs flex-1 truncate">{c.service_name}</span>
              <Badge variant="outline" className="text-nano">{c.category}</Badge>
              <Badge variant="outline" className="text-nano">{c.internal_credit_cost}N</Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => addComponent(c.id)}>
                <Plus className="h-3 w-3" />
              </Button>
              {level === "L1" && onOptionalChange && (
                <Button variant="ghost" size="icon" className="h-5 w-5" title="Add as optional" onClick={() => addOptional(c.id)}>
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {filteredAvailable.length === 0 && (
            <p className="text-micro text-muted-foreground text-center py-3">Nu sunt disponibile</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
