import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_LABELS: Record<string, string> = {
  home: "Cockpit",
  neurons: "Neurons",
  n: "Neuron",
  extractor: "Extractor",
  services: "Services",
  jobs: "Jobs",
  credits: "Credits",
  dashboard: "Dashboard",
  library: "Library",
  intelligence: "Intelligence",
  profile: "Profile",
  admin: "Admin",
  architecture: "Architecture",
  links: "Links",
  feedback: "Feedback",
  changelog: "Changelog",
  onboarding: "Onboarding",
  notifications: "Notifications",
  docs: "Docs",
  entities: "Entities",
  topics: "Topics",
  marketplace: "Marketplace",
  guests: "Guests",
  chat: "Chat",
  "media-profiles": "Media Profiles",
  pipeline: "Pipeline",
  "batch-runner": "Batch Runner",
  "prompt-forge": "Prompt Forge",
  "profile-extractor": "Profile Extractor",
  "workspace-settings": "Settings",
  "api-docs": "API Docs",
  "run-service": "Run Service",
  "topic-discovery": "Discovery",
};

export function AppBreadcrumbs() {
  const { pathname } = useLocation();

  // Don't show breadcrumbs on home
  if (pathname === "/home" || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || decodeURIComponent(seg).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    // Capitalize first letter for dynamic segments
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return { path, label: displayLabel, isLast };
  });

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/home" className="text-[11px]">Cockpit</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.path} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="text-[11px] max-w-[160px] truncate">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path} className="text-[11px]">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
