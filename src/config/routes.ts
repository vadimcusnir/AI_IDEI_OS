/**
 * ROUTES REGISTRY — Single Source of Truth for all app routes.
 * All components must import route paths from here.
 * No hardcoded href/to/navigate() paths allowed outside this file.
 */

// ═══ Public Routes ═══
export const ROUTES = {
  // Landing & auth
  LANDING: "/",
  AUTH: "/auth",
  RESET_PASSWORD: "/reset-password",

  // Content & knowledge (public)
  DOCS: "/docs",
  DOCS_TOPIC: (section: string, topic: string) => `/docs/${section}/${topic}`,
  CHANGELOG: "/changelog",
  BLOG: "/blog",
  BLOG_POST: (slug: string) => `/blog/${slug}`,
  
  // SEO entity pages
  KNOWLEDGE: (slug: string) => `/knowledge/${slug}`,
  INSIGHTS: (slug: string) => `/insights/${slug}`,
  PROFILES_PUBLIC: (slug: string) => `/profiles/${slug}`,
  PATTERNS: (slug: string) => `/patterns/${slug}`,
  FORMULAS: (slug: string) => `/formulas/${slug}`,
  CONTRADICTIONS: (slug: string) => `/contradictions/${slug}`,
  APPLICATIONS: (slug: string) => `/applications/${slug}`,
  TOPICS: (slug: string) => `/topics/${slug}`,
  ANALYSIS: (slug: string) => `/analysis/${slug}`,

  // Public profiles
  USER_PROFILE: (username: string) => `/u/${username}`,
  GUEST_PROFILE: (slug: string) => `/guest/${slug}`,

  // Marketplace & media (public)
  MARKETPLACE: "/marketplace",
  MARKETPLACE_DETAIL: (id: string) => `/marketplace/${id}`,
  MEDIA_PROFILES: "/media/profiles",
  MEDIA_PROFILE: (slug: string) => `/media/profiles/${slug}`,

  // Static pages
  PRICING: "/pricing",
  ABOUT: "/about",
  ABOUT_VADIM: "/about-vadim-cusnir",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  LINKS: "/links",
  ARCHITECTURE: "/architecture",

  // Services & pipeline (public catalog)
  SERVICES: "/services",
  SERVICES_CATALOG: "/services-catalog",
  PROGRAMS: "/programs",
  PIPELINE_OVERVIEW: "/pipeline-overview",
  PRODUCT: (slug: string) => `/products/${slug}`,

  // Community
  COMMUNITY: "/community",
  COMMUNITY_CATEGORY: (category: string) => `/community/${category}`,
  COMMUNITY_THREAD: (category: string, threadId: string) => `/community/${category}/thread/${threadId}`,

  // Payment
  PAYMENT_RESULT: "/payment/result",

  // ═══ Protected Routes ═══
  HOME: "/home",
  NEURONS: "/neurons",
  NEURON_NEW: "/n/new",
  NEURON_EDIT: (number: string | number) => `/n/${number}`,
  EXTRACTOR: "/extractor",
  RUN_SERVICE: (serviceKey: string) => `/run/${serviceKey}`,
  JOBS: "/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  BATCH: (neuronId: string) => `/batch/${neuronId}`,
  SERVICE_RESULTS: "/service-results",
  CREDITS: "/credits",
  LIBRARY: "/library",
  LIBRARY_DETAIL: (id: string) => `/library/${id}`,
  INTELLIGENCE: "/intelligence",
  PROMPT_FORGE: "/prompt-forge",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  FEEDBACK: "/feedback",
  GUESTS: "/guests",
  ONBOARDING: "/onboarding",
  DATA_PRIVACY: "/data-privacy",
  SECURITY_SETTINGS: "/security-settings",
  API_DOCS: "/api",
  WORKSPACE: "/workspace",
  VIP: "/vip",
  GAMIFICATION: "/gamification",
  PIPELINE: "/pipeline",
  INTEGRATIONS: "/integrations",
  COGNITIVE_UNITS: "/cognitive-units",
  COLLECTION_RUNS: "/collection-runs",
  MASTER_AGENT: "/master-agent",
  AUTOMATIONS: "/automations",
  MARKETPLACE_DRAFTS: "/marketplace/drafts",
  MARKETPLACE_EARNINGS: "/marketplace/earnings",

  // ═══ Admin Routes ═══
  ADMIN: "/admin",
  ADMIN_CONTROL_CENTER: "/admin/control-center",
  ADMIN_COST_ENGINE: "/admin/cost-engine",
  ADMIN_KERNEL: "/admin/kernel",
  ADMIN_DOMINATION: "/admin/domination",
  ADMIN_INEVITABILITY: "/admin/inevitability",
  ADMIN_FINANCIALIZATION: "/admin/financialization",
  ADMIN_REVENUE: "/admin/revenue",
  ADMIN_AUDIT_LOG: "/admin/audit-log",
  RUNTIME: "/runtime",
  ANALYTICS: "/analytics",
  SECURITY: "/security",
  DB_SCHEMA: "/db-schema",
} as const;

// ═══ Navigation Groups (for sidebar/footer) ═══

export const NAV_GROUPS = {
  platform: [
    { to: ROUTES.SERVICES, label: "Services" },
    { to: ROUTES.MARKETPLACE, label: "Marketplace" },
    { to: ROUTES.DOCS, label: "Documentation" },
    { to: ROUTES.CHANGELOG, label: "Changelog" },
    { to: ROUTES.BLOG, label: "Blog" },
    { to: ROUTES.PRICING, label: "Pricing" },
  ],
  about: [
    { to: ROUTES.ABOUT, label: "About AI-IDEI" },
    { to: ROUTES.ABOUT_VADIM, label: "About Vadim Cușnir" },
    { external: "https://cusnirvadim.com", label: "cusnirvadim.com" },
    { external: "https://notadoi.com", label: "Nota Doi" },
  ],
  legal: [
    { to: ROUTES.TERMS, label: "Terms of Service" },
    { to: ROUTES.PRIVACY, label: "Privacy Policy" },
    { to: ROUTES.DATA_PRIVACY, label: "Data Privacy" },
  ],
  community: [
    { to: ROUTES.COMMUNITY, label: "Forum" },
    { to: ROUTES.CHANGELOG, label: "Changelog" },
    { to: ROUTES.BLOG, label: "Blog" },
    { to: ROUTES.FEEDBACK, label: "Feedback" },
  ],
} as const;

// ═══ Legacy Route Redirects ═══
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/transcribe": ROUTES.EXTRACTOR,
  "/tools/vtt-validator": ROUTES.HOME,
  "/dashboard": ROUTES.HOME,
  "/profile-extractor": ROUTES.EXTRACTOR,
  "/chat": ROUTES.HOME,
  "/cusnir-os": ROUTES.HOME,
  "/cusnir-os/map": ROUTES.HOME,
  "/cusnir-os/architecture": ROUTES.HOME,
  "/cusnir-os/operator": ROUTES.ADMIN,
  "/wallet": ROUTES.CREDITS,
  "/data-pipeline": ROUTES.PIPELINE,
  "/kb": ROUTES.LIBRARY,
  "/notebooks": ROUTES.LIBRARY,
  "/capitalization": ROUTES.MARKETPLACE,
  "/headline-generator": ROUTES.HOME,
};
