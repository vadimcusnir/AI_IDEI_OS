import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import ReactMarkdown from "react-markdown";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to blog</Link>
        </div>
      </div>
    );
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "";

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

  return (
    <>
      <SEOHead
        title={`${post.seo_title || post.title} — AI-IDEI Blog`}
        description={post.seo_description || post.excerpt}
        path={`/blog/${post.slug}`}
        ogImage={post.thumbnail_url || undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        <article className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Thumbnail */}
          {post.thumbnail_url && (
            <div className="rounded-xl overflow-hidden mb-8 border border-border">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <Badge variant="outline" className="mb-4 text-xs">
              {(post.category as string).replace("-", " ")}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.reading_time_min} min read
              </span>
              <span>{post.word_count?.toLocaleString()} words</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:border prose-img:border-border">
            <ReactMarkdown
              components={{
                img: ({ src, alt, ...props }) => (
                  <figure className="my-8">
                    <img
                      src={src}
                      alt={alt || ""}
                      loading="lazy"
                      className="w-full rounded-xl border border-border"
                      {...props}
                    />
                    {alt && (
                      <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
                        {alt}
                      </figcaption>
                    )}
                  </figure>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {(post.tags as string[])?.length > 0 && (
            <footer className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {(post.tags as string[]).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </>
  );
}
