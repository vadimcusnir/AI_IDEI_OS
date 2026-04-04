import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Brain, Calendar, Filter, Sparkles } from "lucide-react";

interface SearchResult {
  neuron_id: number;
  title: string;
  content_category: string;
  lifecycle: string;
  score: number;
  created_at: string;
  keyword_rank: number;
  vector_rank: number;
  rrf_score: number;
}

export function AdvancedSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const handleSearch = useCallback(async () => {
    if (!user || query.trim().length < 2) return;
    setLoading(true);

    try {
      // Generate embedding for the query
      const { data: embedData } = await supabase.functions.invoke("embed-neurons", {
        body: { text_only: true, content: query },
      });

      const dateFrom = dateFilter === "7d" ? new Date(Date.now() - 7 * 86400000).toISOString()
        : dateFilter === "30d" ? new Date(Date.now() - 30 * 86400000).toISOString()
        : dateFilter === "90d" ? new Date(Date.now() - 90 * 86400000).toISOString()
        : null;

      if (embedData?.embedding) {
        // Hybrid search with RRF
        const { data } = await supabase.rpc("hybrid_search_neurons", {
          _query: query,
          _query_embedding: `[${embedData.embedding.join(",")}]`,
          _user_id: user.id,
          _match_count: 20,
          _entity_type: typeFilter === "all" ? null : typeFilter,
          _date_from: dateFrom,
        });
        setResults(data || []);
      } else {
        // Fallback to keyword-only
        const pattern = `%${query}%`;
        const { data } = await supabase
          .from("neurons")
          .select("id, title, content_category, lifecycle, score, created_at")
          .eq("author_id", user.id)
          .ilike("title", pattern)
          .order("score", { ascending: false })
          .limit(20);
        setResults((data || []).map((n: any) => ({
          neuron_id: n.id,
          title: n.title,
          content_category: n.content_category,
          lifecycle: n.lifecycle,
          score: n.score,
          created_at: n.created_at,
          keyword_rank: 0,
          vector_rank: 0,
          rrf_score: 0,
        })));
      }
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  }, [user, query, typeFilter, dateFilter]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Hybrid Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search neurons (keyword + semantic)..."
            className="text-xs h-8"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Button size="sm" className="h-8 px-3" onClick={handleSearch} disabled={loading || query.length < 2}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3 w-3" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="insight">Insight</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
                <SelectItem value="formula">Formula</SelectItem>
                <SelectItem value="framework">Framework</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={r.neuron_id}
                onClick={() => navigate(`/n/${r.neuron_id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {r.content_category && (
                      <Badge variant="secondary" className="text-nano h-4">{r.content_category}</Badge>
                    )}
                    {r.rrf_score > 0 && (
                      <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        {(r.rrf_score * 100).toFixed(0)}%
                      </span>
                    )}
                    {r.vector_rank > 0 && r.keyword_rank > 0 && (
                      <span className="text-nano text-muted-foreground">hybrid</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center py-6">No results for "{query}"</p>
        )}
      </CardContent>
    </Card>
  );
}
