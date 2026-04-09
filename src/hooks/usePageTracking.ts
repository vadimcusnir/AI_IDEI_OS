/**
 * Hook for automatic page view tracking.
 * Drop into any page to track views.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";

export function usePageTracking(pageName?: string) {
  const location = useLocation();

  useEffect(() => {
    // GA4 page_view
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: location.pathname,
        page_title: document.title,
      });
    }

    // Internal analytics
    trackInternalEvent({
      event: AnalyticsEvents.PAGE_VIEW,
      params: {
        page_name: pageName || location.pathname,
        referrer: document.referrer || undefined,
      },
      pagePath: location.pathname,
    });
  }, [location.pathname, pageName]);
}
