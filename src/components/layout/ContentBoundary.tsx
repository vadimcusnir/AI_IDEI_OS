import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContentBoundaryProps {
  children: ReactNode;
  className?: string;
  /** "narrow" for article/docs (~740px), "default" for pages (~1000px), "wide" for dashboards (~1160px) */
  width?: "narrow" | "default" | "wide";
  /** Remove horizontal padding (e.g. for nested usage) */
  noPadding?: boolean;
  as?: "div" | "section" | "article" | "main";
}

/**
 * ContentBoundary — canonical container for all readable content.
 * MOBILE-FIRST CANON v2.0:
 *   xs/sm: w=100%, px=16 (1rem)
 *   md:    px=24 (1.5rem)
 *   lg:    px=32 (2rem)
 *   xl:    px=40 (2.5rem)
 * Text never goes full-width. Background can.
 *
 * Max-widths (canon spec):
 *   narrow:  46.25rem (740px)  — articles, docs
 *   default: 62.5rem  (1000px) — standard pages
 *   wide:    72.5rem  (1160px) — dashboards
 */
export function ContentBoundary({
  children,
  className,
  width = "default",
  noPadding = false,
  as: Tag = "div",
}: ContentBoundaryProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        !noPadding && "px-4 md:px-6 lg:px-8 xl:px-10",
        width === "narrow" && "max-w-[46.25rem]",
        width === "default" && "max-w-[62.5rem]",
        width === "wide" && "max-w-[72.5rem]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
