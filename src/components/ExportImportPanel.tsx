import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Download, Upload, FileJson, FileText, Loader2, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportedNeuron {
  number: number;
  title: string;
  status: string;
  lifecycle: string;
  content_category: string | null;
  blocks: { type: string; content: string; position: number; language?: string | null }[];
}

export function ExportImportPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"json" | "markdown" | "text">("text");
  const [importResult, setImportResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: neurons } = await supabase
        .from("neurons")
        .select("id, number, title, status, lifecycle, content_category")
        .eq("author_id", user.id)
        .order("number");

      if (!neurons?.length) { toast.error(t("no_neurons_to_export")); setExporting(false); return; }

      const exported: ExportedNeuron[] = [];
      for (const n of neurons) {
        const { data: blocks } = await supabase
          .from("neuron_blocks")
          .select("type, content, position, language")
          .eq("neuron_id", (n as any).id)
          .order("position");

        exported.push({
          number: (n as any).number,
          title: (n as any).title,
          status: (n as any).status,
          lifecycle: (n as any).lifecycle,
          content_category: (n as any).content_category,
          blocks: (blocks || []) as any[],
        });
      }

      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-idei-neurons-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exported_neurons_count", { count: exported.length }));
      trackInternalEvent({ event: AnalyticsEvents.EXPORT_TRIGGERED, params: { format: "json", count: exported.length } });
    } catch (e) {
      toast.error(t("export_failed"));
    }
    setExporting(false);
  };

  const handleExportMarkdown = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: neurons } = await supabase
        .from("neurons")
        .select("id, number, title, status, content_category")
        .eq("author_id", user.id)
        .order("number");

      if (!neurons?.length) { toast.error(t("no_neurons_to_export")); setExporting(false); return; }

      let md = `# AI-IDEI Knowledge Export\n\n_Exported: ${new Date().toLocaleString()}_\n\n---\n\n`;

      for (const n of neurons) {
        const { data: blocks } = await supabase
          .from("neuron_blocks")
          .select("type, content")
          .eq("neuron_id", (n as any).id)
          .order("position");

        md += `## #${(n as any).number} — ${(n as any).title}\n\n`;
        md += `_Status: ${(n as any).status} · Category: ${(n as any).content_category || "—"}_\n\n`;

        for (const b of (blocks || []) as any[]) {
          switch (b.type) {
            case "heading": md += `### ${b.content}\n\n`; break;
            case "subheading": md += `#### ${b.content}\n\n`; break;
            case "quote": md += `> ${b.content}\n\n`; break;
            case "idea": md += `💡 **Idea:** ${b.content}\n\n`; break;
            case "code": md += `\`\`\`\n${b.content}\n\`\`\`\n\n`; break;
            case "todo": md += `- [ ] ${b.content}\n`; break;
            case "divider": md += `---\n\n`; break;
            default: md += `${b.content}\n\n`; break;
          }
        }
        md += `---\n\n`;
      }

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-idei-neurons-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exported_neurons_md", { count: neurons.length }));
    } catch (e) {
      toast.error(t("export_failed"));
    }
    setExporting(false);
  };

  const handleImport = async () => {
    if (!user || !importText.trim()) return;
    setImporting(true);
    setImportResult(null);

    try {
      let neuronsToCreate: { title: string; blocks: { type: string; content: string }[] }[] = [];

      if (importFormat === "json") {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          neuronsToCreate = parsed.map((n: any) => ({
            title: n.title || "Imported Neuron",
            blocks: Array.isArray(n.blocks) ? n.blocks : [{ type: "text", content: JSON.stringify(n) }],
          }));
        }
      } else if (importFormat === "markdown") {
        // Split by ## headings
        const sections = importText.split(/^## /gm).filter(s => s.trim());
        neuronsToCreate = sections.map(section => {
          const lines = section.split("\n");
          const title = lines[0]?.trim() || "Imported Neuron";
          const content = lines.slice(1).join("\n").trim();
          return { title, blocks: [{ type: "markdown", content }] };
        });
      } else {
        // Plain text: split by double newlines = separate neurons, or treat as single
        const chunks = importText.split(/\n{3,}/).filter(c => c.trim());
        if (chunks.length === 1) {
          neuronsToCreate = [{ title: "Imported Content", blocks: [{ type: "text", content: importText.trim() }] }];
        } else {
          neuronsToCreate = chunks.map((chunk, i) => {
            const lines = chunk.trim().split("\n");
            const title = lines[0]?.length < 80 ? lines[0] : `Import #${i + 1}`;
            return { title, blocks: [{ type: "text", content: chunk.trim() }] };
          });
        }
      }

      let created = 0;
      for (const n of neuronsToCreate) {
        const { data: neuron, error } = await supabase
          .from("neurons")
          .insert({ author_id: user.id, title: n.title, status: "draft", lifecycle: "ingested" } as any)
          .select("id")
          .single();

        if (error || !neuron) continue;

        for (let i = 0; i < n.blocks.length; i++) {
          await supabase.from("neuron_blocks").insert({
            neuron_id: (neuron as any).id,
            type: n.blocks[i].type || "text",
            content: n.blocks[i].content || "",
            position: i,
            execution_mode: "passive",
          });
        }
        created++;
      }

      setImportResult(t("imported_result", { count: created }));
      toast.success(t("imported_neurons_count", { count: created }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("import_failed");
      toast.error(msg);
      setImportResult(`Error: ${msg}`);
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-base">{t("export_import_title")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("export_import_desc")}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Export */}
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("export_all_neurons")}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 flex-1" onClick={handleExportJSON} disabled={exporting}>
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileJson className="h-3 w-3" />}
              {t("export_json")}
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 flex-1" onClick={handleExportMarkdown} disabled={exporting}>
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
              {t("export_markdown")}
            </Button>
          </div>
        </div>

        {/* Import */}
        <div className="px-5 py-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("import_content")}</h3>

          <div className="flex gap-1.5 mb-3">
            {(["text", "markdown", "json"] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setImportFormat(fmt)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                  importFormat === fmt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={
              importFormat === "json" ? '[{"title": "My Neuron", "blocks": [{"type": "text", "content": "..."}]}]' :
              importFormat === "markdown" ? '## First Neuron\n\nContent here...\n\n## Second Neuron\n\nMore content...' :
              'Paste text content. Separate neurons with 3+ blank lines.'
            }
            rows={6}
            className="w-full bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-border focus:border-primary transition-colors resize-none"
          />

          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" className="text-xs gap-1.5" onClick={handleImport} disabled={importing || !importText.trim()}>
              {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {t("import")}
            </Button>
            {importResult && (
              <span className="text-xs text-status-validated flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {importResult}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
