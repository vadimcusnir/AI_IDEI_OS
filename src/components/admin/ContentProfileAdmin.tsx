/**
 * ContentProfileAdmin — Admin tab for managing content audit and editorial profiles.
 * Shows content performance metrics, audit pipeline, and calendar management.
 */
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FileText, RefreshCw, Loader2, Search, BarChart3,
  TrendingUp, Eye, Calendar, AlertTriangle,
} from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  pipeline_stage: string | null;
  word_count: number | null;
  reading_time_min: number | null;
  published_at: string | null;
  created_at: string;
}

export function ContentProfileAdmin() {
  const [tab, setTab] = useState("posts");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Content Profile Admin</h3>
          <p className="text-micro text-muted-foreground">Audit editorial • Pipeline de publicare • Calendar</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-8">
          <TabsTrigger value="posts" className="text-xs h-6 gap-1">
            <FileText className="h-3 w-3" /> Articole
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs h-6 gap-1">
            <TrendingUp className="h-3 w-3" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs h-6 gap-1">
            <BarChart3 className="h-3 w-3" /> Metrici
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts"><PostsTable /></TabsContent>
        <TabsContent value="pipeline"><PipelineView /></TabsContent>
        <TabsContent value="metrics"><MetricsView /></TabsContent>
      </Tabs>
    </div>
  );
}

function PostsTable() {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let query = (supabase.from("blog_posts") as any)
      .select("id, title, slug, status, category, pipeline_stage, word_count, reading_time_min, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data } = await query;
    setPosts((data || []) as ContentItem[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    switch (s) {
      case "published": return "bg-primary/10 text-primary";
      case "draft": return "bg-muted text-muted-foreground";
      case "scheduled": return "bg-accent/10 text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută articole..." className="h-7 text-xs pl-8" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load}>
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Titlu</TableHead>
                <TableHead className="text-micro">Categorie</TableHead>
                <TableHead className="text-micro">Status</TableHead>
                <TableHead className="text-micro">Pipeline</TableHead>
                <TableHead className="text-micro text-right">Cuvinte</TableHead>
                <TableHead className="text-micro">Publicat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium max-w-[250px] truncate">{p.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-nano">{p.category}</Badge></TableCell>
                  <TableCell>
                    <Badge className={cn("text-nano", statusColor(p.status))}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.pipeline_stage ? (
                      <Badge variant="outline" className="text-nano">{p.pipeline_stage}</Badge>
                    ) : (
                      <span className="text-micro text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{p.word_count || "—"}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("ro-RO") : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    Niciun articol găsit
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PipelineView() {
  const [stages, setStages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await (supabase.from("blog_posts") as any)
        .select("pipeline_stage, status");

      const counts: Record<string, number> = { idea: 0, drafting: 0, review: 0, scheduled: 0, published: 0 };
      (data || []).forEach((p: any) => {
        const stage = p.pipeline_stage || (p.status === "published" ? "published" : "idea");
        counts[stage] = (counts[stage] || 0) + 1;
      });
      setStages(counts);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const stageConfig = [
    { key: "idea", label: "Idei", icon: AlertTriangle, color: "bg-muted" },
    { key: "drafting", label: "Drafting", icon: FileText, color: "bg-accent/20" },
    { key: "review", label: "Review", icon: Eye, color: "bg-primary/20" },
    { key: "scheduled", label: "Programat", icon: Calendar, color: "bg-ai-accent/20" },
    { key: "published", label: "Publicat", icon: TrendingUp, color: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {stageConfig.map(s => (
        <div key={s.key} className={cn("rounded-xl p-4 text-center", s.color)}>
          <s.icon className="h-5 w-5 mx-auto mb-2 text-foreground/60" />
          <p className="text-2xl font-bold">{stages[s.key] || 0}</p>
          <p className="text-micro text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function MetricsView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await (supabase.from("blog_posts") as any)
        .select("word_count, reading_time_min, status, category");

      const posts = data || [];
      const published = posts.filter((p: any) => p.status === "published");
      const totalWords = posts.reduce((s: number, p: any) => s + (p.word_count || 0), 0);
      const avgReadTime = published.length > 0
        ? Math.round(published.reduce((s: number, p: any) => s + (p.reading_time_min || 0), 0) / published.length)
        : 0;

      const categories: Record<string, number> = {};
      posts.forEach((p: any) => { categories[p.category] = (categories[p.category] || 0) + 1; });

      setMetrics({
        totalPosts: posts.length,
        publishedPosts: published.length,
        totalWords,
        avgReadTime,
        categories,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!metrics) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total articole", value: metrics.totalPosts },
          { label: "Publicate", value: metrics.publishedPosts },
          { label: "Total cuvinte", value: metrics.totalWords.toLocaleString() },
          { label: "Timp mediu lectură", value: `${metrics.avgReadTime} min` },
        ].map(m => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-micro text-muted-foreground uppercase tracking-wider">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold mb-3">Distribuție pe categorii</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(metrics.categories).sort((a: any, b: any) => b[1] - a[1]).map(([cat, count]: [string, any]) => (
            <Badge key={cat} variant="outline" className="text-xs gap-1">
              {cat} <span className="font-mono">{count}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
