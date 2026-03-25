import type { TooltipStep } from "@/components/onboarding/GuidedTooltip";

/** Tour definitions for key platform pages */

export const HOME_TOUR: TooltipStep[] = [
  {
    target: "[data-tour='command-input']",
    title: "Command Center",
    description: "Type what you want to achieve. The AI agent will create an execution plan automatically.",
    position: "top",
  },
  {
    target: "[data-tour='intent-chips']",
    title: "Quick Intents",
    description: "Click a suggested intent to get started quickly — extract neurons, generate content, analyze patterns.",
    position: "top",
  },
  {
    target: "[data-tour='workspace-tabs']",
    title: "Workspace Layers",
    description: "Switch between Execute, Explore, and Build modes depending on your current task.",
    position: "bottom",
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
