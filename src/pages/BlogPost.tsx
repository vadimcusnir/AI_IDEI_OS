import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowLeft, Tag, ArrowRight, BookOpen, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEOHead";
import ReactMarkdown from "react-markdown";
import { useAutoInterlink } from "@/hooks/useAutoInterlink";
import { ContentGate } from "@/components/blog/ContentGate";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ReactionBar } from "@/components/blog/ReactionBar";
import { CommentsSection } from "@/components/blog/CommentsSection";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { useEffect, useState, type ReactNode } from "react";

/* ── Utility: extract first paragraph as lead/summary ── */
function extractLead(content: string): { lead: string; rest: string } {
  const lines = content.split("\n");
  let leadEnd = 0;
  let foundParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    if (!foundParagraph) {
      foundParagraph = true;
      leadEnd = i;
    }
    // grab until next blank line or heading after first paragraph
    if (foundParagraph && i > leadEnd && (!line || line.startsWith("#"))) {
      return { lead: lines.slice(leadEnd, i).join("\n"), rest: lines.slice(i).join("\n") };
    }
  }
  return { lead: "", rest: content };
}

/* ── Reading progress bar ── */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ── Enhanced markdown components ── */
function createMarkdownComponents() {
  let headingCounter = 0;

  return {
    h1: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-16 mb-6 leading-tight tracking-tight">
        <span className="block w-12 h-1 bg-primary/40 rounded-full mb-4" />
        {children}
      </h2>
    ),
    h2: ({ children }: { children?: ReactNode }) => {
      headingCounter++;
      return (
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-14 mb-5 leading-snug tracking-tight">
          <span className="block w-10 h-0.5 bg-primary/30 rounded-full mb-3" />
          {children}
        </h2>
      );
    },
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-lg md:text-xl font-semibold text-foreground mt-10 mb-4 leading-snug">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-base md:text-lg font-semibold text-foreground mt-8 mb-3">
        {children}
      </h4>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="text-[0.9375rem] md:text-base leading-[1.8] text-muted-foreground mb-6">
        {children}
      </p>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => (
      <em className="italic text-muted-foreground/90">{children}</em>
    ),
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="my-6 ml-1 space-y-3">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="my-6 ml-1 space-y-3 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li className="flex gap-3 text-[0.9375rem] leading-[1.75] text-muted-foreground">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
        <span className="flex-1">{children}</span>
      </li>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="relative my-10 py-5 px-5 sm:px-8 border-l-[3px] border-primary/40 bg-card/60 rounded-r-xl">
        <div className="absolute -top-3 left-6 text-4xl text-primary/20 font-serif leading-none select-none">"</div>
        <div className="prose-compact text-foreground/80 italic [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </blockquote>
    ),
    hr: () => (
      <div className="my-12 flex items-center justify-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
        <span className="w-1 h-1 rounded-full bg-primary/20" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
      </div>
    ),
    img: ({ src, alt, ...props }: { src?: string; alt?: string }) => (
      <figure className="my-10 -mx-4 md:mx-0">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            className="w-full h-auto"
            {...props}
          />
        </div>
        {alt && (
          <figcaption className="text-center text-xs text-muted-foreground mt-3 px-4 italic">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <code className={`${className} text-[0.8125rem]`}>{children}</code>
        );
      }
      return (
        <code className="font-mono text-[0.8125em] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-foreground">
          {children}
        </code>
      );
    },
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="my-8 overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 sm:p-5 text-[0.8125rem] leading-relaxed -mx-2 sm:mx-0">
        {children}
      </pre>
    ),
    table: ({ children }: { children?: ReactNode }) => (
      <div className="my-8 overflow-x-auto rounded-xl border border-border -mx-2 sm:mx-0">
        <table className="w-full text-sm min-w-[400px]">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </thead>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="px-4 py-3 text-left border-b-2 border-border">{children}</th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="px-4 py-3 border-b border-border/50 text-muted-foreground">{children}</td>
    ),
  };
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: allPosts } = useQuery({
    queryKey: ["blog-posts-interlink"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, tags, category")
        .eq("status", "published")
        .limit(200);
      return (data || []) as Array<{ id: string; title: string; slug: string; tags: string[]; category: string }>;
    },
  });

  const relatedPosts = useAutoInterlink(
    post ? { id: post.id, title: post.title, slug: post.slug, tags: post.tags as string[], category: post.category as string } : null,
    allPosts
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-[720px]">
          <Skeleton className="h-5 w-28 mb-10" />
          <Skeleton className="h-72 w-full rounded-2xl mb-10" />
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-12 w-full mb-3" />
          <Skeleton className="h-12 w-4/5 mb-6" />
          <Skeleton className="h-4 w-48 mb-10" />
          <Separator className="mb-10" />
          <Skeleton className="h-6 w-full mb-4" />
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline text-sm">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "";

  const { lead, rest } = extractLead(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    image: post.thumbnail_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "AI-IDEI" },
    publisher: {
      "@type": "Organization",
      name: "AI-IDEI",
      url: "https://ai-idei.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ai-idei.com/blog/${post.slug}`,
    },
    wordCount: post.word_count,
    keywords: (post.tags as string[])?.join(", "),
  };

  const markdownComponents = createMarkdownComponents();

  return (
    <>
      <ReadingProgress />
      <SEOHead
        title={`${post.seo_title || post.title} — AI-IDEI Blog`}
        description={post.seo_description || post.excerpt}
        canonical={`https://ai-idei.com/blog/${post.slug}`}
        ogImage={post.thumbnail_url || undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background">
        <article className="container mx-auto px-4 md:px-6 py-10 md:py-16 max-w-[720px]">

          {/* ── Back link ── */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-10 uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Blog
          </Link>

          {/* ── Thumbnail ── */}
          {post.thumbnail_url && (
            <div className="rounded-2xl overflow-hidden mb-10 border border-border/60 shadow-sm">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* ── Article Header ── */}
          <header className="mb-10">
            {/* Category badge */}
            <Badge
              variant="outline"
              className="mb-5 text-[0.6875rem] uppercase tracking-widest font-semibold border-primary/30 text-primary"
            >
              {(post.category as string).replace(/-/g, " ")}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl md:text-[2.75rem] lg:text-5xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt / subtitle */}
            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed mb-6 max-w-[60ch]">
                {post.excerpt}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                AI-IDEI
              </span>
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.reading_time_min} min read
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {post.word_count?.toLocaleString()} words
              </span>
            </div>
          </header>

          {/* ── Gold divider before content ── */}
          <div className="gold-divider mb-10" />

          {/* ── Lead paragraph (always visible, larger text) ── */}
          {lead && (
            <div className="mb-10">
              <div className="text-base md:text-lg leading-[1.85] text-foreground/80 [&>p]:mb-4 [&>p:last-child]:mb-0">
                <ReactMarkdown components={markdownComponents}>{lead}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* ── Main content — gated for non-authenticated ── */}
          <ContentGate isAuthenticated={isAuthenticated}>
            <div className="article-body">
              <ReactMarkdown components={markdownComponents}>
                {rest || post.content}
              </ReactMarkdown>
            </div>

            {/* ── Tags footer ── */}
            {(post.tags as string[])?.length > 0 && (
              <footer className="mt-16">
                <div className="gold-divider mb-8" />
                <div className="flex items-start gap-3 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  {(post.tags as string[]).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </footer>
            )}
          </ContentGate>

          {/* ── Related Posts ── */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <div className="gold-divider mb-8" />
              <h2 className="text-lg font-semibold text-foreground mb-6 tracking-tight">
                Continue Reading
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPosts.slice(0, 4).map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/blog/${rp.slug}`}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-border/60 hover:border-primary/40 transition-all bg-card/60 hover:bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {rp.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Bottom spacer (accounts for mobile bottom nav) ── */}
          <div className="h-20 md:h-16" />
        </article>
      </div>
    </>
  );
}
