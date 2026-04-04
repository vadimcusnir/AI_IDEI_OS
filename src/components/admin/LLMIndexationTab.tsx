import { useTranslation } from "react-i18next";
/**
 * LLM Indexation Monitor — Admin tab for tracking LLM visibility and indexation quality.
 * Connected to: site_pages, llm_entities, llm_scores, llm_issues, llm_citations,
 * knowledge_surface_pages, llm_crawl_queue, llm_referrer_log, llm_page_index, llm_fix_suggestions.
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
  Eye, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ── */

interface SitePage {
  id: string;
  url: string;
  title: string | null;
  page_type: string;
  status_code: number;
  word_count: number | null;
  entity_count: number | null;
  schema_present: boolean | null;
  schema_types: string[] | null;
  internal_link_count: number | null;
  llm_visibility_score: number | null;
  meta_description: string | null;
  content_hash: string | null;
  last_scan: string | null;
}

interface LLMScore {
  id: string;
  page_id: string;
  entity_density: number;
  schema_coverage: number;
  embedding_quality: number;
  internal_link_score: number;
  citation_probability: number;
  llm_visibility_score: number;
  computed_at: string;
}

interface LLMIssue {
  id: string;
  page_id: string;
  issue_type: string;
  severity: string;
  description: string;
  suggested_fix: string;
  auto_fix_available: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface LLMEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  description: string | null;
  confidence: number;
  source: string | null;
  page_id: string | null;
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

interface LLMCitation {
  id: string;
  llm_source: string;
  query_text: string | null;
  cited_url: string | null;
  detected_at: string;
}

interface ReferrerStat {
  referrer_source: string;
  count: number;
}

export function LLMIndexationTab() {
  const { t } = useTranslation();
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [scores, setScores] = useState<LLMScore[]>([]);
  const [issues, setIssues] = useState<LLMIssue[]>([]);
  const [entities, setEntities] = useState<LLMEntity[]>([]);
  const [surfacePages, setSurfacePages] = useState<KnowledgeSurface[]>([]);
  const [citations, setCitations] = useState<LLMCitation[]>([]);
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("pages");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        sitePagesRes, scoresRes, issuesRes, entitiesRes,
        surfaceRes, citationsRes, referrersRes,
      ] = await Promise.all([
        supabase.from("site_pages").select("*").order("llm_visibility_score", { ascending: true, nullsFirst: true }).limit(200),
        supabase.from("llm_scores").select("*").order("computed_at", { ascending: false }).limit(200),
        supabase.from("llm_issues").select("*").is("resolved_at", null).order("created_at", { ascending: false }).limit(100),
        supabase.from("llm_entities").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("knowledge_surface_pages").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("llm_citations").select("*").order("detected_at", { ascending: false }).limit(100),
        supabase.from("llm_referrer_log").select("referrer_source").order("created_at", { ascending: false }).limit(500),
      ]);

      setSitePages((sitePagesRes.data as any[]) || []);
      setScores((scoresRes.data as any[]) || []);
      setIssues((issuesRes.data as any[]) || []);
      setEntities((entitiesRes.data as any[]) || []);
      setSurfacePages((surfaceRes.data as any[]) || []);
      setCitations((citationsRes.data as any[]) || []);

      // Aggregate referrer counts
      const counts: Record<string, number> = {};
      ((referrersRes.data as any[]) || []).forEach((r: any) => {
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

  /* ── Actions ── */

  const runFullScan = async () => {
    setScanning(true);
    try {
      const { data: crawlData, error: crawlErr } = await supabase.functions.invoke("llm-crawler", {
        body: { action: "crawl", limit: 100 },
      });
      if (crawlErr) throw crawlErr;
      toast.success(`Crawled: ${crawlData.discovered} new, ${crawlData.updated} updated`);

      const { data: analyzeData, error: analyzeErr } = await supabase.functions.invoke("llm-crawler", {
        body: { action: "analyze", limit: 30 },
      });
      if (analyzeErr) throw analyzeErr;
      toast.success(`Analyzed ${analyzeData.analyzed} pages`);

      await supabase.functions.invoke("llm-crawler", { body: { action: "score" } });

      const { data: issueData } = await supabase.functions.invoke("llm-crawler", {
        body: { action: "detect-issues" },
      });
      toast.success(`Found ${issueData?.issues_found || 0} new issues`);

      loadData();
    } catch (e: any) {
      toast.error("Scan failed: " + (e.message || "Unknown error"));
    } finally {
      setScanning(false);
    }
  };

  const generateKnowledgePages = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-knowledge-pages", {
        body: { action: "generate", limit: 10 },
      });
      if (error) throw error;
      toast.success(`Generated ${data?.generated || 0} knowledge pages`);
      loadData();
    } catch (e: any) {
      toast.error("Generation failed: " + (e.message || "Unknown error"));
    } finally {
      setFixing(false);
    }
  };

  const resolveIssue = async (issueId: string) => {
    await supabase.from("llm_issues").update({ resolved_at: new Date().toISOString() } as any).eq("id", issueId);
    toast.success(t("toast_issue_resolved"));
    loadData();
  };

  /* ── Computed metrics ── */
  const totalPages = sitePages.length;
  const avgVisibility = totalPages > 0 ? sitePages.reduce((s, p) => s + (Number(p.llm_visibility_score) || 0), 0) / totalPages : 0;
  const schemaCount = sitePages.filter(p => p.schema_present).length;
  const schemaCoverage = totalPages > 0 ? (schemaCount / totalPages) * 100 : 0;
  const openIssues = issues.length;
  const totalCitations = citations.length;
  const totalEntities = entities.length;
  const publishedSurface = surfacePages.filter(p => p.status === "published").length;
  const totalReferrals = referrers.reduce((s, r) => s + r.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">LLM Indexation Engine</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runFullScan} disabled={scanning} className="gap-1.5 text-xs">
            {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            Full Scan
          </Button>
          <Button variant="outline" size="sm" onClick={generateKnowledgePages} disabled={fixing} className="gap-1.5 text-xs">
            {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate Pages
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Pages" value={totalPages} icon={Globe} />
        <KPICard label="Visibility" value={avgVisibility.toFixed(1)} icon={TrendingUp} color={avgVisibility >= 7 ? "text-primary" : avgVisibility >= 4 ? "text-warning" : "text-destructive"} />
        <KPICard label="Schema %" value={`${schemaCoverage.toFixed(0)}%`} icon={FileText} />
        <KPICard label="Issues" value={openIssues} icon={AlertTriangle} color={openIssues > 10 ? "text-destructive" : "text-warning"} />
        <KPICard label="Entities" value={totalEntities} icon={Database} />
        <KPICard label="Citations" value={totalCitations} icon={Link2} />
        <KPICard label="Surface" value={publishedSurface} icon={Layers} />
        <KPICard label="LLM Traffic" value={totalReferrals} icon={Bot} />
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="h-8">
          <TabsTrigger value="pages" className="text-xs">Pages ({totalPages})</TabsTrigger>
          <TabsTrigger value="entities" className="text-xs">Entities ({totalEntities})</TabsTrigger>
          <TabsTrigger value="issues" className="text-xs">Issues ({openIssues})</TabsTrigger>
          <TabsTrigger value="surface" className="text-xs">Knowledge Surface</TabsTrigger>
          <TabsTrigger value="citations" className="text-xs">Citations</TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs">LLM Traffic</TabsTrigger>
        </TabsList>

        {/* ── Pages (site_pages + llm_scores) ── */}
        <TabsContent value="pages">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">URL / Title</TableHead>
                  <TableHead className="text-micro">Type</TableHead>
                  <TableHead className="text-micro">Schema</TableHead>
                  <TableHead className="text-micro text-right">Words</TableHead>
                  <TableHead className="text-micro text-right">Entities</TableHead>
                  <TableHead className="text-micro text-right">Visibility</TableHead>
                  <TableHead className="text-micro">Last Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitePages.slice(0, 60).map(page => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium truncate max-w-[220px]">{page.title || "Untitled"}</span>
                        <span className="text-micro text-muted-foreground font-mono truncate max-w-[220px]">{page.url}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-nano">{page.page_type}</Badge></TableCell>
                    <TableCell>
                      {page.schema_present ? (
                        <div className="flex gap-0.5 flex-wrap">
                          {(page.schema_types || []).slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-nano px-1">{s}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-nano text-destructive">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">{page.word_count ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{page.entity_count ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={Number(page.llm_visibility_score) || 0} />
                    </TableCell>
                    <TableCell className="text-micro text-muted-foreground">
                      {page.last_scan ? new Date(page.last_scan).toLocaleDateString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sitePages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No pages crawled yet. Click "Full Scan" to discover and analyze pages.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Entities (llm_entities) ── */}
        <TabsContent value="entities">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">Entity</TableHead>
                  <TableHead className="text-micro">Type</TableHead>
                  <TableHead className="text-micro text-right">Confidence</TableHead>
                  <TableHead className="text-micro">Source</TableHead>
                  <TableHead className="text-micro">Extracted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.slice(0, 60).map(entity => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{entity.entity_name}</span>
                        {entity.description && (
                          <span className="text-micro text-muted-foreground truncate max-w-[250px]">{entity.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-nano">{entity.entity_type}</Badge></TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={Number(entity.confidence) * 10} />
                    </TableCell>
                    <TableCell className="text-micro text-muted-foreground font-mono truncate max-w-[150px]">
                      {entity.source || "—"}
                    </TableCell>
                    <TableCell className="text-micro text-muted-foreground">
                      {new Date(entity.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {entities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No entities extracted yet. Run a Full Scan first.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Issues (llm_issues) ── */}
        <TabsContent value="issues">
          <div className="space-y-2">
            {issues.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No open issues. Run a Full Scan to detect indexation problems.
              </p>
            ) : issues.map(issue => (
              <div key={issue.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.severity === "high" ? "destructive" : "outline"} className="text-nano">
                        {issue.severity}
                      </Badge>
                      <span className="text-xs font-medium">{issue.issue_type.replace(/_/g, " ")}</span>
                      {issue.auto_fix_available && (
                        <Badge variant="secondary" className="text-nano">Auto-fixable</Badge>
                      )}
                    </div>
                    <p className="text-micro text-muted-foreground">{issue.description}</p>
                    <p className="text-xs text-primary">
                      <span className="font-medium">Fix:</span> {issue.suggested_fix}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => resolveIssue(issue.id)}>
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Knowledge Surface ── */}
        <TabsContent value="surface">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">Title</TableHead>
                  <TableHead className="text-micro">Type</TableHead>
                  <TableHead className="text-micro">Status</TableHead>
                  <TableHead className="text-micro text-right">Views</TableHead>
                  <TableHead className="text-micro text-right">Citations</TableHead>
                  <TableHead className="text-micro text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surfacePages.map(sp => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{sp.title}</span>
                        <span className="text-micro text-muted-foreground font-mono">/{sp.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-nano">{sp.page_type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={sp.status === "published" ? "default" : "secondary"} className="text-nano">{sp.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">{sp.view_count}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{sp.llm_citation_count}</TableCell>
                    <TableCell className="text-right"><ScoreBadge score={Number(sp.quality_score)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {surfacePages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No knowledge surface pages. Click "Generate Pages" to auto-create from your knowledge graph.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Citations (llm_citations) ── */}
        <TabsContent value="citations">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">LLM Source</TableHead>
                  <TableHead className="text-micro">Query</TableHead>
                  <TableHead className="text-micro">Cited URL</TableHead>
                  <TableHead className="text-micro">Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citations.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline" className="text-nano">{c.llm_source}</Badge></TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{c.query_text || "—"}</TableCell>
                    <TableCell className="text-micro text-muted-foreground font-mono truncate max-w-[200px]">{c.cited_url || "—"}</TableCell>
                    <TableCell className="text-micro text-muted-foreground">{new Date(c.detected_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {citations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No LLM citations detected yet. Citations from ChatGPT, Perplexity, and Gemini will appear here.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── LLM Traffic ── */}
        <TabsContent value="traffic">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
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
      </Tabs>
    </div>
  );
}

/* ── Helpers ── */

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", color || "text-muted-foreground")} />
        <span className="text-nano text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-lg font-bold font-mono", color)}>{value}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "bg-primary/10 text-primary" : score >= 4 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  return (
    <span className={cn("text-micro font-mono font-bold px-1.5 py-0.5 rounded", color)}>
      {score.toFixed(1)}
    </span>
  );
}
