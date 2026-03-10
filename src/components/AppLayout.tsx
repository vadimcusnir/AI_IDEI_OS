import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FeedbackFAB } from "@/components/feedback/FeedbackFAB";

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
    </div>
  );
}
