export interface DocTopic {
  title: string;
  content: string;
}

export interface DocSection {
  key: string;
  label: string;
  icon: string;
  topics: { slug: string; title: string }[];
}

export const DOCS_SECTIONS: DocSection[] = [
  {
    key: "getting-started",
    label: "Getting Started",
    icon: "Rocket",
    topics: [
      { slug: "introduction", title: "What is AI-IDEI?" },
      { slug: "how-it-works", title: "How It Works" },
      { slug: "your-first-neuron", title: "Your First Neuron" },
      { slug: "credits-system", title: "Credits & Pricing" },
    ],
  },
  {
    key: "foundation",
    label: "Foundation",
    icon: "BookOpen",
    topics: [
      { slug: "what-is-ai-idei", title: "Knowledge as Infrastructure" },
      { slug: "neuron-model", title: "The Neuron Model" },
      { slug: "intelligence-assets", title: "Intelligence Assets" },
    ],
  },
  {
    key: "pipeline",
    label: "Pipeline",
    icon: "Layers",
    topics: [
      { slug: "transcript-refinery", title: "Transcript Refinery" },
      { slug: "signal-extraction", title: "Signal Extraction" },
      { slug: "pattern-detection", title: "Pattern Detection" },
      { slug: "synthesis-layer", title: "Synthesis Layer" },
    ],
  },
  {
    key: "architecture",
    label: "Architecture",
    icon: "Network",
    topics: [
      { slug: "knowledge-graph", title: "Knowledge Graph" },
      { slug: "neuron-library", title: "Neuron Library" },
      { slug: "service-manifests", title: "Service Manifests" },
      { slug: "job-engine", title: "Job Engine" },
    ],
  },
  {
    key: "derivatives",
    label: "Derivatives",
    icon: "Boxes",
    topics: [
      { slug: "insights", title: "Insights" },
      { slug: "patterns", title: "Patterns" },
      { slug: "formulas", title: "Formulas" },
      { slug: "profiles", title: "Profiles" },
      { slug: "decision-artifacts", title: "Decision Artifacts" },
    ],
  },
  {
    key: "reference",
    label: "Reference",
    icon: "HelpCircle",
    topics: [
      { slug: "faq", title: "FAQ" },
      { slug: "glossary", title: "Glossary" },
      { slug: "security", title: "Security & Privacy" },
    ],
  },
];

// Import content from separate files
import { gettingStartedContent } from "./content/getting-started";
import { foundationContent } from "./content/foundation";
import { pipelineContent } from "./content/pipeline";
import { architectureContent } from "./content/architecture";
import { derivativesContent } from "./content/derivatives";
import { referenceContent } from "./content/reference";

export const TOPIC_CONTENT: Record<string, Record<string, DocTopic>> = {
  "getting-started": gettingStartedContent,
  foundation: foundationContent,
  pipeline: pipelineContent,
  architecture: architectureContent,
  derivatives: derivativesContent,
  reference: referenceContent,
};
