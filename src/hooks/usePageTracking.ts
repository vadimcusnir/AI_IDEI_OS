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
