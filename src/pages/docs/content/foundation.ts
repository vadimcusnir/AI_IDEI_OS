import type { DocTopic } from "../docsContent";

export const foundationContent: Record<string, DocTopic> = {
  "what-is-ai-idei": {
    title: "Knowledge as Infrastructure",
    content: `Knowledge is not content. Content is consumable — it gets published, viewed, and forgotten. Knowledge is structural — it persists, connects, and compounds. AI-IDEI treats knowledge the way civil engineering treats utilities: as infrastructure that delivers increasing returns over time.

## The Infrastructure Model

Traditional content platforms treat each piece of content as an independent asset. You write an article, publish it, measure engagement, and move on. The next article starts from scratch. There's no structural relationship between pieces, no compounding effect, no network value.

AI-IDEI inverts this model completely. Instead of producing independent content pieces, the platform extracts structural knowledge from your content and stores it in an interconnected graph. Every new extraction enriches the entire system.

| Layer | Traditional Infrastructure | AI-IDEI Knowledge Infrastructure |
|---|---|---|
| Raw Material | Water source, mineral ore | Transcripts, recordings, texts |
| Processing | Treatment plant, refinery | Intelligence extraction pipeline |
| Distribution | Pipe network, electrical grid | Knowledge graph, API access |
| Consumption | Tap water, electricity | Derivatives (insights, formulas, articles) |
| Maintenance | Physical upkeep | Graph enrichment, re-scoring |

The key principle: **infrastructure compounds, content decays.**

A blog post published today has a half-life of about 2 weeks. A structured framework extracted from that post — "the inverted pricing ladder" or "the 3-signal trust formula" — has no decay curve. It stays valuable forever. And its value increases as it connects to other frameworks in the graph.

## Compounding Mechanics

Every neuron added to the system creates multiple value effects:

### 1. Connection Multiplication
Each new neuron can potentially connect to every existing neuron. In a graph with N neurons, adding neuron N+1 creates up to N new connection possibilities. This means the potential complexity and richness of the graph grows quadratically with the number of neurons.

In practice, not every neuron connects to every other neuron. But the system automatically identifies relationships, and even sparse connections create significant value through multi-hop traversal.

### 2. Derivative Enhancement
AI services that generate articles, courses, and strategies draw from the neuron library. A service that has access to 50 related neurons produces fundamentally better output than one working with 5 neurons. The quality of generated deliverables scales with library depth.

### 3. Semantic Density
As the knowledge graph grows denser, the system becomes better at:
- Detecting patterns across sources
- Identifying contradictions that reveal boundary conditions
- Finding non-obvious relationships between distant domains
- Generating novel combinations of existing knowledge

### 4. Marginal Cost Reduction
The first extraction from a new domain is expensive in terms of processing. But subsequent extractions in the same domain benefit from existing graph context. The marginal cost of adding knowledge to a well-populated domain decreases over time.

## Linear vs. Compounding Value

Traditional content production follows a linear value curve:
- Effort per piece: constant
- Value per piece: constant (or declining as topics are exhausted)
- Total value: N × value_per_piece

Knowledge infrastructure follows an exponential curve:
- Effort per extraction: constant
- Value per neuron: increasing (due to network effects)
- Total value: proportional to N² (due to connection multiplication)

This is why AI-IDEI users report that their 100th extraction is dramatically more valuable than their 1st — not because the content is better, but because the graph context is richer.

## The Knowledge Flywheel

The infrastructure model creates a self-reinforcing flywheel:

1. **Upload content** → raw material enters the system
2. **Extract neurons** → structured knowledge is created
3. **Graph enrichment** → new connections form automatically
4. **Better services** → AI outputs improve with richer context
5. **More value** → deliverables are higher quality
6. **More content uploaded** → success motivates further investment

Each cycle through the flywheel increases the system's value. This is fundamentally different from content production, where each cycle is independent.

## Infrastructure Principles

### Persistence
Knowledge infrastructure must be persistent. Unlike content that can be deleted and recreated, graph structure accumulates over time. Every neuron you create and every connection you establish becomes part of a permanent asset.

### Addressability
Every node in the knowledge infrastructure must be uniquely addressable. In AI-IDEI, neurons have numeric IDs, UUIDs, and semantic addresses (NAS paths like \`/marketing/pricing/anchoring-effect\`). This enables precise retrieval, linking, and API access.

### Interoperability
Knowledge units must be combinable. A neuron about pricing psychology should seamlessly combine with a neuron about conversion optimization to produce a comprehensive pricing strategy. The block-based neuron structure ensures this interoperability.

### Measurability
Infrastructure requires metrics. AI-IDEI measures knowledge through:
- **IdeaRank** — graph-based importance scoring (similar to PageRank)
- **Confidence scores** — source reliability assessment
- **Evidence counts** — number of supporting sources
- **Reuse counts** — how often a neuron contributes to service outputs

## Implications for Users

Understanding knowledge as infrastructure changes how you approach the platform:

1. **Think in terms of graph building**, not content creation. Your goal is to enrich the graph, not produce standalone outputs.
2. **Prioritize extraction diversity**. Process content from different domains and perspectives to create a richer connection space.
3. **Invest in connections**. Link your neurons. The graph's value comes from connections, not isolated nodes.
4. **Trust the compounding**. Early extractions may feel incremental. The exponential value emerges after you've built sufficient graph density.

## Further Reading

- [The Neuron Model](/docs/foundation/neuron-model) — understand the atomic unit of knowledge
- [Intelligence Assets](/docs/foundation/intelligence-assets) — learn about derivative types
- [Knowledge Graph](/docs/architecture/knowledge-graph) — explore graph mechanics`,
  },
  "neuron-model": {
    title: "The Neuron Model",
    content: `The Neuron is the atomic unit of the AI-IDEI knowledge system. It is the smallest piece of knowledge that can exist independently while maintaining full addressability, executability, and connection potential. Understanding the neuron model is essential to using the platform effectively.

## Why "Neuron"?

The name is not arbitrary. In biological neural networks, a neuron is a cell that:
- Receives signals from multiple inputs
- Processes and transforms those signals
- Transmits output to connected neurons
- Strengthens or weakens connections based on usage

AI-IDEI neurons work analogously:
- They receive context from source material (transcripts, texts)
- They contain processed, structured knowledge
- They connect to other neurons via typed relationships
- Their importance score increases as they're used and connected

## Composition Hierarchy

Neurons scale through composition. A single neuron is valuable on its own, but neurons combine into progressively more powerful structures:

| Scale | Unit | Example |
|---|---|---|
| 1 | Neuron | A single insight about pricing psychology |
| 5-10 | Cluster | Related insights forming a pattern |
| 10-30 | Article | Coherent narrative from related neurons |
| 30-50 | Framework | Complete mental model for a domain |
| 50-100 | Course Module | Structured learning sequence |
| 100-500 | Course | Comprehensive learning path |
| 500+ | Knowledge Base | Complete domain coverage |

The power of this hierarchy is that each level is automatically achievable once you have sufficient neurons. You don't need to manually write a course — you extract enough neurons and the AI services can assemble courses from them.

## Neuron Anatomy

Every neuron consists of four layers:

### 1. Identity Layer
- **Numeric ID** — auto-assigned sequential number (e.g., #127)
- **UUID** — unique system identifier
- **Title** — human-readable name describing the core idea
- **Semantic Address (NAS)** — hierarchical path like \`/psychology/decision-making/anchoring-bias\`
- **Aliases** — shortlinks for quick reference

### 2. Content Layer (Blocks)
Neurons contain typed content blocks. Each block has a specific function:

- **Text** — general explanation, context, or narrative
- **Insight** — a non-obvious mechanism or causal relationship
- **Formula** — an actionable rule with conditions, outcomes, and boundaries
- **Framework** — a structured mental model
- **Prompt** — an AI prompt template that can be executed
- **Code** — technical implementation (any language)
- **Data/YAML** — structured data or configuration
- **Checklist** — actionable steps or verification criteria

A typical neuron has 2-5 blocks. The block structure ensures that different types of knowledge within a neuron are properly distinguished and independently processable.

### 3. Metadata Layer
- **Category** — content classification (insight, pattern, formula, framework, strategy, avatar, narrative, psychological, commercial, argument_map, transcript)
- **Lifecycle State** — maturity level (ingested → structured → active → capitalized → compounded)
- **Visibility** — private (owner only) or public (discoverable)
- **Quality Score** — automatically computed based on content richness, connections, and usage
- **Source Episode** — link back to the original content source
- **Tags** — optional keywords for organization
- **Created/Updated timestamps** — full audit trail

### 4. Connection Layer
- **Links** — typed relationships to other neurons:
  - **supports** — this neuron reinforces another
  - **contradicts** — this neuron conflicts with another
  - **extends** — this neuron builds upon another
  - **derived_from** — this neuron was extracted from another
  - **applies_to** — this neuron applies to a specific context
  - **inspires** — loose creative connection
- **Entity Projections** — mapping to knowledge graph entities
- **Artifact Links** — deliverables generated from this neuron

## Lifecycle States

Neurons progress through five lifecycle stages, each representing increasing value density:

### 1. Ingested
The neuron has been extracted or created but not yet reviewed. Raw extraction output. Content may need editing or validation.

### 2. Structured
The neuron has been reviewed, edited, and properly categorized. Blocks are well-formed. Metadata is accurate. Ready for connections.

### 3. Active
The neuron is connected to other neurons and actively contributing to the knowledge graph. It has been used in at least one service execution or connected to multiple other neurons.

### 4. Capitalized
The neuron has generated economic value — it has been used to produce artifacts that were published, shared, or sold. It has proven its utility through actual output.

### 5. Compounded
The highest lifecycle state. The neuron is deeply connected, frequently reused, and generates value through multiple derivative chains. Removing this neuron would significantly impact the graph's quality.

## The Neuron Addressing System (NAS)

Every neuron has a hierarchical semantic address that describes its position in the knowledge space:

\`\`\`
/domain/level-1/level-2/level-3
\`\`\`

Examples:
- \`/marketing/pricing/anchoring-effect\`
- \`/psychology/decision-making/cognitive-load\`
- \`/strategy/competition/blue-ocean-positioning\`

NAS paths enable:
- **Semantic navigation** — browse neurons by domain
- **Cluster identification** — find related neurons automatically
- **URL-based access** — every neuron has a deterministic URL
- **API queries** — programmatic access by semantic path

## Quality Scoring

Neuron quality is computed automatically based on:

1. **Content richness** — number and variety of blocks
2. **Connection density** — number of typed links to other neurons
3. **Source diversity** — how many independent sources support the neuron
4. **Usage frequency** — how often the neuron is selected for service execution
5. **Derivative count** — how many artifacts have been generated from this neuron
6. **Lifecycle advancement** — higher lifecycle states indicate proven value

The quality score influences IdeaRank computation and service recommendation priority.

## Creating Effective Neurons

### The Five Principles

1. **Atomic** — one idea per neuron. If you can split it, you should.
2. **Self-contained** — understandable without reading the source material
3. **Specific** — includes numbers, conditions, and boundaries
4. **Reusable** — applicable across multiple contexts
5. **Connected** — linked to related neurons in the graph

### Common Mistakes

- **Over-broad neurons** — "Marketing strategies for 2024" should be 10 separate neurons
- **Context-dependent neurons** — "As John mentioned in the interview" loses meaning outside the source
- **Duplicate neurons** — check existing library before creating; use connections instead
- **Orphan neurons** — neurons without connections lose most of their compounding value

## Further Reading

- [Knowledge as Infrastructure](/docs/foundation/what-is-ai-idei) — the philosophical foundation
- [Intelligence Assets](/docs/foundation/intelligence-assets) — derivative types
- [Neuron Library](/docs/architecture/neuron-library) — storage and retrieval
- [Your First Neuron](/docs/getting-started/your-first-neuron) — hands-on creation guide`,
  },
  "intelligence-assets": {
    title: "Intelligence Assets",
    content: `Intelligence assets are the derivatives produced by the AI-IDEI extraction pipeline. Unlike generated content (which is created from scratch), intelligence assets are **extracted** — they represent structures that already exist within source material. The AI identifies, isolates, and formalizes them.

## The Extraction vs. Generation Distinction

This distinction is fundamental to understanding AI-IDEI's value proposition:

**Generated content** is produced by AI from a prompt. It represents the model's interpolation of training data. Quality depends on prompt engineering and model capability.

**Extracted intelligence** is identified by AI within existing material. It represents real structures that a human expert created during authentic conversation or writing. Quality depends on the richness of the source material and the precision of the extraction pipeline.

AI-IDEI primarily operates in extraction mode. The platform's AI services then use extracted intelligence to generate derivative content — but the foundation is always real, extracted knowledge.

## Asset Types

### Insights

Insights are non-obvious mechanisms affecting decisions. They reveal hidden causal chains that are not immediately visible in the source material.

**What qualifies as an insight:**
- A non-obvious mechanism: "Price anchoring shifts perceived value by 40% regardless of actual cost difference"
- A hidden driver: "Decision fatigue at hour 3 of meetings causes 67% of strategic reversals"
- A counter-intuitive relationship: "Increasing friction in onboarding improves 90-day retention"

**What does NOT qualify:**
- Observations: "People buy more during sales" (obvious)
- Facts: "The market grew 15%" (data, not mechanism)
- Opinions: "I think video content works better" (subjective)

Insights must pass three filters: they must be **non-obvious**, **mechanistic** (explaining HOW, not just WHAT), and **actionable** (implying a possible intervention).

### Patterns

Patterns are recurring cognitive structures detected across multiple sources. They represent stable regularities in thinking, decision-making, or strategy.

**Pattern categories:**
- **Behavioral patterns** — recurring decision-making structures
- **Rhetorical patterns** — repeated persuasion and argument frameworks
- **Strategic patterns** — consistent positioning and competitive approaches
- **Cognitive patterns** — stable thinking structures that influence perception

**Detection requirements:**
- Must appear in 3+ independent sources for "stable" classification
- Must show structural similarity (not just keyword overlap)
- Must be predictive (can anticipate future occurrences)
- Must have defined boundaries (known conditions where the pattern breaks)

### Formulas

Formulas are operational rules extracted from patterns. They are the most actionable derivative type — directly applicable to new contexts.

**Formula structure:**
\`\`\`
IF [condition set]
THEN [action/outcome]
BECAUSE [mechanism from insight]
BOUNDARY [conditions where this breaks]
\`\`\`

**Formula types:**
- **Decision formulas** — rules for specific decision types under defined conditions
- **Copywriting formulas** — structural templates for persuasive communication
- **Strategy formulas** — operational frameworks for positioning and competition
- **Pricing formulas** — rules for value communication and price architecture

### Profiles

Profiles are intelligence derivatives synthesized from transcript analysis of specific subjects. They represent analytical maps of cognitive and strategic behavior.

**Profile pipeline:**
\`media → transcript → signal extraction → indicator scoring → pattern detection → profile synthesis\`

**Profile components:**
1. **Context** — verified facts about the subject (role, domain, public record)
2. **Source material** — analyzed transcripts with metadata
3. **Extracted indicators** — measurable cognitive signals (decision speed, language density, risk tolerance, bias markers)
4. **Cognitive patterns** — recurring thinking structures across sources
5. **Profile synthesis** — integrated assessment of decision style, strategic behavior, strengths, and risks
6. **Analytical summary** — observed mechanisms only, no speculation

### Decision Artifacts

Decision artifacts are the highest-order derivatives. They combine multiple asset types into executable decision frameworks.

**Composition:**
- **Insights** provide the mechanisms at play
- **Patterns** reveal the recurring structures
- **Formulas** define the operational rules
- **Contradictions** establish the boundary conditions

**Types:**
- Decision trees — branching logic for specific decision domains
- Evaluation matrices — multi-criteria scoring frameworks
- Risk maps — probability × impact visualizations
- Scenario models — if-then chains mapping possible outcomes

## Asset Properties

Every intelligence asset shares these properties:

### Addressable
Each asset has a unique URL, a semantic NAS path, and an API endpoint. This means every insight, pattern, and formula can be referenced, linked, and retrieved programmatically.

### Interlinked
Assets are connected to their source neurons, related assets, and the broader knowledge graph. An insight connects to the patterns it belongs to. A formula connects to the insights that explain its mechanism.

### Indexable
Public assets are optimized for search engine discovery with structured JSON-LD data, SEO-friendly URLs, meta descriptions, and semantic HTML. This means your extracted knowledge can attract organic traffic.

### Executable
Assets can trigger further AI service execution. An insight can be input to a "generate article from insight" service. A formula can be input to a "create marketing campaign from formula" service. This enables derivative chains — one extraction producing dozens of outputs.

### Scored
Every asset carries quality metrics:
- **Confidence score** — source reliability and extraction precision
- **Evidence count** — number of supporting sources
- **Reuse count** — how often the asset has been used in downstream operations
- **IdeaRank** — graph-based importance score

## The Derivative Chain

Intelligence assets form chains of increasing abstraction:

\`\`\`
Transcript → Signals → Insights → Patterns → Formulas → Decision Artifacts
\`\`\`

Each level builds on the previous one. Signals are raw observations. Insights explain mechanisms behind signals. Patterns emerge from multiple insights. Formulas operationalize patterns. Decision artifacts combine everything into executable frameworks.

The deeper you go in the chain, the more reusable and valuable the asset becomes.

## Further Reading

- [Signal Extraction](/docs/pipeline/signal-extraction) — how signals are identified
- [Pattern Detection](/docs/pipeline/pattern-detection) — how patterns emerge
- [The Neuron Model](/docs/foundation/neuron-model) — the atomic knowledge unit
- [Knowledge Graph](/docs/architecture/knowledge-graph) — how assets interconnect`,
  },
  "knowledge-graph-overview": {
    title: "Knowledge Graph",
    content: `The Knowledge Graph is the semantic backbone of AI-IDEI. It connects every neuron, entity, and insight into a navigable network of relationships.

## What Is It?

Think of the Knowledge Graph as a map of everything you know. Each node represents a piece of knowledge (an insight, pattern, formula, or profile). Each edge represents a relationship between pieces of knowledge (supports, contradicts, extends, derives from).

## How It Works

When you extract neurons from content, the system automatically:
1. **Projects** neurons into the graph as entities
2. **Identifies** semantic relationships between entities
3. **Scores** entity importance using IdeaRank (PageRank-derived)
4. **Clusters** related entities into topics

## Relationship Types

| Type | Weight | Meaning |
|------|--------|---------|
| derived_from | 1.0 | Direct derivation from another idea |
| supports | 0.8 | Provides evidence for another idea |
| extends | 0.7 | Builds on or expands another idea |
| applies_to | 0.6 | Practical application of a concept |
| references | 0.5 | Cites or mentions another idea |
| contradicts | 0.3 | Opposes or conflicts with another idea |

## IdeaRank

Every entity receives an importance score calculated from five components:

\`\`\`
PVS = 0.30·Activation + 0.20·Growth + 0.20·Centrality + 0.15·Authority + 0.15·Economic
\`\`\`

The top 5% of entities by emergence score are flagged as **Emerging Ideas** — concepts gaining rapid importance in your knowledge base.

## Visualization

The graph is visualized interactively on the **Insights** page. You can:
- View nodes colored by category or cluster
- Zoom into subgraphs by clicking a node
- Filter by time period
- Export as image

## Further Reading

- [Knowledge Graph (Architecture)](/docs/architecture/knowledge-graph) — technical implementation
- [IdeaRank](/docs/reference/glossary) — scoring algorithm details`,
  },
  "services-and-credits": {
    title: "Services & Credits",
    content: `AI-IDEI uses a credit-based system called NEURONS to power all AI operations. This page explains how services work and how credits are consumed.

## What Are Services?

Services are AI workflows that transform neurons into deliverables. Each service has:
- **Input requirements** — which neurons or content it needs
- **Processing pipeline** — the AI prompts and logic
- **Output format** — what it produces (article, script, analysis, etc.)
- **Credit cost** — fixed cost in NEURONS

## How Credits Work

**NEURONS** are compute credits. They represent processing power.

- **Base rate:** $1 = 500 NEURONS (1 NEURON = $0.002)
- **Welcome bonus:** 500 free credits on signup
- **Top-up:** Buy packages via Stripe
- **Subscriptions:** Monthly plans include credit allocations

## Credit Flow

1. You choose a service and select input neurons
2. The system calculates the credit cost
3. Credits are **reserved** (held, not spent)
4. The service executes
5. On success: credits are settled (spent)
6. On failure: credits are **refunded** automatically

## Service Categories

| Category | Example Services | Typical Cost |
|----------|-----------------|--------------|
| Content | Blog post, article, newsletter | 30-100 credits |
| Marketing | Ad copy, landing page, email sequence | 50-150 credits |
| Strategy | SWOT analysis, competitive framework | 80-200 credits |
| Education | Course module, quiz, lesson plan | 100-300 credits |
| Extraction | Neuron extraction, deep analysis | 50-200 credits |

## Daily Spend Cap

To prevent accidental overspending, each account has a daily spend cap. You can adjust this in your credit settings.

## Further Reading

- [Credits & Pricing](/docs/getting-started/credits-system) — detailed pricing
- [Service Manifests](/docs/architecture/service-manifests) — technical service architecture`,
  },
};
