/**
 * LandingDotNav — Fixed-right vertical dot navigation for landing sections.
 * Desktop only (lg+). Tracks active section via IntersectionObserver.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DotItem {
  id: string;
  label: string;
}

interface Props {
  items: DotItem[];
}

export function LandingDotNav({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const elements = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Page sections"
      className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3"
    >
      {items.map((it) => {
        const isActive = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => scrollTo(it.id)}
            className="group relative flex items-center justify-end h-3 focus-ring rounded-full"
            aria-label={`Go to ${it.label}`}
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={cn(
                "absolute right-6 px-2 py-0.5 rounded text-[10px] font-mono tracking-[0.18em] uppercase",
                "bg-background/80 backdrop-blur border border-border/40 text-muted-foreground",
                "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none",
                isActive && "text-gold"
              )}
            >
              {it.label}
            </span>
            <span
              className={cn(
                "block rounded-full transition-all duration-300",
                isActive
                  ? "h-3 w-3 bg-gold ring-2 ring-gold/30"
                  : "h-1.5 w-1.5 bg-muted-foreground/40 group-hover:bg-gold/70"
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
