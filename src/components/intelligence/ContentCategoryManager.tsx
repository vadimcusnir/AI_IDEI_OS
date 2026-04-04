/**
 * ContentCategoryManager — Displays and manages the 5 extended content categories for neurons.
 * Categories: argument_map, formula, avatar, psychological, commercial
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Map, FlaskConical, UserCircle, Brain, TrendingUp, Loader2, Tags } from "lucide-react";

const CATEGORIES = [
  { key: "argument_map", label: "Argument Map", icon: Map, color: "text-orange-400", desc: "Logical argument structures and debate flows" },
  { key: "formula", label: "Formula", icon: FlaskConical, color: "text-cyan-400", desc: "Actionable copywriting and persuasion formulas" },
  { key: "avatar", label: "Avatar", icon: UserCircle, color: "text-pink-400", desc: "Audience profiles and persona definitions" },
  { key: "psychological", label: "Psychological", icon: Brain, color: "text-purple-400", desc: "Cognitive and behavioral insight patterns" },
  { key: "commercial", label: "Commercial", icon: TrendingUp, color: "text-emerald-400", desc: "Business, market, and monetization insights" },
] as const;

interface Props {
  neuronId: number;
  currentCategory?: string;
  onUpdate?: (cat: string) => void;
}

export function ContentCategoryManager({ neuronId, currentCategory, onUpdate }: Props) {
  const [selected, setSelected] = useState(currentCategory || "general");
  const [saving, setSaving] = useState(false);

  const save = async (cat: string) => {
    setSelected(cat);
    setSaving(true);
    try {
      const { error } = await (supabase.from("neurons") as any)
        .update({ content_category: cat })
        .eq("id", neuronId);
      if (error) throw error;
      toast.success(`Category set to ${cat}`);
      onUpdate?.(cat);
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tags className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Content Category</p>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {CATEGORIES.map(({ key, label, icon: Icon, color, desc }) => (
          <button
            key={key}
            onClick={() => save(key)}
            className={cn(
              "flex items-start gap-2.5 p-2 rounded-md border text-left transition-all",
              selected === key
                ? "border-primary/30 bg-primary/5"
                : "border-border/15 hover:border-border/30 bg-transparent"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", color)} />
            <div>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[10px] text-muted-foreground/50">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
