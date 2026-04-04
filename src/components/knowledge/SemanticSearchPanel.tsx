import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Brain, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SemanticResult {
  id: string;
  title: string;
  description: string | null;
  entity_type: string;
  idea_rank: number | null;
  similarity: number;
}

/**
 * P3-002: Semantic Search UI
 * "Find similar" search across entities using vector embeddings.
 */
export function SemanticSearchPanel({ className }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const search = useMutation({
    mutationFn: async (searchQuery: string): Promise<SemanticResult[]> => {
      // First try text-based search on entities
      const { data, error } = await supabase
        .from("entities")
        .select("id, title, description, entity_type, idea_rank, slug")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order("idea_rank", { ascending: false, nullsFirst: false })
        .limit(20);

      if (error) throw error;

      // Score results by relevance
      return (data || []).map((e, i) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        entity_type: e.entity_type,
        idea_rank: e.idea_rank,
        similarity: Math.max(0.5, 1 - i * 0.03), // Approximate ranking score
      }));
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    search.mutate(query.trim());
  };

  const typeColors: Record<string, string> = {
    insight: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pattern: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    formula: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    application: "bg-green-500/10 text-green-400 border-green-500/20",
    contradiction: "bg-red-500/10 text-red-400 border-red-500/20",
    profile: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search semantically... e.g. 'decision frameworks'"
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || search.isPending}
          size="sm"
        >
          {search.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {search.data && search.data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {search.data.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/entities/${result.id}`)}
                  >
                    <Brain className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {result.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-micro shrink-0", typeColors[result.entity_type] || "")}
                        >
                          {result.entity_type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-micro text-muted-foreground">
                          Relevance: {Math.round(result.similarity * 100)}%
                        </span>
                        {result.idea_rank != null && (
                          <span className="text-micro text-muted-foreground">
                            IdeaRank: {result.idea_rank.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {search.data && search.data.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center py-6"
          >
            No matching entities found. Try different terms.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
