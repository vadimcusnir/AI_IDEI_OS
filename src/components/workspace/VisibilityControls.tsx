/**
 * VisibilityControls — Publish flow for artifacts.
 * Selection → Licensing → Pricing → Commercial Tags → Publish.
 * Phase 9.2
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Eye, EyeOff, Lock, Globe, Tag, DollarSign,
  Loader2, CheckCircle2, ArrowRight,
} from "lucide-react";

interface ArtifactRow {
  id: string;
  title: string;
  artifact_type: string;
  status: string;
  visibility: string;
  created_at: string;
}

interface Props {
  artifacts: ArtifactRow[];
  onUpdate: () => void;
}

type Step = "select" | "configure" | "confirm";

export function VisibilityControls({ artifacts, onUpdate }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("select");
  const [license, setLicense] = useState("personal");
  const [tags, setTags] = useState("");
  const [publishing, setPublishing] = useState(false);

  const privateArtifacts = artifacts.filter(a => a.visibility === "private");
  const publicArtifacts = artifacts.filter(a => a.visibility === "public");

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const publishSelected = async () => {
    if (selected.size === 0) return;
    setPublishing(true);

    const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

    for (const id of selected) {
      await supabase.from("artifacts").update({
        visibility: "public",
        tags: tagArray.length > 0 ? tagArray : undefined,
      } as any).eq("id", id);
    }

    toast.success(`${selected.size} artifacts published`);
    setSelected(new Set());
    setStep("select");
    setPublishing(false);
    onUpdate();
  };

  const unpublishArtifact = async (id: string) => {
    await supabase.from("artifacts").update({ visibility: "private" } as any).eq("id", id);
    toast.success("Artifact set to private");
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Currently Public */}
      {publicArtifacts.length > 0 && (
        <div>
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Globe className="h-3 w-3" /> Currently Public ({publicArtifacts.length})
          </h3>
          <div className="space-y-1">
            {publicArtifacts.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                <Eye className="h-4 w-4 text-status-validated shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title || "Untitled"}</p>
                  <p className="text-micro text-muted-foreground">{a.artifact_type}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => unpublishArtifact(a.id)}>
                  <EyeOff className="h-3 w-3" /> Unpublish
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish Flow */}
      <div>
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <Lock className="h-3 w-3" /> Private Artifacts — Select to Publish
        </h3>

        {step === "select" && (
          <div className="space-y-1">
            {privateArtifacts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">All artifacts are already public or none exist.</p>
            ) : (
              <>
                {privateArtifacts.map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      selected.has(a.id) ? "bg-primary/5 border border-primary/20" : "hover:bg-card"
                    )}
                    onClick={() => toggleSelect(a.id)}
                  >
                    <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title || "Untitled"}</p>
                      <p className="text-micro text-muted-foreground">{a.artifact_type} · {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="text-nano">{a.status}</Badge>
                  </div>
                ))}

                {selected.size > 0 && (
                  <Button className="w-full mt-3 gap-1.5 text-xs h-8" onClick={() => setStep("configure")}>
                    Configure {selected.size} artifact{selected.size > 1 ? "s" : ""} <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {step === "configure" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold">Publishing Configuration</h4>

            <div>
              <Label className="text-xs">License Type</Label>
              <Select value={license} onValueChange={setLicense}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal" className="text-xs">Personal Use</SelectItem>
                  <SelectItem value="commercial" className="text-xs">Commercial Use</SelectItem>
                  <SelectItem value="creative_commons" className="text-xs">Creative Commons</SelectItem>
                  <SelectItem value="exclusive" className="text-xs">Exclusive License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} className="h-8 text-xs" placeholder="marketing, strategy, analysis" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setStep("select")}>Back</Button>
              <Button size="sm" className="text-xs h-8 gap-1 flex-1" onClick={() => setStep("confirm")}>
                Review <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-status-validated" /> Confirm Publication
            </h4>
            <div className="text-xs space-y-1">
              <p><strong>{selected.size}</strong> artifact{selected.size > 1 ? "s" : ""} will become public</p>
              <p>License: <Badge variant="outline" className="text-nano">{license}</Badge></p>
              {tags && <p>Tags: {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                <Badge key={t} variant="secondary" className="text-nano mr-1">{t}</Badge>
              ))}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setStep("configure")}>Back</Button>
              <Button size="sm" className="text-xs h-8 gap-1 flex-1" onClick={publishSelected} disabled={publishing}>
                {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                Publish Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
