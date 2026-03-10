export interface DocTopic {
  title: string;
  content: string;
}

export interface DocSection {
  key: string;
  label: string;
  icon: string; // lucide icon name
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

export const TOPIC_CONTENT: Record<string, Record<string, DocTopic>> = {
  "getting-started": {
    introduction: {
      title: "What is AI-IDEI?",
      content: `AI-IDEI is a knowledge extraction platform. You give it content — a podcast, an interview, a lecture, an article — and it gives you back structured knowledge you can reuse forever.

## Think of it this way

You record a 1-hour podcast. Inside that hour, there are dozens of ideas, frameworks, strategies, and patterns. But they're buried in conversation.

AI-IDEI pulls those ideas out. It structures them. It connects them to other ideas you've extracted before. And then it lets you generate new content from those ideas — articles, courses, marketing copy, scripts — automatically.

## The core idea

**Content decays. Knowledge compounds.**

A blog post gets old. A structured framework stays valuable forever — and becomes MORE valuable as you connect it to other frameworks.

## Who is this for?

- **Content creators** who want to turn episodes into dozens of assets
- **Consultants** who want to package their expertise
- **Educators** who want to build course material from lectures
- **Marketers** who need to produce content at scale
- **Anyone** who has valuable knowledge trapped in audio, video, or text

## What you'll get

From a single podcast episode, you can extract:

- 10-30 knowledge neurons (insights, patterns, formulas)
- Guest profiles with psychological analysis
- Marketing frameworks
- Copywriting formulas
- Article drafts
- Course outlines
- And much more

All of this happens automatically. You upload. The system extracts. You review and publish.`,
    },
    "how-it-works": {
      title: "How It Works",
      content: `AI-IDEI works like a refinery. Raw content goes in. Structured knowledge comes out. Here's the process in 5 steps.

## Step 1 — Upload

You upload your content. This can be:

- An audio file (MP3, WAV)
- A video file (MP4)
- A YouTube link
- Plain text

The system transcribes audio and video automatically. Text goes straight to processing.

## Step 2 — Extract

The AI analyzes your transcript. It looks for:

- **Insights** — non-obvious ideas that affect decisions
- **Patterns** — recurring structures in thinking or strategy
- **Formulas** — actionable rules you can apply elsewhere
- **Frameworks** — complete mental models

Each extracted idea becomes a **neuron** — a small, reusable knowledge unit.

## Step 3 — Structure

Neurons are organized and connected. The system:

- Assigns categories (marketing, psychology, strategy, etc.)
- Creates links between related neurons
- Builds a knowledge graph you can explore visually

## Step 4 — Generate

Use AI services to turn neurons into deliverables:

- Articles
- Social media posts
- Course modules
- Marketing copy
- Scripts
- Strategy documents

Each service costs a fixed amount of NEURONS credits. You see the price before you run it.

## Step 5 — Reuse

Your neurons are stored forever. Every new piece of content enriches your library. The more neurons you have, the better your generated outputs become.

This is the compounding effect: **knowledge builds on knowledge**.`,
    },
    "your-first-neuron": {
      title: "Your First Neuron",
      content: `Let's create your first neuron. This takes about 5 minutes.

## Option A — Extract from content (recommended)

1. Go to **Extractor** from the sidebar
2. Upload an audio file, paste text, or enter a YouTube URL
3. Wait for transcription (1-3 minutes for audio)
4. Click **Extract Neurons**
5. Review the extracted neurons — edit titles, adjust content
6. Save the ones you want to keep

That's it. You now have structured knowledge in your library.

## Option B — Create manually

1. Go to **Neurons** from the sidebar
2. Click **New Neuron**
3. Give it a title (e.g., "The 80/20 Rule in Content Marketing")
4. Add blocks — text, insights, formulas, prompts
5. Save

## What makes a good neuron?

A neuron should be:

- **Atomic** — one idea per neuron
- **Self-contained** — understandable without context
- **Reusable** — applicable in multiple situations
- **Specific** — not vague or generic

## Example

**Bad neuron:** "Marketing is important"

**Good neuron:** "When you increase friction in the signup process by adding a qualifying question, conversion drops 15% but 90-day retention increases 40% — because you filter out low-intent users."

The good neuron is specific, actionable, and reusable.`,
    },
    "credits-system": {
      title: "Credits & Pricing",
      content: `AI-IDEI uses a credit system called **NEURONS**. Credits power all AI operations on the platform.

## How credits work

Every AI service has a fixed credit cost. You see the price before you run anything. No surprises.

| Operation | Typical Cost |
|-----------|-------------|
| Transcription | 100-500 credits |
| Neuron extraction | 500-2000 credits |
| Article generation | 300-800 credits |
| Full analysis | 3000-5000 credits |

## Pricing

**1000 credits = 10 USD**

That means 1 credit costs $0.01.

## Example cost

You upload a podcast. The full pipeline:

- Transcription: 300 credits ($3)
- Extraction: 1500 credits ($15)
- 3 articles: 900 credits ($9)
- Total: 2700 credits ($27)

You get: 15-30 neurons + 3 articles + guest profile.

Cost per deliverable: less than $1.

## Getting credits

- **Sign-up bonus** — you get starter credits for free
- **Top-up** — buy credit packages via Stripe
- **Subscription** — monthly plans include credits

## Checking your balance

Your credit balance is always visible in the sidebar. Click **Credits** for full transaction history and usage analytics.`,
    },
  },
  foundation: {
    "what-is-ai-idei": {
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
  reference: {
    faq: {
      title: "Frequently Asked Questions",
      content: `## What file formats can I upload?

You can upload MP3, WAV, M4A audio files, MP4/WebM video files, paste YouTube URLs, or enter plain text directly. The system handles transcription automatically for audio and video.

## How long does extraction take?

- **Transcription:** 1-3 minutes for a 1-hour file
- **Neuron extraction:** 2-5 minutes depending on transcript length
- **Service execution:** 30 seconds to 5 minutes depending on complexity

## Can I edit extracted neurons?

Yes! Every extracted neuron is fully editable. You can change the title, modify blocks, add new content, adjust categories, and create connections to other neurons.

## What are NEURONS credits?

NEURONS are the compute currency of the platform. Every AI operation costs a fixed number of credits. 1000 credits = $10. You always see the price before running anything.

## Is my content private?

Yes. Your uploaded files, transcripts, and extracted neurons are private by default. Only you can see them. You choose what to make public.

## Can I export my work?

Yes. Artifacts can be exported in Markdown, HTML, and other formats. Your neurons and their content are always accessible.

## What AI models are used?

The platform uses state-of-the-art language models for transcription, extraction, and generation. The specific models are selected automatically based on the task to optimize quality and cost.

## How is the knowledge graph built?

As you extract neurons, the system automatically identifies relationships between them. Neurons that share concepts, reference similar patterns, or build on each other are linked. You can also create manual connections.

## What happens if a service fails?

If a service execution fails, your credits are not charged. You'll receive a notification explaining what went wrong, and you can retry.

## Can I use the platform in multiple languages?

The platform interface is available in English, Romanian, and Russian. Content extraction works with any language the AI models support, including most major languages.`,
    },
    glossary: {
      title: "Glossary",
      content: `## Neuron
The atomic unit of knowledge. A self-contained idea, framework, pattern, or formula extracted from content.

## Episode
A piece of uploaded content — an audio file, video, text, or URL that serves as source material for extraction.

## Artifact
A generated deliverable — an article, script, course module, or other output produced by running an AI service on neurons.

## Knowledge Graph
The network of connections between neurons. Shows how ideas relate, support, contradict, or extend each other.

## Service
An AI workflow that processes neurons to generate specific outputs. Each service has a fixed credit cost.

## Job
A single execution of a service. Jobs track status (queued, processing, completed, failed) and store results.

## Block
A content unit within a neuron. Types include text, insight, formula, prompt, code, and more.

## NEURONS (credits)
The compute currency. Powers all AI operations. 1000 credits = $10 USD.

## Extraction
The process of analyzing content to identify and structure knowledge units (neurons).

## NAS (Neuron Addressing System)
A hierarchical path that locates a neuron semantically: \`/domain/category/subcategory\`

## Lifecycle
The maturity stages of a neuron: ingested → structured → active → capitalized → compounded.

## Derivative
An intelligence asset produced from neurons — insights, patterns, formulas, profiles, or decision artifacts.`,
    },
    security: {
      title: "Security & Privacy",
      content: `## Data Ownership

You own all your data. This includes:
- Uploaded files
- Transcripts
- Extracted neurons
- Generated artifacts
- Profile information

We do not sell, share, or use your private data for training.

## Privacy Controls

- All content is **private by default**
- You choose what to make public
- Guest profiles require your approval before publishing
- You can delete any data at any time

## Authentication

- Email + password authentication
- Secure session management
- JWT token-based API access
- All edge functions require authentication

## Infrastructure Security

- All data is encrypted in transit (HTTPS/TLS)
- Database-level row security (RLS) — users can only access their own data
- Edge functions validate authentication on every request
- Rate limiting on expensive operations

## Payment Security

- Payments processed via Stripe
- We never store credit card information
- PCI DSS compliant payment flow`,
    },
  },
};
