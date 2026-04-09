import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  published_at: string;
  reading_time_min: number;
}

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "knowledge-extraction", label: "Knowledge Extraction" },
  { key: "content-intelligence", label: "Content Intelligence" },
  { key: "creator-systems", label: "Creator Systems" },
  { key: "cognitive-frameworks", label: "Cognitive Frameworks" },
  { key: "ai-strategy", label: "AI Strategy" },
  { key: "digital-economics", label: "Digital Economics" },
];

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, thumbnail_url, category, tags, published_at, reading_time_min")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const filtered = activeCategory === "all"
    ? posts
    : posts?.filter(p => p.category === activeCategory);

  const categoryLabel = CATEGORIES.find(c => c.key === activeCategory)?.label || "All";
  const seoTitle = activeCategory === "all"
    ? "Blog — AI-IDEI | Knowledge Extraction Insights"
    : `${categoryLabel} — AI-IDEI Blog`;
  const seoDesc = activeCategory === "all"
    ? "Expert insights on AI, knowledge extraction, content intelligence, and cognitive frameworks from the AI-IDEI platform."
    : `Articles about ${categoryLabel.toLowerCase()} — strategies, frameworks, and practical guides from AI-IDEI.`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={`https://ai-idei.com/blog${activeCategory !== "all" ? `?category=${activeCategory}` : ""}`}
      />
      <BreadcrumbJsonLd items={[
        { name: "AI-IDEI", url: "https://ai-idei.com" },
        { name: "Blog", url: "https://ai-idei.com/blog" },
        ...(activeCategory !== "all" ? [{ name: categoryLabel, url: `https://ai-idei.com/blog?category=${activeCategory}` }] : []),
      ]} />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-20 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3">
              {activeCategory === "all" ? "Blog" : categoryLabel}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {activeCategory === "all"
                ? "Deep insights on knowledge extraction, AI strategy, and building systems that think."
                : `Explore our ${categoryLabel.toLowerCase()} articles and guides.`}
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <div className="container mx-auto px-4 pt-6 pb-2">
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2" aria-label="Blog categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  if (cat.key === "all") {
                    setSearchParams({});
                  } else {
                    setSearchParams({ category: cat.key });
                  }
                }}
                className={cn(
                  "shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px]",
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-6 md:py-10 pb-24 md:pb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !filtered?.length ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {activeCategory === "all"
                  ? "No posts published yet. Check back soon."
                  : `No posts in "${categoryLabel}" yet.`}
              </p>
              {activeCategory !== "all" && (
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  View all posts →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-44 bg-muted overflow-hidden">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                        <span className="text-4xl opacity-30">✦</span>
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-3 left-3 text-xs">
                      {post.category.replace(/-/g, " ")}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.reading_time_min} min
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
