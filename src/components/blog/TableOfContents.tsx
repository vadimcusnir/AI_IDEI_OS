import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface Heading { id: string; text: string; level: number; }

/** Extracts headings from rendered article body and renders sticky TOC with scroll-spy. */
export function TableOfContents({ containerSelector = ".article-body" }: { containerSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3")) as HTMLElement[];
    const items: Heading[] = nodes.map((node) => {
      const text = node.textContent?.trim() || "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `h-${Math.random().toString(36).slice(2, 8)}`;
      node.id = id;
      return { id, text, level: node.tagName === "H2" ? 2 : 3 };
    });
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [containerSelector]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="hidden xl:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 text-[0.6875rem] uppercase tracking-widest font-semibold text-muted-foreground">
        <List className="w-3 h-3" /> On this page
      </div>
      <ul className="space-y-1.5 border-l border-border/60">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.25rem" : "0.75rem" }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "block text-xs leading-snug py-1 -ml-px border-l-2 pl-3 transition-colors",
                activeId === h.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
