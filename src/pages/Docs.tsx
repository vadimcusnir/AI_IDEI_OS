import { Link, useParams, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, Layers, Network, Boxes, Sparkles, ChevronRight } from "lucide-react";

const DOCS_SECTIONS = [
  {
    key: "foundation",
    label: "Foundation",
    icon: BookOpen,
    topics: [
      { slug: "what-is-ai-idei", title: "What is AI-IDEI OS" },
      { slug: "knowledge-as-infrastructure", title: "Knowledge as Infrastructure" },
      { slug: "neuron-model", title: "The Neuron Model" },
      { slug: "intelligence-assets", title: "Intelligence Assets" },
    ],
  },
  {
    key: "pipeline",
    label: "Pipeline",
    icon: Layers,
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
    icon: Network,
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
    icon: Boxes,
    topics: [
      { slug: "insights", title: "Insights" },
      { slug: "patterns", title: "Patterns" },
      { slug: "formulas", title: "Formulas" },
      { slug: "profiles", title: "Profiles" },
      { slug: "decision-artifacts", title: "Decision Artifacts" },
    ],
  },
];

export { DOCS_SECTIONS };

export default function Docs() {
  const { section, topic } = useParams();

  if (section && topic) {
    return <DocsTopic section={section} topic={topic} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Technical Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3 max-w-[50ch]">
            Intelligence Extraction Infrastructure
          </h1>
          <p className="text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            Canonical documentation for a knowledge extraction OS that transforms
            transcripts into structured intelligence assets — insights, patterns,
            formulas, and decision models.
          </p>
        </div>
      </div>

      {/* Sections grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DOCS_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.key}
                className="bg-card border border-border rounded-xl p-5 sm:p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">{sec.label}</h2>
                </div>
                <ul className="space-y-2">
                  {sec.topics.map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/docs/${sec.key}/${t.slug}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Topic content ─── */

const TOPIC_CONTENT: Record<string, Record<string, { title: string; content: string }>> = {
  foundation: {
    "what-is-ai-idei": {
      title: "What is AI-IDEI OS",
      content: `AI-IDEI is an intelligence extraction operating system. It is not a chatbot, not a writing tool, and not a content generator.

It is infrastructure that transforms raw knowledge — podcasts, interviews, lectures, documents — into structured intelligence assets that compound over time.

## Core Mechanism

Every piece of content enters a refinery pipeline:

1. **Ingestion** — raw material is uploaded (audio, video, text, URL)
2. **Transcription** — content is converted to structured text
3. **Signal Extraction** — cognitive signals are identified and classified
4. **Neuron Structuring** — atomic knowledge units are created
5. **Derivative Generation** — insights, patterns, formulas, profiles emerge

The output is not content. The output is **intelligence infrastructure** — a compounding knowledge graph where every node is executable, addressable, and reusable.

## What Makes It Different

Traditional AI tools generate text. AI-IDEI extracts structure. The distinction is fundamental:

- A text generator produces disposable output
- An extraction engine produces durable assets

Every neuron extracted today becomes more valuable tomorrow as the graph grows, connections multiply, and derivative services compound.`,
    },
    "knowledge-as-infrastructure": {
      title: "Knowledge as Infrastructure",
      content: `Knowledge is not content. Content is consumable. Knowledge is structural.

## The Infrastructure Model

AI-IDEI treats knowledge the way civil engineering treats utilities:

| Layer | Traditional | AI-IDEI |
|-------|------------|---------|
| Raw Material | Water source | Transcript |
| Processing | Treatment plant | Intelligence extraction |
| Distribution | Pipe network | Knowledge graph |
| Consumption | Tap water | Derivatives (insights, formulas) |

The key insight: **infrastructure compounds, content decays.**

## Compounding Mechanics

Every neuron added to the system:
- Creates new connection possibilities with existing neurons
- Enables new derivative combinations
- Increases the semantic density of the graph
- Reduces marginal cost of future extractions

This is not a linear process. The value curve is exponential — governed by network effects within the knowledge graph itself.`,
    },
    "neuron-model": {
      title: "The Neuron Model",
      content: `The Neuron is the atomic unit of the AI-IDEI knowledge system. It is the smallest piece of knowledge that can exist independently while maintaining full addressability and executability.

## Composition Hierarchy

| Scale | Unit | Example |
|-------|------|---------|
| 1 | Neuron | A single insight or formula |
| 10 | Article | Coherent narrative from related neurons |
| 30 | Framework | Complete mental model |
| 100 | Course | Structured learning path |
| 500+ | Book / Knowledge Base | Comprehensive domain coverage |

## Neuron Properties

Every neuron carries:

- **Identity** — unique number, UUID, semantic address (NAS path)
- **Content** — multi-format blocks (markdown, code, prompts, diagrams)
- **Metadata** — category, lifecycle stage, score, visibility
- **Connections** — typed links to other neurons (supports, contradicts, extends)
- **Executability** — blocks can be run through AI services

## Lifecycle States

\`ingested → structured → active → capitalized → compounded\`

A neuron progresses through lifecycle stages as it accumulates connections, derivative outputs, and usage history.`,
    },
    "intelligence-assets": {
      title: "Intelligence Assets",
      content: `Intelligence assets are the derivatives produced by the extraction pipeline. Unlike generated content, these assets are **extracted** — they represent structures that already exist within the source material.

## Asset Types

### Insights
Non-obvious mechanisms affecting decisions. Insights reveal hidden causal chains that are not immediately visible in the source material.

### Patterns
Recurring cognitive structures. Patterns appear across multiple sources and represent stable behavioral or strategic regularities.

### Formulas
Operational rules extracted from patterns. Formulas are actionable — they can be applied directly to new contexts.

### Profiles
Intelligence derivatives from analyzed subjects. Profiles synthesize cognitive patterns, decision styles, and strategic behaviors from transcript analysis.

### Decision Artifacts
Structured decision models that combine insights, patterns, and formulas into executable decision frameworks.

## Asset Properties

Every intelligence asset is:
- **Addressable** — has a unique URL and NAS path
- **Interlinked** — connected to source neurons and related assets
- **Indexable** — optimized for search engine discovery
- **Executable** — can trigger further AI service execution`,
    },
  },
  pipeline: {
    "transcript-refinery": {
      title: "Transcript Refinery",
      content: `The Transcript Refinery is the first processing layer. It transforms raw audio, video, or text into structured transcripts ready for intelligence extraction.

## Input Formats

- Audio files (MP3, WAV, M4A)
- Video files (MP4, WebM)
- YouTube URLs
- Plain text / documents
- Podcast RSS feeds

## Processing Pipeline

1. **Upload & Validation** — file type detection, duration estimation
2. **Transcription** — speech-to-text with speaker diarization
3. **Segmentation** — semantic chunking into 200-800 token segments
4. **Annotation** — speaker labels, timestamps, topic markers
5. **Quality Check** — confidence scoring, gap detection

## Chunking Strategy

Transcripts are segmented by semantic boundaries, not arbitrary token counts. The system identifies:

- Topic transitions
- Speaker changes
- Rhetorical structure shifts
- Argument boundaries

This ensures each chunk maintains cognitive coherence for downstream extraction.`,
    },
    "signal-extraction": {
      title: "Signal Extraction",
      content: `Signal Extraction identifies cognitive signals within structured transcripts. This is the core intelligence layer — where raw text becomes structured knowledge.

## Three-Axis Analysis

Every transcript is analyzed across three dimensions:

### 1. Internal / Psychological Axis
- Decision-making patterns
- Cognitive biases
- Risk tolerance signals
- Emotional regulation markers

### 2. Narrative Axis
- Rhetorical structures
- Argument frameworks
- Persuasion techniques
- Story patterns

### 3. Commercial / JTBD Axis
- Jobs-to-be-done signals
- Value proposition patterns
- Market positioning strategies
- Competitive framing

## Extraction Chain

The system uses a chain of 9 specialized prompts, each targeting specific signal types. Prompts are executed sequentially, with each stage enriching the context for subsequent extraction.`,
    },
    "pattern-detection": {
      title: "Pattern Detection",
      content: `Pattern Detection identifies recurring cognitive structures across multiple transcripts and neurons. Patterns are second-order intelligence — they emerge from comparing and correlating first-order signals.

## Detection Mechanisms

### Cross-Source Correlation
The system compares extracted signals across different transcripts to identify structures that appear repeatedly. A pattern must appear in at least 3 independent sources to be classified as stable.

### Structural Similarity
Beyond keyword matching, the system identifies structural similarities — two arguments might use different words but follow the same logical framework.

### Contradiction Detection
When signals conflict across sources, the system flags contradictions as a special pattern type. Contradictions are often more valuable than agreements — they reveal boundary conditions and context dependencies.

## Pattern Types

- **Behavioral Patterns** — recurring decision-making structures
- **Rhetorical Patterns** — repeated persuasion frameworks
- **Strategic Patterns** — consistent positioning approaches
- **Cognitive Patterns** — stable thinking structures`,
    },
    "synthesis-layer": {
      title: "Synthesis Layer",
      content: `The Synthesis Layer combines extracted signals, detected patterns, and derived formulas into higher-order intelligence structures.

## Synthesis Operations

### Profile Synthesis
Combines cognitive signals from a single subject across multiple transcripts to generate an analytical profile.

### Framework Assembly
Groups related patterns and formulas into coherent frameworks — complete mental models that can be applied to new domains.

### Decision Model Construction
Builds executable decision trees from extracted patterns, formulas, and contradictions.

## Quality Metrics

Every synthesized output carries:
- **Confidence Score** — based on source diversity and signal consistency
- **Coverage Map** — which source segments contributed to the synthesis
- **Contradiction Index** — internal consistency measurement
- **Novelty Score** — how unique the synthesis is relative to the existing graph`,
    },
  },
  architecture: {
    "knowledge-graph": {
      title: "Knowledge Graph",
      content: `The Knowledge Graph is the structural backbone of AI-IDEI. It stores neurons, their connections, and the semantic relationships between intelligence assets.

## Graph Structure

### Nodes
Every neuron is a graph node with:
- Unique identifier (number + UUID)
- Semantic address (NAS path)
- Content category
- Lifecycle state
- Quality score

### Edges
Connections between neurons are typed:
- **supports** — one neuron reinforces another
- **contradicts** — neurons present conflicting information
- **extends** — one neuron builds upon another
- **derives** — one neuron was extracted from another
- **applies** — a formula applies to a specific context

## Traversal

The graph supports multiple traversal strategies:
- **Depth-first** — follow a single thread deep
- **Breadth-first** — explore all connections at a level
- **Semantic proximity** — find neurons by meaning similarity
- **Contradiction chains** — follow conflicting signals`,
    },
    "neuron-library": {
      title: "Neuron Library",
      content: `The Neuron Library is the persistent storage and retrieval system for all knowledge units.

## Organization

### Neuron Addressing System (NAS)
Every neuron has a semantic address following the pattern:
\`/domain/level-1/level-2/level-3\`

Example: \`/marketing/virality/identity-signals\`

This provides:
- Human-readable navigation
- Semantic clustering
- Hierarchical browsing
- URL-based retrieval

### Content Categories
Neurons are classified by cognitive type:
- Transcript, Insight, Framework, Strategy
- Formula, Pattern, Avatar, Argument Map
- Narrative, Psychological, Commercial

### Lifecycle Management
\`ingested → structured → active → capitalized → compounded\`

Each stage represents increasing value density and connection richness.`,
    },
    "service-manifests": {
      title: "Service Manifests",
      content: `Service Manifests define the AI execution workflows available on the platform. Each service is a structured pipeline that combines neurons with AI processing to generate specific deliverables.

## Manifest Structure

Every service manifest contains:
- **Service Key** — unique identifier
- **Input Schema** — what the service requires
- **Execution Pipeline** — processing steps
- **Deliverables Schema** — what the service produces
- **Credit Cost** — computational cost in NEURONS

## Service Classes

| Class | Description | Typical Cost |
|-------|------------|-------------|
| A | Heavy extraction (full transcript analysis) | 3000-5000 credits |
| B | Medium processing (pattern detection, synthesis) | 500-2000 credits |
| C | Light operations (formatting, summarization) | 50-500 credits |

## Execution Model

Services are executed as Jobs. Each job:
1. Validates input against the service schema
2. Selects relevant neurons from the library
3. Constructs execution prompts
4. Processes through AI pipeline
5. Generates artifacts (deliverables)
6. Stores results in the artifact library`,
    },
    "job-engine": {
      title: "Job Engine",
      content: `The Job Engine orchestrates service execution. It manages the lifecycle of computational tasks from submission to delivery.

## Job Lifecycle

\`queued → processing → completed / failed\`

## Execution Pipeline

1. **Submission** — user triggers a service with input parameters
2. **Validation** — input checked against service manifest schema
3. **Credit Check** — user balance verified against service cost
4. **Scheduling** — job queued for execution
5. **Processing** — AI pipeline executes the service logic
6. **Artifact Generation** — results stored as typed artifacts
7. **Notification** — user notified of completion
8. **Credit Deduction** — NEURONS deducted from balance

## Batch Processing

Multiple neurons can be processed through a single service simultaneously. The batch runner:
- Validates all inputs upfront
- Estimates total credit cost
- Executes in parallel where possible
- Aggregates results into a unified report`,
    },
  },
  derivatives: {
    insights: {
      title: "Insights",
      content: `Insights are non-obvious mechanisms affecting decisions. They represent hidden causal chains extracted from source material.

## What Qualifies as an Insight

An insight is NOT:
- An observation ("people buy when prices drop")
- A fact ("the market grew 15%")
- An opinion ("I think this will work")

An insight IS:
- A non-obvious mechanism ("price anchoring shifts perceived value by 40% regardless of actual cost difference")
- A hidden driver ("decision fatigue at hour 3 of meetings causes 67% of strategic reversals")
- A counter-intuitive relationship ("increasing friction in onboarding improves 90-day retention")

## Extraction Criteria

Insights must pass three filters:
1. **Non-obvious** — not immediately apparent from surface reading
2. **Mechanistic** — describes HOW something works, not just WHAT happens
3. **Actionable** — implies a possible intervention or application`,
    },
    patterns: {
      title: "Patterns",
      content: `Patterns are recurring cognitive structures detected across multiple sources. They represent stable regularities in thinking, decision-making, or strategy.

## Pattern Categories

### Behavioral Patterns
Recurring decision-making structures observed in subject behavior.

### Rhetorical Patterns
Repeated persuasion and argument frameworks used in communication.

### Strategic Patterns
Consistent positioning and competitive approaches.

### Cognitive Patterns
Stable thinking structures that influence perception and judgment.

## Detection Requirements

A valid pattern must:
- Appear in **3+ independent sources**
- Show **structural similarity** (not just keyword overlap)
- Be **predictive** (can anticipate future occurrences)
- Have **defined boundaries** (known conditions where it breaks)`,
    },
    formulas: {
      title: "Formulas",
      content: `Formulas are operational rules extracted from patterns. They are the most actionable derivative type — directly applicable to new contexts.

## Formula Structure

Every formula follows:
\`\`\`
IF [condition set]
THEN [action/outcome]
BECAUSE [mechanism from insight]
BOUNDARY [conditions where this breaks]
\`\`\`

## Formula Types

### Decision Formulas
Rules for making specific types of decisions under defined conditions.

### Copywriting Formulas
Structural templates for persuasive communication.

### Strategy Formulas
Operational frameworks for positioning and competition.

### Pricing Formulas
Rules for value communication and price architecture.

## Validation

Formulas are scored on:
- **Source diversity** — derived from how many independent patterns
- **Application breadth** — usable across how many contexts
- **Predictive accuracy** — historical success rate when applied`,
    },
    profiles: {
      title: "Profiles",
      content: `Profiles are intelligence derivatives synthesized from transcript analysis of specific subjects. They represent analytical maps of cognitive and strategic behavior.

## Profile Pipeline

\`media → transcript → signal extraction → indicator scoring → pattern detection → profile synthesis\`

## Profile Structure

### 1. Context
Verified facts about the subject — role, domain, public record.

### 2. Source Material
Analyzed transcripts — interviews, podcasts, lectures. Duration, date, and topic for each.

### 3. Extracted Indicators
Measurable cognitive signals:
- Decision speed
- Language density
- Risk tolerance
- Bias markers
- Strategic framing

### 4. Cognitive Patterns
Recurring thinking structures identified across sources.

### 5. Profile Synthesis
Integrated assessment:
- Decision style
- Strategic behavior
- Cognitive strengths
- Cognitive risks

### 6. Analytical Summary
Observed mechanisms — no speculation, no diagnosis.`,
    },
    "decision-artifacts": {
      title: "Decision Artifacts",
      content: `Decision Artifacts are structured decision models that combine multiple intelligence asset types into executable frameworks.

## Composition

A decision artifact integrates:
- **Insights** — the mechanisms at play
- **Patterns** — the recurring structures
- **Formulas** — the operational rules
- **Contradictions** — the boundary conditions

## Types

### Decision Trees
Branching logic models for specific decision domains.

### Evaluation Matrices
Multi-criteria scoring frameworks for complex choices.

### Risk Maps
Probability × impact visualizations for strategic scenarios.

### Scenario Models
If-then chains that map possible outcomes from specific starting conditions.

## Usage

Decision artifacts are the highest-value derivatives. They:
- Combine multiple neuron types into coherent frameworks
- Are directly executable through AI services
- Generate the highest compound returns when reused across contexts`,
    },
  },
};

function DocsTopic({ section, topic }: { section: string; topic: string }) {
  const sectionData = DOCS_SECTIONS.find((s) => s.key === section);
  const topicData = sectionData?.topics.find((t) => t.slug === topic);
  const content = TOPIC_CONTENT[section]?.[topic];

  if (!content || !topicData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Topic not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The requested documentation page does not exist.
        </p>
        <Link to="/docs" className="text-sm text-primary hover:underline">
          ← Back to Documentation
        </Link>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCode = false;
    let codeBlock = "";
    let inTable = false;
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCode) {
          elements.push(
            <pre key={`code-${i}`} className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto my-4">
              <code>{codeBlock.trim()}</code>
            </pre>
          );
          codeBlock = "";
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeBlock += line + "\n";
        continue;
      }

      if (line.startsWith("|") && line.endsWith("|")) {
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => /^[-:]+$/.test(c))) continue; // separator row
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {tableRows[0]?.map((cell, ci) => (
                    <th key={ci} className="text-left p-2 border-b border-border font-semibold text-xs">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-2 border-b border-border/50 text-xs text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }

      if (line.trim() === "") {
        elements.push(<div key={`space-${i}`} className="h-3" />);
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-semibold mt-8 mb-3">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold mt-6 mb-2">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
        if (match) {
          elements.push(
            <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
              <span className="font-medium text-foreground">{match[1]}</span> — {match[2]}
            </li>
          );
        } else {
          const boldMatch = line.match(/^- \*\*(.+?)\*\*(.*)$/);
          elements.push(
            <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
              <span className="font-medium text-foreground">{boldMatch?.[1] || line.slice(2)}</span>
              {boldMatch?.[2] || ""}
            </li>
          );
        }
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
            {line.slice(2)}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, "");
        const boldMatch = text.match(/\*\*(.+?)\*\*\s*[—-]\s*(.+)/);
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-decimal">
            {boldMatch ? (
              <>
                <span className="font-medium text-foreground">{boldMatch[1]}</span> — {boldMatch[2]}
              </>
            ) : (
              text
            )}
          </li>
        );
      } else {
        // Inline bold + code
        const rendered = line.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pi} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={pi} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          }
          return part;
        });
        elements.push(
          <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
            {rendered}
          </p>
        );
      }
    }

    // flush remaining table
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key="table-final" className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {tableRows[0]?.map((cell, ci) => (
                  <th key={ci} className="text-left p-2 border-b border-border font-semibold text-xs">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2 border-b border-border/50 text-xs text-muted-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  // Find adjacent topics for prev/next
  const allTopics = DOCS_SECTIONS.flatMap((s) =>
    s.topics.map((t) => ({ section: s.key, sectionLabel: s.label, ...t }))
  );
  const currentIdx = allTopics.findIndex(
    (t) => t.section === section && t.slug === topic
  );
  const prev = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const next = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="capitalize">{sectionData?.label}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{topicData.title}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-6">
          {content.title}
        </h1>

        {/* Content */}
        <article className="prose-custom">{renderContent(content.content)}</article>

        {/* Prev / Next */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border gap-4">
          {prev ? (
            <Link
              to={`/docs/${prev.section}/${prev.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {prev.title}
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/docs/${next.section}/${next.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
            >
              {next.title} →
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: content.title,
            description: content.content.slice(0, 160),
            author: { "@type": "Organization", name: "AI-IDEI" },
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
