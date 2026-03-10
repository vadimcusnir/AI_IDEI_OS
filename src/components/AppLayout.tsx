import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FeedbackFAB } from "@/components/feedback/FeedbackFAB";
import { ContextualFeedbackPrompt } from "@/components/feedback/ContextualFeedbackPrompt";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Footer } from "@/components/global/Footer";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  /** If true, the content uses full viewport height (no footer, no scroll header). E.g. NeuronEditor */
  fullHeight?: boolean;
}

export function AppLayout({ children, fullHeight = false }: AppLayoutProps) {
  const { direction, isAtTop } = useScrollDirection();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-first scroll-aware header */}
          <header
            className={cn(
              "sticky top-0 z-40 h-[var(--header-height)] flex items-center border-b border-border bg-background/90 backdrop-blur-md px-3 gap-2 transition-transform duration-200",
              // On mobile: hide header on scroll down, show on scroll up
              "md:translate-y-0",
              direction === "down" && !isAtTop
                ? "-translate-y-full md:translate-y-0"
                : "translate-y-0"
            )}
          >
            <SidebarTrigger />
            <div className="flex-1" />
            <GlobalSearch />
          </header>

          {fullHeight ? (
            <main className="flex-1 flex flex-col min-h-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          ) : (
            <>
              <main className="flex-1 flex flex-col">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <Footer />
            </>
          )}
        </div>
      </div>
      <FeedbackFAB />
      <ContextualFeedbackPrompt />
    </SidebarProvider>
  );
}
