import type { TooltipStep } from "@/components/onboarding/GuidedTooltip";

/** Tour definitions for key platform pages */

export const HOME_TOUR: TooltipStep[] = [
  {
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    description: "Start here — upload content, run services, or explore your knowledge library.",
    position: "bottom",
  },
  {
    target: "[data-tour='stats-overview']",
    title: "Your Stats",
    description: "Track neurons, credits, and extraction activity at a glance.",
    position: "bottom",
  },
  {
    target: "[data-tour='recent-activity']",
    title: "Recent Activity",
    description: "Your latest extractions and service runs appear here.",
    position: "top",
  },
];

export const EXTRACTOR_TOUR: TooltipStep[] = [
  {
    target: "[data-tour='upload-zone']",
    title: "Upload Content",
    description: "Paste a YouTube URL, upload audio/video, or enter text to begin extraction.",
    position: "bottom",
  },
  {
    target: "[data-tour='episode-list']",
    title: "Your Episodes",
    description: "All uploaded content appears here. Click to expand and run extraction services.",
    position: "top",
  },
];

export const SERVICES_TOUR: TooltipStep[] = [
  {
    target: "[data-tour='service-search']",
    title: "Find Services",
    description: "Search 120+ AI services by name or keyword. Each transforms your content into deliverables.",
    position: "bottom",
  },
  {
    target: "[data-tour='intent-tabs']",
    title: "Browse by Intent",
    description: "Services are grouped by goal: Attract, Educate, Sell, Convert.",
    position: "bottom",
  },
];
