/**
 * Prompt Module Composer — drag-and-compose prompt blocks
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, ArrowUp, ArrowDown, Copy, Puzzle } from "lucide-react";
import { toast } from "sonner";

interface PromptModule {
  id: string;
  label: string;
  category: string;
  template: string;
  icon: string;
}

const MODULES: PromptModule[] = [
  // Context
  { id: "role", label: "Rol AI", category: "Context", template: "Ești un expert în [DOMENIU] cu 10+ ani experiență.", icon: "🎭" },
  { id: "audience", label: "Audiență", category: "Context", template: "Scrie pentru [AUDIENȚĂ] care [CONTEXT_AUDIENȚĂ].", icon: "👥" },
  { id: "tone", label: "Ton", category: "Context", template: "Tonul trebuie să fie [TON: profesional/casual/academic/persuasiv].", icon: "🎵" },
  { id: "language", label: "Limbă", category: "Context", template: "Răspunde în limba [LIMBA].", icon: "🌍" },
  // Structure
  { id: "format-list", label: "Format Listă", category: "Structură", template: "Structurează ca o listă numerotată cu [N] puncte principale.", icon: "📋" },
  { id: "format-framework", label: "Framework", category: "Structură", template: "Folosește framework-ul [FRAMEWORK: AIDA/PAS/BAB/4P] pentru structură.", icon: "🏗️" },
  { id: "format-sections", label: "Secțiuni", category: "Structură", template: "Împarte în secțiuni clare: Introducere, Corp (3-5 puncte), Concluzie, CTA.", icon: "📑" },
  { id: "format-table", label: "Tabel", category: "Structură", template: "Prezintă datele într-un tabel comparativ cu coloanele: [COL1], [COL2], [COL3].", icon: "📊" },
  // Quality
  { id: "examples", label: "Exemple", category: "Calitate", template: "Include [N] exemple concrete și relevante pentru fiecare punct.", icon: "💡" },
  { id: "data", label: "Date", category: "Calitate", template: "Susține cu date, statistici sau cercetări recente unde e posibil.", icon: "📈" },
  { id: "actionable", label: "Acționabil", category: "Calitate", template: "Fiecare punct trebuie să conțină un pas concret pe care cititorul îl poate aplica imediat.", icon: "✅" },
  { id: "avoid", label: "De Evitat", category: "Calitate", template: "Evită: clișeele, generalitățile, jargonul excesiv, și formulările pasive.", icon: "🚫" },
  // Output
  { id: "length", label: "Lungime", category: "Output", template: "Lungime țintă: [N] cuvinte / [N] paragrafe.", icon: "📏" },
  { id: "cta", label: "Call to Action", category: "Output", template: "Încheie cu un CTA puternic care motivează [ACȚIUNE_DORITĂ].", icon: "🎯" },
  { id: "seo", label: "SEO", category: "Output", template: "Optimizează pentru keyword-ul principal: [KEYWORD]. Include în H1, primul paragraf, și concluzie.", icon: "🔍" },
  { id: "hook", label: "Hook", category: "Output", template: "Începe cu un hook puternic: întrebare provocatoare / statistică șocantă / afirmație controversată.", icon: "🪝" },
];

const CATEGORIES = [...new Set(MODULES.map(m => m.category))];

interface Props {
  onCompose: (composed: string) => void;
}

export function PromptModuleComposer({ onCompose }: Props) {
  const [selected, setSelected] = useState<PromptModule[]>([]);
  const [expanded, setExpanded] = useState(false);

  const addModule = useCallback((mod: PromptModule) => {
    if (selected.find(s => s.id === mod.id)) {
      toast.info("Modulul e deja adăugat.");
      return;
    }
    setSelected(prev => [...prev, mod]);
  }, [selected]);

  const removeModule = useCallback((id: string) => {
    setSelected(prev => prev.filter(m => m.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSelected(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setSelected(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const compose = useCallback(() => {
    if (selected.length === 0) {
      toast.error("Adaugă cel puțin un modul.");
      return;
    }
    const composed = selected.map(m => m.template).join("\n\n");
    onCompose(composed);
    toast.success(`${selected.length} module compuse!`);
  }, [selected, onCompose]);

  const copyComposed = useCallback(() => {
    const composed = selected.map(m => m.template).join("\n\n");
    navigator.clipboard.writeText(composed);
    toast.success("Copiat în clipboard!");
  }, [selected]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Module Composer</h3>
          <Badge variant="outline" className="text-[10px]">{selected.length} selectate</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
          {expanded ? "Restrânge" : "Expandează"}
        </Button>
      </div>

      {expanded && (
        <>
          {/* Module palette */}
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {MODULES.filter(m => m.category === cat).map(mod => (
                    <Button
                      key={mod.id}
                      variant={selected.find(s => s.id === mod.id) ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => addModule(mod)}
                    >
                      <span>{mod.icon}</span>
                      {mod.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Composition area */}
          {selected.length > 0 && (
            <Card>
              <CardContent className="p-3 space-y-1.5">
                {selected.map((mod, i) => (
                  <div key={mod.id} className="flex items-start gap-2 text-xs group">
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveUp(i)} className="p-0.5 hover:text-primary">
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => moveDown(i)} className="p-0.5 hover:text-primary">
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-muted-foreground shrink-0">{mod.icon}</span>
                    <span className="flex-1 text-muted-foreground">{mod.template}</span>
                    <button onClick={() => removeModule(mod.id)} className="p-0.5 hover:text-destructive opacity-0 group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="text-xs h-7 gap-1 flex-1" onClick={compose}>
                    <Plus className="h-3 w-3" /> Aplică în Detalii
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={copyComposed}>
                    <Copy className="h-3 w-3" /> Copiază
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
