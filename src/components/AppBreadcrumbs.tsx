import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

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
  workspace: "Workspace Settings",
  api: "API & Webhooks",
  "data-privacy": "Data Privacy",
  run: "Run Service",
  community: "Community",
  insights: "Insights",
  patterns: "Patterns",
  formulas: "Formulas",
  contradictions: "Contradictions",
  applications: "Applications",
  profiles: "Profiles",
  media: "Media",
  discovery: "Discovery",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  knowledge: "Knowledge Base",
  kb: "Knowledge Base",
  batch: "Batch Runner",
  pricing: "Pricing",
  // Previously missing labels
  gamification: "Progress",
  wallet: "Usage",
  vip: "VIP Dashboard",
  "cusnir-os": "Cusnir_OS",
  "data-pipeline": "Data Pipeline",
  "master-agent": "Master Agent",
  programs: "Programs",
  "services-catalog": "Service Catalog",
  runtime: "Runtime",
  analytics: "Analytics",
  about: "About",
  "about-vadim-cusnir": "Vadim Cușnir",
  blog: "Blog",
  "security-settings": "Security",
  integrations: "Integrations",
  "cognitive-units": "Cognitive Units",
  "collection-runs": "Collection Runs",
  notebooks: "Notebooks",
  notebook: "Notebook",
  capitalization: "Capitalization",
  "headline-generator": "Headline Generator",
  automations: "Automations",
  "payment": "Payment",
  "db-schema": "DB Schema",
  security: "Security",
  kernel: "Kernel",
};

export function AppBreadcrumbs() {
  const { pathname } = useLocation();

  // Don't show breadcrumbs on home
  if (pathname === "/home" || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    let path = "/" + segments.slice(0, i + 1).join("/");
    // /n is not a valid route — redirect breadcrumb to /neurons
    if (path === "/n") path = "/neurons";
    const label = ROUTE_LABELS[seg] || decodeURIComponent(seg).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    // Capitalize first letter for dynamic segments
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return { path, label: displayLabel, isLast };
  });

  const breadcrumbItems = [
    { name: "Cockpit", url: "https://ai-idei.com/home" },
    ...crumbs.map(c => ({ name: c.label, url: `https://ai-idei.com${c.path}` })),
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/home" className="text-dense">Cockpit</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb) => (
            <Fragment key={crumb.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage className="text-dense max-w-[160px] truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path} className="text-dense">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
