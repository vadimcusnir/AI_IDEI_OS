import { lazy, Suspense, type ComponentType, type ReactElement } from "react";
import { Loader2 } from "lucide-react";

export function withLazyFallback<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  FallbackComponent?: ComponentType
) {
  const LazyComponent = lazy(importFn);
  return function LazyWrapper(props: T): ReactElement {
    return (
      <Suspense fallback={FallbackComponent || <DefaultLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export function DefaultLoader() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

export function LandingSectionSkeleton() {
  return <div className="animate-pulse"><div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" /><div className="h-4 bg-muted rounded w-2/3 mx-auto mb-8" /><div className="grid grid-cols-3 gap-4"><div className="h-32 bg-muted rounded" /><div className="h-32 bg-muted rounded" /><div className="h-32 bg-muted rounded" /></div></div>;
}

export function ChartSkeleton() {
  return <div className="animate-pulse p-4"><div className="h-6 bg-muted rounded w-1/4 mb-4" /><div className="h-64 bg-muted rounded" /></div>;
}

export function GraphSkeleton() {
  return <div className="animate-pulse p-4"><div className="h-6 bg-muted rounded w-1/3 mb-4" /><div className="h-80 bg-muted rounded" /></div>;
}

export const LazyLandingHero = withLazyFallback(() => import("@/components/landing/LandingHero").then(m => ({ default: m.LandingHero })), LandingSectionSkeleton);
export const LazyTransformationDiagram = withLazyFallback(() => import("@/components/landing/TransformationDiagram").then(m => ({ default: m.TransformationDiagram })), LandingSectionSkeleton);
export const LazyLandingPricing = withLazyFallback(() => import("@/components/landing/LandingPricing").then(m => ({ default: m.LandingPricing })), LandingSectionSkeleton);
export const LazyPublicTestimonials = withLazyFallback(() => import("@/components/landing/PublicTestimonials").then(m => ({ default: m.PublicTestimonials })), LandingSectionSkeleton);
export const LazyLandingOutputGalaxy = withLazyFallback(() => import("@/components/landing/LandingOutputGalaxy").then(m => ({ default: m.LandingOutputGalaxy })), LandingSectionSkeleton);
export const LazyLandingMechanism = withLazyFallback(() => import("@/components/landing/LandingMechanism").then(m => ({ default: m.LandingMechanism })), LandingSectionSkeleton);
export const LazyExtractionEngine = withLazyFallback(() => import("@/components/landing/ExtractionEngine").then(m => ({ default: m.ExtractionEngine })), LandingSectionSkeleton);
export const LazyKnowledgeGraph = withLazyFallback(() => import("@/components/intelligence/KnowledgeGraph").then(m => ({ default: m.KnowledgeGraph })), GraphSkeleton);
export const LazyConsumptionChart = withLazyFallback(() => import("@/components/credits/ConsumptionChart").then(m => ({ default: m.ConsumptionChart })), ChartSkeleton);
export const LazyServiceCompareDrawer = withLazyFallback(() => import("@/components/services/ServiceCompareDrawer").then(m => ({ default: m.ServiceCompareDrawer })), DefaultLoader);
export const LazyAchievementGallery = withLazyFallback(() => import("@/components/gamification/AchievementGallery").then(m => ({ default: m.AchievementGallery })), LandingSectionSkeleton);
