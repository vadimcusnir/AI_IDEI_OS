/**
 * MobilePageTitle — Shows current page name in the mobile top bar.
 * Reads route → maps to navigation i18n key → renders translated label.
 */
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Map of pathname → navigation:items.<key> i18n key
const ROUTE_TO_KEY: Record<string, string> = {
  "/home": "command_center",
  "/pipeline": "pipeline",
  "/library": "library",
  "/jobs": "jobs",
  "/credits": "credits",
  "/wallet": "credits",
  "/services": "services",
  "/neurons": "neurons",
  "/intelligence": "knowledge_graph",
  "/marketplace": "marketplace",
  "/purchases": "purchases",
  "/gamification": "progress",
  "/learning": "learning",
  "/deliverables": "deliverables",
  "/vip": "vip_program",
  "/integrations": "integrations",
  "/personal-os": "personal_os",
  "/augmentation": "augmentation",
  "/workspace": "workspace",
  "/admin": "admin_dashboard",
  "/admin/control-center": "control_center",
  "/admin/cost-engine": "cost_engine",
  "/admin/kernel": "kernel",
  "/runtime": "runtime",
  "/analytics": "analytics",
  "/services-catalog": "catalog",
  "/my-analytics": "my_analytics",
};

// Fallback labels for routes without a navigation entry
const FALLBACK_TITLES: Record<string, string> = {
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/docs": "Docs",
  "/blog": "Blog",
  "/pricing": "Pricing",
  "/about": "About",
  "/data-privacy": "Privacy",
};

export function MobilePageTitle() {
  const { pathname } = useLocation();
  const { t } = useTranslation("navigation");

  // Try exact match, then prefix match
  const matchKey =
    ROUTE_TO_KEY[pathname] ||
    Object.entries(ROUTE_TO_KEY).find(([p]) => pathname.startsWith(p + "/"))?.[1];

  let title = "";
  if (matchKey) {
    title = t(`items.${matchKey}`, { defaultValue: "" });
  }
  if (!title) {
    title =
      FALLBACK_TITLES[pathname] ||
      Object.entries(FALLBACK_TITLES).find(([p]) => pathname.startsWith(p + "/"))?.[1] ||
      "";
  }

  if (!title) return null;

  return (
    <h1 className="text-sm font-semibold text-foreground truncate">
      {title}
    </h1>
  );
}
