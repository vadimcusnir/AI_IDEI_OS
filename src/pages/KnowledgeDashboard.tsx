import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useKnowledgeBase, KBItem } from "@/hooks/useKnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Search, BookOpen, Lightbulb, Wrench, Layers, FileCode,
  Clock, Eye, ArrowRight, ArrowLeft, GraduationCap, Trophy,
  BarChart3, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/motion/PageTransition";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  total_items: number;
  completed_items: number | null;
}

interface KBStats {
  total_articles: number;
  total_categories: number;
  total_views: number;
  articles_read: number;
  paths_started: number;
  paths_completed: number;
  learning_paths: LearningPath[];
}

const CATEGORIES = [
  { key: "all", label: "All", icon: BookOpen },
  { key: "principle", label: "Principles", icon: Lightbulb },
  { key: "method", label: "Methods", icon: Wrench },
  { key: "framework", label: "Frameworks", icon: Layers },
  { key: "blueprint", label: "Blueprints", icon: FileCode },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  principle: "bg-primary/10 text-primary border-primary/20",
  method: "bg-accent/10 text-accent-foreground border-accent/20",
  framework: "bg-secondary text-secondary-foreground border-secondary",
  blueprint: "bg-muted text-muted-foreground border-border",
};

export default function KnowledgeDashboard() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { user } = useAuth();
  const [kbStats, setKbStats] = useState<KBStats | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBItem | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("kb_dashboard_stats", { _user_id: user.id })
      .then(({ data }) => { if (data) setKbStats(data as unknown as KBStats); });
  }, [user]);
  const { items, loading, search, setSearch, categoryCounts, trackView } = useKnowledgeBase({
    status: "published",
    ...(activeCategory !== "all" ? { category: activeCategory } : {}),
  });

  const handleArticleClick = (item: KBItem) => {
    setSelectedArticle(item);
    trackView(item.id);
  };

  if (loading) return <ListPageSkeleton />;

  // Article detail view
  if (selectedArticle) {
    return (
      <PageTransition>
        <div className="flex-1 overflow-auto">
          <SEOHead title={`${selectedArticle.title} — Knowledge Base`} description={selectedArticle.excerpt || ""} />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs mb-4" onClick={() => setSelectedArticle(null)}>
              <ArrowLeft className="h-3 w-3" /> Back to Knowledge Base
            </Button>

            <div className="space-y-4">
              <div>
                <Badge variant="outline" className={cn("text-[10px] mb-2", CATEGORY_COLORS[selectedArticle.category])}>
                  {selectedArticle.category}
                </Badge>
                {selectedArticle.subcategory && (
                  <Badge variant="outline" className="text-[10px] ml-1">{selectedArticle.subcategory}</Badge>
                )}
                <h1 className="text-xl font-serif font-bold mt-1">{selectedArticle.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedArticle.reading_time} min read</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {selectedArticle.view_count} views</span>
                </div>
              </div>

              {selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedArticle.content.split("\n").map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed">{p}</p>
                ))}
              </div>
            </div>

            {/* Next category suggestion */}
            <div className="mt-8 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2">Continue learning</p>
              <div className="flex gap-2">
                {CATEGORIES.filter(c => c.key !== "all" && c.key !== selectedArticle.category).slice(0, 2).map(cat => (
                  <Button
                    key={cat.key}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => { setActiveCategory(cat.key); setSelectedArticle(null); }}
                  >
                    <cat.icon className="h-3 w-3" /> {cat.label} <ArrowRight className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // List view
  return (
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <SEOHead title="Knowledge Base — AI-IDEI" description="Browse principles, methods, frameworks and blueprints of the Canon Cușnir methodology." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-serif font-bold">Knowledge Base</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Explore the Canon Cușnir methodology — from principles to ready-to-use blueprints.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 h-10"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {CATEGORIES.map((cat) => {
              const count = cat.key === "all"
                ? Object.values(categoryCounts).reduce((s, v) => s + v, 0)
                : categoryCounts[cat.key] || 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                  <span className="text-[9px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Articles grid */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}". Try different keywords.` : "No articles in this category yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleArticleClick(item)}
                  className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <Badge variant="outline" className={cn("text-[9px] mb-2", CATEGORY_COLORS[item.category])}>
                    {item.category}
                  </Badge>
                  <h3 className="text-sm font-semibold mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="text-[11px] text-muted-foreground line-clamp-3 mb-3">{item.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {item.reading_time} min</span>
                    <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {item.view_count}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Learning path suggestion */}
          <div className="mt-8 p-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
            <Lightbulb className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="text-sm font-semibold mb-1">Guided Learning Path</h3>
            <p className="text-[11px] text-muted-foreground mb-3 max-w-md mx-auto">
              Follow the Canon Cușnir progression: Principles → Methods → Frameworks → Blueprints
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setActiveCategory("principle")}
            >
              Start with Principles <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
