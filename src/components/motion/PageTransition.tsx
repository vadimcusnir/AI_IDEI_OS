import { ReactNode } from "react";

/**
 * PageTransition — now instant (no layout shifts).
 * All translateY animations removed to prevent "floating" UI.
 */

/** Wraps a page — renders instantly, no animation */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Container that renders children instantly */
export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Individual stagger item — renders instantly */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Fade-in on scroll — opacity only, no vertical movement */
export function FadeInView({ children, className }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}

/** Legacy exports for compatibility */
export const pageVariants = {};
export const staggerContainer = {};
export const staggerItem = {};
