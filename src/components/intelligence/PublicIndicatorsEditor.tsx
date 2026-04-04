import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PublicIndicator {
  label: string;
  value: string;
  category: string;
}

interface PublicData {
  id: string;
  profile_id: string;
  public_indicators: PublicIndicator[];
  public_patterns: string[];
  public_summary: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface PublicIndicatorsEditorProps {
  profileId: string;
}

export function PublicIndicatorsEditor({ profileId }: PublicIndicatorsEditorProps) {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [indicators, setIndicators] = useState<PublicIndicator[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  const load = useCallback(async () => {
    const { data: pub } = await (supabase.from("intelligence_profile_public") as any)
      .select("*")
      .eq("profile_id", profileId)
      .single();
    if (pub) {
      setData(pub as PublicData);
      setIndicators((pub.public_indicators as PublicIndicator[]) || []);
      setPatterns((pub.public_patterns as string[]) || []);
      setSummary(pub.public_summary || "");
      setMetaTitle(pub.meta_title || "");
      setMetaDesc(pub.meta_description || "");
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const addIndicator = () => {
    setIndicators([...indicators, { label: "", value: "", category: "cognitive" }]);
  };

  const removeIndicator = (idx: number) => {
    setIndicators(indicators.filter((_, i) => i !== idx));
  };

  const updateIndicator = (idx: number, field: keyof PublicIndicator, val: string) => {
    setIndicators(indicators.map((ind, i) => i === idx ? { ...ind, [field]: val } : ind));
  };

  const addPattern = () => setPatterns([...patterns, ""]);
  const removePattern = (idx: number) => setPatterns(patterns.filter((_, i) => i !== idx));
  const updatePattern = (idx: number, val: string) => setPatterns(patterns.map((p, i) => i === idx ? val : p));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await (supabase.from("intelligence_profile_public") as any)
      .update({
        public_indicators: indicators.filter(i => i.label && i.value),
        public_patterns: patterns.filter(Boolean),
        public_summary: summary || null,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) toast.error(error.message);
    else toast.success("Public data saved");
    setSaving(false);
  };

  if (loading) return <div className="text-xs text-muted-foreground py-2">Loading public data…</div>;
  if (!data) return <div className="text-xs text-muted-foreground py-2">No public record. Create profile first.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-primary" /> Public Indicators
        </h4>
        <Button size="sm" variant="ghost" onClick={addIndicator} className="h-6 text-micro">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {/* Indicators */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {indicators.map((ind, idx) => (
          <div key={idx} className="flex gap-1.5 items-center">
            <Input
              placeholder="Label"
              value={ind.label}
              onChange={e => updateIndicator(idx, "label", e.target.value)}
              className="text-xs h-7 flex-1"
            />
            <Input
              placeholder="Value"
              value={ind.value}
              onChange={e => updateIndicator(idx, "value", e.target.value)}
              className="text-xs h-7 flex-1"
            />
            <Input
              placeholder="Category"
              value={ind.category}
              onChange={e => updateIndicator(idx, "category", e.target.value)}
              className="text-xs h-7 w-24"
            />
            <button onClick={() => removeIndicator(idx)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Patterns */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Public Patterns</span>
          <Button size="sm" variant="ghost" onClick={addPattern} className="h-6 text-micro">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {patterns.map((p, idx) => (
          <div key={idx} className="flex gap-1.5 items-center">
            <Input
              placeholder="Pattern description"
              value={p}
              onChange={e => updatePattern(idx, e.target.value)}
              className="text-xs h-7 flex-1"
            />
            <button onClick={() => removePattern(idx)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary + SEO */}
      <Textarea
        placeholder="Public summary (neutral, observational)"
        value={summary}
        onChange={e => setSummary(e.target.value)}
        rows={2}
        className="text-xs"
      />
      <div className="grid grid-cols-1 gap-2">
        <Input placeholder="Meta title" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className="text-xs h-7" />
        <Input placeholder="Meta description" value={metaDesc} onChange={e => setMetaDesc(e.target.value)} className="text-xs h-7" />
      </div>

      <Button size="sm" onClick={save} disabled={saving} className="w-full h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
        Save Public Data
      </Button>
    </div>
  );
}
