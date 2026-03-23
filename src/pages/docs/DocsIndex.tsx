import { Link } from "react-router-dom";
import { BookOpen, Layers, Network, Boxes, Rocket, HelpCircle, ChevronRight, GraduationCap, Code } from "lucide-react";
import { DOCS_SECTIONS } from "./docsContent";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, BookOpen, Layers, Network, Boxes, HelpCircle,
};

export default function DocsIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Documentation — AI-IDEI Knowledge Platform"
        description="Complete documentation for AI-IDEI: knowledge extraction, neuron model, AI pipeline, credits system, and more. Learn to transform expertise into digital assets."
      />
      <OrganizationJsonLd />
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 max-w-[50ch]">
            AI-IDEI Documentation
          </h1>
          <p className="text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            Learn how to turn your content into structured knowledge assets.
            From your first upload to advanced AI services — everything you need to get started.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Quick start callout */}
        <Link
          to="/docs/getting-started/introduction"
          className="flex items-center gap-4 p-5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors mb-8 group"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold group-hover:text-primary transition-colors">
              New here? Start with the introduction →
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Understand what AI-IDEI does and how to use it in 5 minutes.
            </p>
          </div>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DOCS_SECTIONS.map((sec) => {
            const Icon = ICON_MAP[sec.icon] || BookOpen;
            return (
              <div
                key={sec.key}
                className="bg-card border border-border rounded-xl p-5 sm:p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">{sec.label}</h2>
                </div>
                <ul className="space-y-2">
                  {sec.topics.map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/docs/${sec.key}/${t.slug}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
