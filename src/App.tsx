import { lazy, Suspense, useEffect } from "react";
import { prefetchCriticalRoutes } from "@/lib/prefetch";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyMotion, domAnimation } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";

// Non-critical components — lazy-loaded to reduce main-thread work at startup
const CookieConsent = lazy(() => import("@/components/global/CookieConsent").then(m => ({ default: m.CookieConsent })));
const GrowthHooks = lazy(() => import("@/components/growth/GrowthHooks").then(m => ({ default: m.GrowthHooks })));
const PostAuthRedirector = lazy(() => import("@/components/PostAuthRedirector").then(m => ({ default: m.PostAuthRedirector })));

import { publicRoutes } from "@/routes/publicRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";
import { adminRoutes } from "@/routes/adminRoutes";

function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const NotFound = lazyRetry(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  useEffect(() => { prefetchCriticalRoutes(); }, []);
  return (
  <LazyMotion features={domAnimation} strict>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <ScrollToTop />
              <Suspense fallback={null}><GrowthHooks /></Suspense>
              <Suspense fallback={null}><PostAuthRedirector /></Suspense>
              <Routes>
                {publicRoutes()}
                {protectedRoutes()}
                {adminRoutes()}

                {/* Catch-all */}
                <Route path="*" element={<AppLayout><ErrorBoundary fallbackTitle="Page not found"><NotFound /></ErrorBoundary></AppLayout>} />
              </Routes>
            </Suspense>
            <Suspense fallback={null}><CookieConsent /></Suspense>
          </BrowserRouter>
        </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </LazyMotion>
  );
};

export default App;
