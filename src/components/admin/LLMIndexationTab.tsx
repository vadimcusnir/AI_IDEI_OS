/**
 * LLM Indexation Monitor — Admin tab for tracking LLM visibility and indexation quality.
 * Shows: page scores, schema coverage, referrer tracking, fix suggestions,
 * entities, knowledge surface pages, crawl queue.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, RefreshCw, Loader2, CheckCircle, AlertTriangle, XCircle,
  Globe, FileText, Sparkles, TrendingUp, Bot, Zap, Layers, Database,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PageIndex {
  id: string;
  page_path: string;
  page_title: string;
  page_type: string;
  schema_types: string[];
  entity_count: number;
  word_count: number;
  overall_score: number;
  topic_clarity_score: number;
  entity_density_score: number;
  semantic_links_score: number;
  issues: any[];
  last_crawled_at: string;
}

interface FixSuggestion {
  id: string;
  page_id: string;
  issue_type: string;
  severity: string;
  current_value: string;
  suggested_value: string;
  ai_reasoning: string;
  status: string;
  created_at: string;
}

interface ReferrerStat {
  referrer_source: string;
  count: number;
}

interface LLMEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  description: string;
  confidence: number;
  schema_org_type: string | null;
  created_at: string;
}

interface KnowledgeSurface {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  status: string;
  view_count: number;
  llm_citation_count: number;
  quality_score: number;
  created_at: string;
}

interface CrawlQueueItem {
  id: string;
  page_path: string;
  priority: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function LLMIndexationTab() {
  const [pages, setPages] = useState<PageIndex[]>([]);
  const [fixes, setFixes] = useState<FixSuggestion[]>([]);
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [entities, setEntities] = useState<LLMEntity[]>([]);
  const [surfacePages, setSurfacePages] = useState<KnowledgeSurface[]>([]);
  const [crawlQueue, setCrawlQueue] = useState<CrawlQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesRes, fixesRes, entitiesRes, surfaceRes, queueRes] = await Promise.all([
        supabase
          .from("llm_page_index")
          .select("*")
          .order("overall_score", { ascending: true })
          .limit(200),
        supabase
          .from("llm_fix_suggestions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("llm_entities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("knowledge_surface_pages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("llm_crawl_queue")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setPages((pagesRes.data as any[]) || []);
      setFixes((fixesRes.data as any[]) || []);
      setEntities((entitiesRes.data as any[]) || []);
      setSurfacePages((surfaceRes.data as any[]) || []);
      setCrawlQueue((queueRes.data as any[]) || []);

      // Referrer stats
      const { data: rawReferrers } = await supabase
        .from("llm_referrer_log")
        .select("referrer_source")
        .order("created_at", { ascending: false })
        .limit(500);
      
      const counts: Record<string, number> = {};
      (rawReferrers || []).forEach((r: any) => {
        counts[r.referrer_source] = (counts[r.referrer_source] || 0) + 1;
      });
      setReferrers(Object.entries(counts).map(([source, count]) => ({ referrer_source: source, count })));
    } catch (e) {
      console.error("Failed to load LLM indexation data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("llm-audit", {
        body: { action: "scan" },
      });
      if (error) throw error;
      toast.success(`Scan complete: ${data.pages_scanned} pages, ${data.total_issues} issues`);
      loadData();
    } catch (e: any) {
      toast.error("Scan failed: " + (e.message || "Unknown error"));
    } finally {
      setScanning(false);
    }
  };

  const generateFixes = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke("llm-audit", {
        body: { action: "fix" },
      });
      if (error) throw error;
      toast.success(`Generated ${data.fixes_generated} fix suggestions`);
      loadData();
    } catch (e: any) {
      toast.error("Fix generation failed: " + (e.message || "Unknown error"));
    } finally {
      setFixing(false);
    }
  };

  const approveFix = async (fixId: string) => {
    const { error } = await supabase
      .from("llm_fix_suggestions")
      .update({ status: "approved", approved_at: new Date().toISOString() } as any)
      .eq("id", fixId);
    if (error) { toast.error(error.message); return; }
    toast.success("Fix approved");
    loadData();
  };

  const rejectFix = async (fixId: string) => {
    const { error } = await supabase
      .from("llm_fix_suggestions")
      .update({ status: "rejected" } as any)
      .eq("id", fixId);
    if (error) { toast.error(error.message); return; }
    loadData();
  };

  // Computed metrics
  const totalPages = pages.length;
  const avgScore = totalPages > 0 ? pages.reduce((s, p) => s + Number(p.overall_score), 0) / totalPages : 0;
  const schemaCount = pages.filter(p => p.schema_types?.length > 0).length;
  const schemaCoverage = totalPages > 0 ? (schemaCount / totalPages) * 100 : 0;
  const issuePages = pages.filter(p => (p.issues as any[])?.length > 0).length;
  const pendingFixes = fixes.filter(f => f.status === "pending").length;
  const totalReferrals = referrers.reduce((s, r) => s + r.count, 0);
  const totalEntities = entities.length;
  const publishedSurface = surfacePages.filter(p => p.status === "published").length;
  const pendingCrawls = crawlQueue.filter(q => q.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">LLM Indexation Engine</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runScan} disabled={scanning} className="gap-1.5 text-xs">
            {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            Scan Pages
          </Button>
          <Button variant="outline" size="sm" onClick={generateFixes} disabled={fixing} className="gap-1.5 text-xs">
            {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate Fixes
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <KPICard label="Pages Indexed" value={totalPages} icon={Globe} />
        <KPICard label="Avg Score" value={avgScore.toFixed(1)} icon={TrendingUp} color={avgScore >= 7 ? "text-primary" : avgScore >= 5 ? "text-yellow-500" : "text-destructive"} />
        <KPICard label="Schema %" value={`${schemaCoverage.toFixed(0)}%`} icon={FileText} />
        <KPICard label="Issues" value={issuePages} icon={AlertTriangle} color="text-yellow-500" />
        <KPICard label="Fixes" value={pendingFixes} icon={Zap} color="text-primary" />
        <KPICard label="Referrals" value={totalReferrals} icon={Bot} />
        <KPICard label="Entities" value={totalEntities} icon={Database} />
        <KPICard label="Surface" value={publishedSurface} icon={Layers} />
        <KPICard label="Crawl Q" value={pendingCrawls} icon={Globe} />
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-xs">Pages</TabsTrigger>
          <TabsTrigger value="entities" className="text-xs">Entities ({totalEntities})</TabsTrigger>
          <TabsTrigger value="surface" className="text-xs">Knowledge Surface ({surfacePages.length})</TabsTrigger>
          <TabsTrigger value="fixes" className="text-xs">Fixes ({pendingFixes})</TabsTrigger>
          <TabsTrigger value="referrers" className="text-xs">LLM Traffic</TabsTrigger>
          <TabsTrigger value="queue" className="text-xs">Crawl Queue ({pendingCrawls})</TabsTrigger>
        </TabsList>

        {/* Pages overview */}
        <TabsContent value="overview">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Page</TableHead>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Schemas</TableHead>
                  <TableHead className="text-[10px] text-right">Score</TableHead>
                  <TableHead className="text-[10px] text-right">Issues</TableHead>
                  <TableHead className="text-[10px]">Last Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.slice(0, 50).map(page => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium truncate max-w-[200px]">{page.page_title || page.page_path}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{page.page_path}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">{page.page_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 flex-wrap">
                        {(page.schema_types || []).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[8px] px-1">{s}</Badge>
                        ))}
                        {(!page.schema_types || page.schema_types.length === 0) && (
                          <span className="text-[9px] text-destructive">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={Number(page.overall_score)} />
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {(page.issues as any[])?.length || 0}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {page.last_crawled_at ? new Date(page.last_crawled_at).toLocaleDateString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No pages scanned yet. Click "Scan Pages" to start.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Entities */}
        <TabsContent value="entities">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Entity</TableHead>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Schema.org</TableHead>
                  <TableHead className="text-[10px] text-right">Confidence</TableHead>
                  <TableHead className="text-[10px]">Extracted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.slice(0, 50).map(entity => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{entity.entity_name}</span>
                        {entity.description && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">{entity.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">{entity.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {entity.schema_org_type ? (
                        <Badge variant="secondary" className="text-[9px]">{entity.schema_org_type}</Badge>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={Number(entity.confidence) * 10} />
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {new Date(entity.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {entities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No entities extracted yet. Run a page scan first.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Surface */}
        <TabsContent value="surface">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Title</TableHead>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px] text-right">Views</TableHead>
                  <TableHead className="text-[10px] text-right">Citations</TableHead>
                  <TableHead className="text-[10px] text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surfacePages.map(sp => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{sp.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">/{sp.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">{sp.page_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sp.status === "published" ? "default" : "secondary"} className="text-[9px]">
                        {sp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">{sp.view_count}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{sp.llm_citation_count}</TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={Number(sp.quality_score)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {surfacePages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No knowledge surface pages yet. Use the Knowledge Page Generator to create them.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Fix suggestions */}
        <TabsContent value="fixes">
          <div className="space-y-2">
            {fixes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No fix suggestions yet. Click "Generate Fixes" to analyze low-scoring pages.
              </p>
            ) : fixes.map(fix => (
              <div key={fix.id} className={cn(
                "bg-card border border-border rounded-lg p-3 space-y-2",
                fix.status === "approved" && "border-primary/30 bg-primary/5",
                fix.status === "rejected" && "opacity-50",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={fix.severity === "high" ? "destructive" : "outline"} className="text-[9px]">
                        {fix.severity}
                      </Badge>
                      <span className="text-xs font-medium">{fix.issue_type}</span>
                      <Badge variant="secondary" className="text-[9px]">{fix.status}</Badge>
                    </div>
                    {fix.current_value && (
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-medium">Current:</span> {fix.current_value}
                      </p>
                    )}
                    <p className="text-xs text-primary">
                      <span className="font-medium">Suggested:</span> {fix.suggested_value}
                    </p>
                    {fix.ai_reasoning && (
                      <p className="text-[10px] text-muted-foreground italic">{fix.ai_reasoning}</p>
                    )}
                  </div>
                  {fix.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveFix(fix.id)}>
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => rejectFix(fix.id)}>
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* LLM Traffic */}
        <TabsContent value="referrers">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bot className="h-3 w-3" /> LLM Referrer Sources
            </p>
            {referrers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No LLM referrals tracked yet. Traffic from ChatGPT, Perplexity, and Gemini will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {referrers.sort((a, b) => b.count - a.count).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-32 truncate">{r.referrer_source}</span>
                    <Progress value={(r.count / Math.max(...referrers.map(x => x.count))) * 100} className="flex-1 h-2" />
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Crawl Queue */}
        <TabsContent value="queue">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Page Path</TableHead>
                  <TableHead className="text-[10px]">Priority</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px]">Error</TableHead>
                  <TableHead className="text-[10px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crawlQueue.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono">{item.page_path}</TableCell>
                    <TableCell>
                      <Badge variant={item.priority >= 8 ? "destructive" : "outline"} className="text-[9px]">
                        P{item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.status === "completed" ? "default" :
                        item.status === "failed" ? "destructive" : "secondary"
                      } className="text-[9px]">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-destructive truncate max-w-[150px]">
                      {item.error_message || "—"}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {crawlQueue.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Crawl queue is empty. Pages will be queued automatically during scans.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", color || "text-muted-foreground")} />
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-lg font-bold font-mono", color)}>{value}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "bg-primary/10 text-primary" : score >= 5 ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive";
  return (
    <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded", color)}>
      {score.toFixed(1)}
    </span>
  );
}
