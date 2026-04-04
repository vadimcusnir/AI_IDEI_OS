/**
 * MobilePageTitle — Shows current page name in the mobile top bar.
 * Lightweight: just reads location and maps to a label.
 */
import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/home": "Cockpit",
  "/pipeline": "Pipeline",
  "/library": "Library",
  "/jobs": "Jobs",
  "/credits": "Credits",
  "/wallet": "Wallet",
  "/services": "Services",
  "/neurons": "Neurons",
  "/intelligence": "Knowledge Graph",
  "/marketplace": "Marketplace",
  "/gamification": "Progress",
  "/vip": "VIP",
  "/integrations": "Integrations",
  "/profile": "Profile",
  "/workspace": "Settings",
  "/admin": "Admin",
  "/analytics": "Analytics",
  "/runtime": "Runtime",
  "/docs": "Docs",
  "/blog": "Blog",
  "/pricing": "Pricing",
  "/about": "About",
  "/data-privacy": "Privacy",
  "/notifications": "Notifications",
};

export function MobilePageTitle() {
  const { pathname } = useLocation();

  // Try exact match first, then prefix match
  let title = ROUTE_TITLES[pathname];
  if (!title) {
    const match = Object.entries(ROUTE_TITLES).find(([path]) =>
      pathname.startsWith(path + "/")
    );
    title = match?.[1] || "";
  }

  if (!title) return null;

  return (
    <h1 className="text-sm font-semibold text-foreground truncate">
      {title}
    </h1>
  );
}
