/**
 * CommandRouter — Parses user input, detects intent, maps to agents/services,
 * enforces permission gates and produces a structured CommandIntent.
 *
 * This is the "brain" between the input box and the planner/orchestrator.
 * User → CommandRouter → Plan → Economic Gate → Execution
 */

import type { UserTier } from "@/hooks/useUserTier";

/* ═══ Types ═══ */

export type IntentCategory =
  | "analyze"
  | "extract"
  | "generate"
  | "search"
  | "compare"
  | "profile"
  | "pipeline"
  | "status"
  | "help"
  | "conversation";

export type InputType = "text" | "url" | "file" | "slash_command" | "template";

export interface DetectedInput {
  type: InputType;
  raw: string;
  urls: string[];
  fileNames: string[];
  slashCommand: string | null;
  templateId: string | null;
}

export interface CommandIntent {
  category: IntentCategory;
  confidence: number;
  suggestedServices: string[];
  requiredTier: UserTier;
  estimatedCredits: number;
  label: string;
  description: string;
  blocked: boolean;
  blockReason: string | null;
}

export interface RouteResult {
  input: DetectedInput;
  intent: CommandIntent;
  permitted: boolean;
  permissionMessage: string | null;
}

/* ═══ Intent Definitions ═══ */

interface IntentPattern {
  category: IntentCategory;
  keywords: string[];
  slashCommands: string[];
  services: string[];
  requiredTier: UserTier;
  baseCredits: number;
  label: string;
  description: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    category: "analyze",
    keywords: ["analizează", "analyze", "analyse", "review", "evaluate", "audit", "examine", "inspectează"],
    slashCommands: ["/analyze", "/analyse", "/review", "/audit"],
    services: ["content-classifier", "argument-mapper", "tone-of-voice-analyzer"],
    requiredTier: "authenticated",
    baseCredits: 200,
    label: "Deep Analysis",
    description: "Analyze content for insights, patterns, and frameworks",
  },
  {
    category: "extract",
    keywords: ["extrage", "extract", "neurons", "neuroni", "insights", "framework", "pattern", "identifică"],
    slashCommands: ["/extract", "/neurons", "/insights"],
    services: ["insight-extractor", "framework-detector", "quote-extractor"],
    requiredTier: "authenticated",
    baseCredits: 350,
    label: "Knowledge Extraction",
    description: "Extract neurons, frameworks, and patterns from content",
  },
  {
    category: "generate",
    keywords: ["generează", "generate", "create", "write", "scrie", "produce", "build", "construiește", "article", "post", "content"],
    slashCommands: ["/generate", "/create", "/write"],
    services: ["seo-article", "newsletter-generator", "social-carousel"],
    requiredTier: "authenticated",
    baseCredits: 150,
    label: "Content Generation",
    description: "Generate articles, posts, scripts, and other content",
  },
  {
    category: "search",
    keywords: ["caută", "search", "find", "găsește", "show", "arată", "list", "listează"],
    slashCommands: ["/search", "/find", "/list"],
    services: [],
    requiredTier: "authenticated",
    baseCredits: 20,
    label: "Knowledge Search",
    description: "Search through neurons, episodes, and knowledge base",
  },
  {
    category: "compare",
    keywords: ["compară", "compare", "diff", "versus", "vs", "diferență"],
    slashCommands: ["/compare", "/diff"],
    services: ["competitor-analysis", "argument-mapper"],
    requiredTier: "pro",
    baseCredits: 400,
    label: "Comparative Analysis",
    description: "Compare documents, ideas, or frameworks side-by-side",
  },
  {
    category: "profile",
    keywords: ["profil", "profile", "guest", "speaker", "expert", "psychological", "psihologic"],
    slashCommands: ["/profile", "/guest"],
    services: ["profile-extractor", "audience-avatar"],
    requiredTier: "pro",
    baseCredits: 500,
    label: "Intelligence Profile",
    description: "Build psychological and expertise profiles from content",
  },
  {
    category: "pipeline",
    keywords: ["pipeline", "workflow", "batch", "bulk", "automat", "automate", "chain", "rulează workflow",
      "agent", "swarm", "narrative domination", "viral structure", "influence graph", "offer multiplication",
      "pricing intelligence", "funnel autogenerator", "stepback", "knowledge arbitrage", "reputation",
      "behavioral leverage", "identity simulation", "os agent", "rulează agent", "run agent"],
    slashCommands: ["/pipeline", "/workflow", "/batch", "/agent", "/swarm"],
    services: ["insight-extractor", "framework-detector"],
    requiredTier: "pro",
    baseCredits: 800,
    label: "Agent / Pipeline Execution",
    description: "Execute OS agents or multi-step automation workflows",
  },
  {
    category: "status",
    keywords: ["status", "balance", "credits", "balanță", "cont", "account", "stats"],
    slashCommands: ["/status", "/balance", "/credits"],
    services: [],
    requiredTier: "free",
    baseCredits: 0,
    label: "Status Check",
    description: "View account status, balance, and statistics",
  },
  {
    category: "help",
    keywords: ["help", "ajutor", "cum", "how", "what", "ce", "explain", "explică"],
    slashCommands: ["/help", "/info"],
    services: [],
    requiredTier: "free",
    baseCredits: 0,
    label: "Help",
    description: "Get help with commands and platform features",
  },
];

/* ═══ Tier Ordering ═══ */

const TIER_ORDER: Record<UserTier, number> = {
  free: 0,
  authenticated: 1,
  pro: 2,
  vip: 3,
};

/* ═══ URL Detection ═══ */

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i;

/* ═══ Core Router ═══ */

export function parseInput(raw: string, fileNames: string[] = []): DetectedInput {
  const trimmed = raw.trim();
  const urls = trimmed.match(URL_REGEX) || [];
  const slashMatch = trimmed.match(/^\/(\w+)/);

  // Check template reference
  const templateMatch = trimmed.match(/\(using template:\s*(.+?)\)/);

  return {
    type: slashMatch ? "slash_command"
      : templateMatch ? "template"
      : urls.length > 0 ? "url"
      : fileNames.length > 0 ? "file"
      : "text",
    raw: trimmed,
    urls,
    fileNames,
    slashCommand: slashMatch ? `/${slashMatch[1]}` : null,
    templateId: templateMatch ? templateMatch[1] : null,
  };
}

export function detectIntent(input: DetectedInput): CommandIntent {
  const text = input.raw.toLowerCase();

  // Slash command match — highest priority
  if (input.slashCommand) {
    for (const pattern of INTENT_PATTERNS) {
      if (pattern.slashCommands.includes(input.slashCommand.toLowerCase())) {
        return buildIntent(pattern, 0.95);
      }
    }
  }

  // Keyword scoring
  let bestMatch: IntentPattern | null = null;
  let bestScore = 0;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (text.includes(kw)) score += 1;
    }
    // Bonus for URL input + analyze intent
    if (input.urls.length > 0 && pattern.category === "analyze") score += 0.5;
    if (input.urls.some(u => YOUTUBE_REGEX.test(u)) && pattern.category === "extract") score += 0.5;
    // Bonus for file input + extract intent
    if (input.fileNames.length > 0 && pattern.category === "extract") score += 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && bestScore >= 1) {
    const confidence = Math.min(0.95, 0.5 + bestScore * 0.15);
    return buildIntent(bestMatch, confidence);
  }

  // Default: conversation
  return {
    category: "conversation",
    confidence: 0.6,
    suggestedServices: [],
    requiredTier: "free",
    estimatedCredits: 10,
    label: "Conversation",
    description: "General conversation with the AI assistant",
    blocked: false,
    blockReason: null,
  };
}

function buildIntent(pattern: IntentPattern, confidence: number): CommandIntent {
  return {
    category: pattern.category,
    confidence,
    suggestedServices: pattern.services,
    requiredTier: pattern.requiredTier,
    estimatedCredits: pattern.baseCredits,
    label: pattern.label,
    description: pattern.description,
    blocked: false,
    blockReason: null,
  };
}

export function routeCommand(
  raw: string,
  userTier: UserTier,
  balance: number,
  fileNames: string[] = [],
): RouteResult {
  const input = parseInput(raw, fileNames);
  const intent = detectIntent(input);

  // Permission check
  const userLevel = TIER_ORDER[userTier];
  const requiredLevel = TIER_ORDER[intent.requiredTier];
  const permitted = userLevel >= requiredLevel;

  // Balance check
  if (permitted && balance < intent.estimatedCredits && intent.estimatedCredits > 0) {
    intent.blocked = true;
    intent.blockReason = `Insufficient balance: ${balance} N available, ~${intent.estimatedCredits} N required`;
  }

  return {
    input,
    intent,
    permitted,
    permissionMessage: permitted
      ? null
      : `This action requires ${intent.requiredTier} access. Your current tier: ${userTier}.`,
  };
}

/* ═══ Service Key Mapping ═══ */

export function getServicesForIntent(category: IntentCategory): string[] {
  const pattern = INTENT_PATTERNS.find(p => p.category === category);
  return pattern?.services || [];
}

export function getIntentLabel(category: IntentCategory): string {
  const pattern = INTENT_PATTERNS.find(p => p.category === category);
  return pattern?.label || category;
}
