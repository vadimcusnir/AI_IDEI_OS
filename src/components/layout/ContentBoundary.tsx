import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContentBoundaryProps {
  children: ReactNode;
  className?: string;
  /** Use "narrow" for article/docs (max-w-3xl), "default" for pages (max-w-5xl), "wide" for dashboards (max-w-7xl) */
  width?: "narrow" | "default" | "wide";
  /** Remove horizontal padding (e.g. for nested usage) */
  noPadding?: boolean;
  as?: "div" | "section" | "article" | "main";
}

/**
 * ContentBoundary — canonical container for all readable content.
 * xs/sm: w=100%, px=16
 * md: px=24
 * lg: px=32
 * xl: px=40
 * Text never goes full-width. Background can.
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
        !noPadding && "px-4 sm:px-6 md:px-6 lg:px-8 xl:px-10",
        width === "narrow" && "max-w-3xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-7xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
