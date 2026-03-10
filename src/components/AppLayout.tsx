import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FeedbackFAB } from "@/components/feedback/FeedbackFAB";
import { ContextualFeedbackPrompt } from "@/components/feedback/ContextualFeedbackPrompt";
import { GlobalSearch } from "@/components/GlobalSearch";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact top bar with sidebar trigger */}
          <header className="sticky top-0 z-40 h-10 flex items-center border-b border-border bg-background/80 backdrop-blur-md px-3 gap-2">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
      <FeedbackFAB />
      <ContextualFeedbackPrompt />
    </SidebarProvider>
  );
}
