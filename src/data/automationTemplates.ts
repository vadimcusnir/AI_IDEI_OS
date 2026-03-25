/**
 * P3-010: Zapier/Make Automation Templates
 * Returns pre-built automation templates for common AI-IDEI workflows.
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  platform: "zapier" | "make" | "both";
  category: string;
  trigger: {
    app: string;
    event: string;
    description: string;
  };
  actions: Array<{
    app: string;
    action: string;
    description: string;
  }>;
  useCase: string;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ── Content Ingestion ──
  {
    id: "yt-to-neurons",
    name: "YouTube → Knowledge Extraction",
    description: "When a new video is published on your channel, automatically extract neurons and create knowledge assets.",
    platform: "both",
    category: "ingestion",
    trigger: { app: "YouTube", event: "New Video Published", description: "Monitors your channel for new uploads" },
    actions: [
      { app: "AI-IDEI", action: "Ingest Document", description: "Send video URL to ingestion pipeline" },
      { app: "AI-IDEI", action: "Run Extraction", description: "Execute NEP-120 extraction on transcript" },
      { app: "Slack", action: "Send Message", description: "Notify team when extraction completes" },
    ],
    useCase: "Content creators who publish regularly and want automatic knowledge base building.",
  },
  {
    id: "notion-sync",
    name: "Notion → Knowledge Sync",
    description: "Sync updated Notion pages to AI-IDEI for continuous knowledge extraction.",
    platform: "zapier",
    category: "ingestion",
    trigger: { app: "Notion", event: "Page Updated", description: "Detects changes in specified Notion database" },
    actions: [
      { app: "AI-IDEI", action: "Webhook Ingest", description: "Send page content via webhook" },
      { app: "AI-IDEI", action: "Create Neuron", description: "Generate structured neuron from content" },
    ],
    useCase: "Teams using Notion as primary knowledge base.",
  },
  // ── Distribution ──
  {
    id: "neuron-to-social",
    name: "New Neuron → Social Media",
    description: "When a high-score neuron is created, generate and publish social media posts.",
    platform: "both",
    category: "distribution",
    trigger: { app: "AI-IDEI", event: "Neuron Created", description: "Triggers on new neuron with score > 8" },
    actions: [
      { app: "AI-IDEI", action: "Run Service", description: "Generate social media pack from neuron" },
      { app: "Buffer", action: "Create Post", description: "Schedule posts across platforms" },
      { app: "Google Sheets", action: "Add Row", description: "Log distribution event" },
    ],
    useCase: "Thought leaders wanting automated content distribution.",
  },
  {
    id: "artifact-to-newsletter",
    name: "Weekly Artifact Digest → Newsletter",
    description: "Every week, compile top artifacts into a newsletter draft.",
    platform: "both",
    category: "distribution",
    trigger: { app: "Schedule", event: "Every Week", description: "Runs on Monday at 9 AM" },
    actions: [
      { app: "AI-IDEI", action: "List Artifacts", description: "Fetch artifacts from last 7 days" },
      { app: "AI-IDEI", action: "Run Service", description: "Generate newsletter from top artifacts" },
      { app: "Mailchimp", action: "Create Campaign", description: "Create draft newsletter campaign" },
    ],
    useCase: "Newsletter creators wanting automated content curation.",
  },
  // ── Monitoring ──
  {
    id: "job-failure-alert",
    name: "Job Failure → Alert",
    description: "Alert team immediately when an extraction job fails after all retries.",
    platform: "both",
    category: "monitoring",
    trigger: { app: "AI-IDEI", event: "Job Failed", description: "Fires when job enters dead_letter status" },
    actions: [
      { app: "Slack", action: "Send Message", description: "Post failure details to #alerts channel" },
      { app: "PagerDuty", action: "Create Incident", description: "Escalate critical failures" },
    ],
    useCase: "Teams needing reliability monitoring for production workloads.",
  },
  {
    id: "credit-low-alert",
    name: "Low Credits → Top-up Reminder",
    description: "Send notification when credit balance drops below threshold.",
    platform: "zapier",
    category: "monitoring",
    trigger: { app: "AI-IDEI", event: "Credit Balance Low", description: "Triggers at < 100 neurons remaining" },
    actions: [
      { app: "Email", action: "Send Email", description: "Send top-up reminder with purchase link" },
      { app: "Slack", action: "Send DM", description: "Direct message to user with balance info" },
    ],
    useCase: "Users who don't want service interruptions.",
  },
  // ── Analytics ──
  {
    id: "weekly-analytics",
    name: "Weekly Analytics → Google Sheets",
    description: "Export weekly platform analytics to a Google Sheet for tracking.",
    platform: "both",
    category: "analytics",
    trigger: { app: "Schedule", event: "Every Week", description: "Runs on Sunday at midnight" },
    actions: [
      { app: "AI-IDEI", action: "API v2 Query", description: "Fetch neuron/artifact/credit stats" },
      { app: "Google Sheets", action: "Add Row", description: "Append weekly metrics to tracking sheet" },
    ],
    useCase: "Data-driven teams tracking knowledge production KPIs.",
  },
  // ── Marketplace ──
  {
    id: "asset-sale-notification",
    name: "Asset Sold → Revenue Tracking",
    description: "When a marketplace asset sells, log revenue and notify creator.",
    platform: "both",
    category: "marketplace",
    trigger: { app: "AI-IDEI", event: "Asset Purchased", description: "Fires on marketplace transaction" },
    actions: [
      { app: "Google Sheets", action: "Add Row", description: "Log sale to revenue tracking sheet" },
      { app: "Email", action: "Send Email", description: "Congratulate creator with sale details" },
      { app: "Slack", action: "Send Message", description: "Post sale to #revenue channel" },
    ],
    useCase: "Creators monetizing knowledge assets on the marketplace.",
  },
];

/** Get templates filtered by platform and/or category */
export function getTemplates(filters?: {
  platform?: "zapier" | "make";
  category?: string;
}): AutomationTemplate[] {
  let results = [...AUTOMATION_TEMPLATES];
  if (filters?.platform) {
    results = results.filter(
      (t) => t.platform === filters.platform || t.platform === "both"
    );
  }
  if (filters?.category) {
    results = results.filter((t) => t.category === filters.category);
  }
  return results;
}
