/**
 * DeliverablesLibrary — User's generated deliverables with filtering, search, and preview.
 */
import { useState } from "react";
import { useDeliverables, useDeliverable, type Deliverable } from "@/hooks/useDeliverables";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Search, FileText, Loader2, Copy, Download, Calendar, Zap, Layers, Server,
  Filter, Package, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LEVEL_ICONS = { L1: Server, L2: Layers, L3: Zap } as const;
const LEVEL_COLORS = { L1: "text-purple-500", L2: "text-blue-500", L3: "text-emerald-500" } as const;

export default function DeliverablesLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: deliverables, isLoading } = useDeliverables({ limit: 200 });
  const { data: selectedDeliverable } = useDeliverable(selectedId || undefined);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trebuie să fii autentificat.</p>
        <Button onClick={() => navigate("/auth")}>Autentificare</Button>
      </div>
    );
  }

  // Filter logic
  const filtered = (deliverables || []).filter(d => {
    if (levelFilter !== "all" && d.service_level !== levelFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return d.deliverable_name.toLowerCase().includes(q) ||
        d.deliverable_type.toLowerCase().includes(q) ||
        d.classification_tags?.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const stats = {
    total: deliverables?.length || 0,
    completed: deliverables?.filter(d => d.status === "completed").length || 0,
    l3: deliverables?.filter(d => d.service_level === "L3").length || 0,
    l2: deliverables?.filter(d => d.service_level === "L2").length || 0,
    l1: deliverables?.filter(d => d.service_level === "L1").length || 0,
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiat în clipboard");
  };

  const downloadContent = (content: string, name: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Livrabile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toate rezultatele generate de serviciile AI
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: Package },
            { label: "Finalizate", value: stats.completed, icon: CheckCircle2 },
            { label: "L3 Quick", value: stats.l3, icon: Zap, color: "text-emerald-500" },
            { label: "L2 Pack", value: stats.l2, icon: Layers, color: "text-blue-500" },
            { label: "L1 Master", value: stats.l1, icon: Server, color: "text-purple-500" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={cn("h-3.5 w-3.5", s.color || "text-muted-foreground")} />
                <span className="text-nano text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută livrabile..." className="h-8 text-xs pl-8" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <Filter className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Toate nivelurile</SelectItem>
              <SelectItem value="L3" className="text-xs">L3 Quick</SelectItem>
              <SelectItem value="L2" className="text-xs">L2 Pack</SelectItem>
              <SelectItem value="L1" className="text-xs">L1 Master</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Toate statusurile</SelectItem>
              <SelectItem value="completed" className="text-xs">Finalizate</SelectItem>
              <SelectItem value="failed" className="text-xs">Eșuate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {stats.total === 0 ? "Nu ai niciun livrabil încă." : "Niciun rezultat pentru filtrele selectate."}
            </p>
            {stats.total === 0 && (
              <Button variant="outline" onClick={() => navigate("/services-catalog")} className="gap-1.5">
                Explorează servicii <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => {
              const LevelIcon = LEVEL_ICONS[d.service_level as keyof typeof LEVEL_ICONS] || FileText;
              const levelColor = LEVEL_COLORS[d.service_level as keyof typeof LEVEL_COLORS] || "text-muted-foreground";
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted/50")}>
                      <LevelIcon className={cn("h-4 w-4", levelColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{d.deliverable_name}</p>
                        <Badge variant={d.status === "completed" ? "default" : "secondary"} className="text-nano shrink-0">
                          {d.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {d.generated_at ? format(new Date(d.generated_at), "dd MMM yyyy, HH:mm") : "—"}
                        </span>
                        <span>{d.deliverable_type}</span>
                        <Badge variant="outline" className={cn("text-nano", levelColor)}>{d.service_level}</Badge>
                      </div>
                      {d.classification_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {d.classification_tags.slice(0, 4).map(tag => (
                            <Badge key={tag} variant="outline" className="text-nano text-muted-foreground">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedId} onOpenChange={o => { if (!o) setSelectedId(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2">
                {selectedDeliverable && (
                  <>
                    {(() => {
                      const Icon = LEVEL_ICONS[selectedDeliverable.service_level as keyof typeof LEVEL_ICONS] || FileText;
                      const color = LEVEL_COLORS[selectedDeliverable.service_level as keyof typeof LEVEL_COLORS] || "";
                      return <Icon className={cn("h-4 w-4", color)} />;
                    })()}
                    {selectedDeliverable.deliverable_name}
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedDeliverable ? (
              <>
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyContent(selectedDeliverable.content || "")}>
                    <Copy className="h-3.5 w-3.5" /> Copiază
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => downloadContent(selectedDeliverable.content || "", selectedDeliverable.deliverable_name)}>
                    <Download className="h-3.5 w-3.5" /> Descarcă
                  </Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none pr-4">
                    <ReactMarkdown>{selectedDeliverable.content || "Conținut indisponibil."}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
