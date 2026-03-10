import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FeedbackFAB } from "@/components/feedback/FeedbackFAB";
import { ContextualFeedbackPrompt } from "@/components/feedback/ContextualFeedbackPrompt";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <FeedbackFAB />
      <ContextualFeedbackPrompt />
    </div>
  );
}
