import type { DocTopic } from "../docsContent";

export const architectureContent: Record<string, DocTopic> = {
  "knowledge-graph": {
    title: "Knowledge Graph",
    content: `The Knowledge Graph is the structural backbone of AI-IDEI. It stores neurons, their connections, and the semantic relationships between intelligence assets. The graph is what transforms a flat collection of extracted knowledge into a navigable, interconnected intelligence system.

## Why a Graph?

Traditional knowledge management uses folders, tags, and search. These work for retrieval but fail at discovery. You can find what you're looking for, but you can't find what you didn't know existed.

A graph changes this. When you explore a neuron about pricing psychology, the graph shows you:
- Related insights about consumer behavior
- Contradicting evidence from different markets
- Formulas derived from the same underlying pattern
- Profiles of experts who discussed similar topics

This enables **serendipitous discovery** — finding valuable connections you wouldn't have searched for.

## Graph Structure

### Nodes (Entities)

Every neuron and intelligence asset is a graph node. Each node carries:

- **Unique identifier** — numeric ID + UUID for system operations
- **Semantic address** — NAS path for human navigation (\`/marketing/pricing/anchoring-effect\`)
- **Content category** — insight, pattern, formula, profile, framework, etc.
- **Entity type** — classification within the knowledge graph (insight, pattern, formula, contradiction, application, profile)
- **Lifecycle state** — maturity level from ingested to compounded
- **Quality score** — computed from content richness, connections, and usage
- **IdeaRank** — PageRank-style importance score based on graph topology

### Edges (Relations)

Connections between nodes are **typed** — they carry semantic meaning:

| Relation Type | Meaning | Weight |
|---|---|---|
| **DERIVED_FROM** | Node was extracted from another | 1.0 |
| **SUPPORTS** | Node reinforces another | 0.8 |
| **EXTENDS** | Node builds upon another | 0.7 |
| **INSPIRES** | Loose creative connection | 0.7 |
| **APPLIES_TO** | Formula applies to context | 0.6 |
| **PART_OF** | Node is component of larger structure | 0.6 |
| **RELATES_TO** | General relationship | 0.5 |
| **REFERENCES** | Node cites another | 0.5 |
| **MENTIONS** | Passing reference | 0.4 |
| **CONTRADICTS** | Nodes present conflicting information | 0.3 |

Weights influence IdeaRank computation. Strong semantic relationships (DERIVED_FROM, SUPPORTS) propagate more importance than weak ones (MENTIONS).

## IdeaRank Algorithm

AI-IDEI uses a custom importance scoring algorithm inspired by Google's PageRank. IdeaRank measures how central and valuable a node is within the knowledge graph.

### Computation Process (5 Phases)

**Phase 0: Snapshot**
Save current state for delta computation. This enables tracking of growth and acceleration.

**Phase 1: PageRank Iteration**
Run 30 iterations of weighted PageRank across the entity graph. Each iteration propagates importance from connected nodes, weighted by relation type.

**Phase 2: Per-Node Metrics**
Compute individual metrics for each node:
- **Activation score** — current engagement level
- **Betweenness** — how many paths pass through this node
- **Multi-hop influence** — reach through 2-hop connections
- **Authority** — source reliability and evidence support
- **Economic conversion** — reuse frequency

**Phase 3: PVS Formula**
Compute the Platform Value Score combining:
- Activation (30%)
- Growth (20%)
- Centrality (20%)
- Authority (15%)
- Economic conversion (15%)

**Phase 4: Emergence Detection**
Identify nodes showing anomalous growth patterns (emerging insights that are gaining connections rapidly). Uses a 6-component score with p95 threshold.

**Phase 5: Writeback**
Update entity importance scores in the database.

### What IdeaRank Means for You

High IdeaRank entities are:
- **Well-connected** — many neurons support, extend, or derive from them
- **Well-sourced** — backed by multiple independent extractions
- **Frequently used** — selected as input for AI services
- **Structurally central** — many paths in the graph pass through them

When you browse the Intelligence page, entities are ranked by IdeaRank. This surfaces the most valuable, best-connected knowledge in your system.

## Graph Navigation

### Visual Explorer
The Intelligence page provides an interactive 2D force graph visualization. You can:
- Zoom and pan across the graph
- Click nodes to view entity details
- See connection types visualized as colored edges
- Filter by entity type or importance threshold

### Entity Pages
Each entity has a dedicated public page (for published entities) with:
- Full content and description
- Related entities listed by relationship type
- IdeaRank score and quality metrics
- Source neuron references
- JSON-LD structured data for SEO

### Semantic Search
Search for entities by meaning, not just keywords. The system uses embedding-based similarity search to find entities related to your query even when they use different terminology.

## Graph Enrichment

The graph grows automatically through several mechanisms:

### Extraction
Every neuron extraction creates new nodes and connections. If an extracted insight relates to an existing pattern, the connection is established automatically.

### Entity Projection
The "generate-entities" edge function projects neurons into knowledge graph entities, classifying them by type and establishing relationships based on content similarity.

### Manual Connections
You can create connections manually from the neuron editor. This is recommended for relationships that the AI might miss — especially cross-domain connections that require human domain expertise.

### IdeaRank Recomputation
As the graph changes, IdeaRank is recomputed to reflect the new topology. This means adding a single well-connected neuron can change the importance scores of many existing entities.

## Topics and Taxonomy

Entities are organized into a topic taxonomy. Topics provide:
- **Hierarchical classification** — topics can have parent-child relationships
- **Localized labels** — topic names in multiple languages
- **Entity grouping** — entities are associated with topics via relevance scores
- **Discovery pages** — browse entities by topic on the Topics page

## Further Reading

- [Neuron Library](/docs/architecture/neuron-library) — the storage system
- [IdeaRank details](/docs/architecture/knowledge-graph) — algorithm specifics
- [Intelligence Assets](/docs/foundation/intelligence-assets) — what the graph contains
- [Knowledge as Infrastructure](/docs/foundation/what-is-ai-idei) — the philosophy behind the graph`,
  },
  "neuron-library": {
    title: "Neuron Library",
    content: `The Neuron Library is the persistent storage and retrieval system for all knowledge units on the platform. It combines structured database storage with intelligent organization to make your knowledge accessible, searchable, and actionable.

## Organization

### Neuron Addressing System (NAS)

Every neuron has a semantic address following a hierarchical pattern:
\`\`\`
/domain/level-1/level-2/level-3
\`\`\`

Examples:
- \`/marketing/virality/identity-signals\`
- \`/psychology/cognitive-biases/anchoring-effect\`
- \`/strategy/competitive/blue-ocean-positioning\`

NAS provides:
- **Human-readable navigation** — browse your library like a file system
- **Semantic clustering** — related neurons share address prefixes
- **Deterministic URLs** — every neuron has a predictable URL
- **API queryability** — retrieve neurons by semantic path

### Content Categories

Neurons are classified by their knowledge type. The platform supports 11 categories:

| Category | Description | Example |
|---|---|---|
| **transcript** | Raw content reference | Direct quote or passage |
| **insight** | Non-obvious mechanism | "Friction increases retention" |
| **framework** | Complete mental model | "The 4P Marketing Mix adapted for SaaS" |
| **strategy** | Strategic approach | "Negative space pricing for premium positioning" |
| **formula** | Actionable rule | "IF price > $100 THEN anchor at 3× value" |
| **pattern** | Recurring structure | "Expert speakers use contrast framing 3:1" |
| **avatar** | Person/audience profile | "The Budget-Conscious Enterprise Buyer" |
| **argument_map** | Logical argument structure | "The case for remote work: 5-branch argument tree" |
| **narrative** | Story/narrative pattern | "The reluctant hero transformation arc" |
| **psychological** | Cognitive/behavioral insight | "Decision fatigue peaks at 3 PM in group settings" |
| **commercial** | Business/market insight | "SaaS JTBD: automate the boring part first" |

### Lifecycle Management

Every neuron tracks its maturity through lifecycle states:

\`ingested → structured → active → capitalized → compounded\`

Each stage represents increasing value density, connection richness, and proven utility. Lifecycle state influences IdeaRank and service recommendations.

## Library Interface

### Neuron List View

The main Neurons page (/neurons) presents your library as a searchable, filterable list:
- **Search** — find neurons by title or content
- **Filter by category** — show only insights, patterns, etc.
- **Sort** — by creation date, update date, or quality score
- **Bulk actions** — select multiple neurons for batch operations

### Neuron Editor

Click any neuron to open the full editor (/n/:number). The editor provides:
- **Block editing** — add, remove, and reorder content blocks
- **Metadata management** — category, visibility, tags
- **Connection management** — create and view links to other neurons
- **AI tools** — extraction, analysis, and transformation tools in the right panel
- **Version history** — track changes and restore previous versions
- **Score display** — quality metrics and IdeaRank

### Preview Pane

The neuron list includes a preview pane that shows neuron details without leaving the list view.

## Search and Discovery

### Full-Text Search

The library supports full-text search across neuron titles and block content. Search results are ranked by relevance.

### Semantic Search

Beyond keyword matching, the platform supports embedding-based semantic search. This finds neurons related to your query even when they use different terminology. If you search for "pricing strategy," the system also surfaces neurons about "value capture," "monetization approach," and "revenue model."

### Browse by Category

Filter the library by content category to explore specific knowledge types. This is useful when you're looking for all your patterns, or all your formulas.

### Browse by Episode

Filter neurons by their source episode to see everything extracted from a specific piece of content.

## Export and Integration

### Export Formats

Neurons and artifacts can be exported in multiple formats:
- **Markdown** — for use in writing tools, documentation, and publishing
- **JSON** — for programmatic access and integration
- **HTML** — for web publishing

### API Access

The platform provides API access to your neuron library. You can:
- Query neurons by semantic path
- Search by content or embedding similarity
- Create and update neurons programmatically
- Trigger service execution via API

### Marketplace Publishing

You can publish neurons and frameworks to the Marketplace for sharing or selling. Published assets become discoverable by other users and generate contribution rewards.

## Duplicate Detection

The system includes duplicate detection to keep your library clean:
- **Embedding similarity** — finds neurons with semantically similar content
- **Title matching** — detects neurons with similar titles
- **Merge suggestions** — when duplicates are found, the system suggests merging them

This prevents library bloat and ensures each knowledge unit appears only once.

## Best Practices

### 1. Title Everything Precisely
"Marketing strategy" is a poor title. "The Inverted Funnel Pricing Strategy for B2B SaaS Products" is excellent. Precise titles make search, browsing, and service selection dramatically better.

### 2. Use Categories Correctly
Don't label everything as "insight." Use the full category system. Proper categorization improves extraction quality and service recommendations.

### 3. Create Connections
Isolated neurons lose most of their value. After creating or reviewing neurons, spend time creating connections (supports, contradicts, extends, derives_from).

### 4. Review Regularly
Periodically review your library. Mark validated neurons as "structured." Connect orphans. Merge duplicates. A well-maintained library produces dramatically better service outputs.

### 5. Use the Editor's AI Tools
The neuron editor includes AI tools in the right panel (extract insights, suggest connections, analyze content). Use these to enrich neurons quickly.

## Further Reading

- [The Neuron Model](/docs/foundation/neuron-model) — understanding the atomic knowledge unit
- [Knowledge Graph](/docs/architecture/knowledge-graph) — how neurons connect
- [Service Manifests](/docs/architecture/service-manifests) — using neurons in services
- [Your First Neuron](/docs/getting-started/your-first-neuron) — getting started`,
  },
  "service-manifests": {
    title: "Service Manifests",
    content: `Service Manifests define the AI execution workflows available on the AI-IDEI platform. Each service is a structured pipeline that combines neurons with AI processing to generate specific deliverables. Services are the mechanism through which extracted knowledge becomes actionable output.

## What Is a Service?

A service is a predefined AI workflow with:
- A clear input specification (what neurons and parameters it needs)
- A processing pipeline (the AI operations it performs)
- A defined output format (what deliverable it produces)
- A fixed credit cost (how many NEURONS it consumes)

Think of services as specialized machines in a factory. You feed in raw materials (neurons) and they produce finished goods (articles, courses, strategies, profiles).

## Manifest Structure

Every service manifest contains five components:

### 1. Service Key
A unique identifier like \`generate-article\`, \`synthesize-profile\`, or \`build-course-outline\`. The key is used in API calls and URL routing.

### 2. Input Schema
What the service requires:
- **Neuron selection** — which neurons to process (by ID, category, or search)
- **Parameters** — configuration options (tone, length, target audience, etc.)
- **Context** — additional information the AI needs

### 3. Execution Pipeline
The sequence of AI operations:
- Prompt selection and construction
- Neuron content assembly
- AI model invocation
- Output parsing and formatting
- Quality validation

### 4. Deliverables Schema
What the service produces:
- Output format (markdown, HTML, structured JSON)
- Content structure (headings, sections, elements)
- Metadata (generation parameters, source references)

### 5. Credit Cost
The computational cost in NEURONS. This is fixed per service and displayed before execution.

## Service Classification

### By Function (Class)

| Class | Description | Examples |
|---|---|---|
| **A — Analysis** | Heavy extraction and analysis | Full transcript analysis, psychological profiling |
| **B — Production** | Medium processing, content generation | Article generation, course outline, marketing copy |
| **C — Orchestration** | Pipeline coordination, light operations | Formatting, summarization, entity projection |

### By Performance (Speed)

| Class | Response Time | Use Case |
|---|---|---|
| **S — Sync** | < 20 seconds | Simple transformations, formatting |
| **C — Cognitive** | 1-5 minutes | Article generation, analysis |
| **X — Extended** | 5-15 minutes | Full pipeline, batch processing |

## Execution Model

When you trigger a service, the system follows a structured execution flow:

### 1. Input Validation
The system checks your input against the service manifest schema. Missing or invalid parameters are rejected with a clear error message.

### 2. Credit Verification
Your balance is checked against the service cost. If insufficient, you're redirected to the credit top-up flow. No execution begins without confirmed credits.

### 3. Credit Reservation
Credits are reserved (deducted from available balance) but not yet spent. This prevents overdraft if you trigger multiple services simultaneously.

### 4. Job Creation
A Job object is created with status "pending." The job tracks execution progress and stores results.

### 5. AI Processing
The service pipeline executes:
- Prompt constructed from manifest template + neuron content
- AI model invoked via the Lovable AI gateway
- Response parsed and validated against output schema
- Quality checks applied

### 6. Artifact Storage
Results are saved as an Artifact in your library:
- Content in the specified format
- Metadata linking to source neurons and service
- Tags for organization
- Export-ready formatting

### 7. Credit Settlement
On success, the reservation is confirmed (credits are formally spent). On failure, credits are automatically refunded.

### 8. Notification
You receive a notification when the job completes (or fails), with a direct link to the artifact.

## Available Services

The platform offers services across several categories:

### Content Generation
- Article generation from neurons
- Social media post creation
- Blog post drafting
- Newsletter content

### Analysis
- Psychological profile synthesis
- Competitive analysis
- Market opportunity assessment
- Audience persona building

### Framework Building
- Course outline generation
- Marketing framework assembly
- Decision model construction
- Strategy document compilation

### Transformation
- Neuron summarization
- Content reformatting
- Language translation
- Tone adjustment

## Service Execution Page

Each service has a dedicated execution page (/run/:serviceKey) where you:
1. Select input neurons
2. Configure parameters
3. See the credit cost
4. Confirm and run
5. Monitor progress
6. Access results

## Batch Processing

The Batch Runner (/batch/:neuronId) enables processing multiple neurons through a single service:
- Select service and neurons
- System validates all inputs upfront
- Total credit cost calculated and displayed
- Execution runs in parallel where possible
- Results aggregated into a unified report

## Further Reading

- [Job Engine](/docs/architecture/job-engine) — execution lifecycle details
- [Credits & Pricing](/docs/getting-started/credits-system) — understanding costs
- [Neuron Library](/docs/architecture/neuron-library) — selecting input neurons
- [Your First Neuron](/docs/getting-started/your-first-neuron) — getting started with extraction`,
  },
  "job-engine": {
    title: "Job Engine",
    content: `The Job Engine orchestrates all AI service execution on the AI-IDEI platform. It manages the complete lifecycle of computational tasks — from submission through processing to delivery and billing.

## Why a Job Engine?

AI operations are not instantaneous. Generating an article might take 2 minutes. Processing a full transcript might take 5 minutes. Running a batch of 20 neurons through a service could take 15 minutes.

The Job Engine handles this asynchronous reality:
- You submit a job and continue working
- The system processes it in the background
- You're notified when it's done
- Results are stored permanently in your library

This means you never have to wait. Submit multiple jobs, continue editing neurons, and come back to find your artifacts ready.

## Job Lifecycle

Every job follows a defined state machine:

\`\`\`
pending → processing → completed
                    → failed → (retry) → pending
                             → dead_letter
\`\`\`

### States

| State | Description |
|---|---|
| **pending** | Job created, waiting for execution |
| **processing** | AI pipeline actively running |
| **completed** | Successfully finished, artifact stored |
| **failed** | Execution error occurred |
| **dead_letter** | Failed after maximum retries, requires manual review |

### Transitions

- **pending → processing** — worker picks up the job
- **processing → completed** — AI returns valid output
- **processing → failed** — error during execution
- **failed → pending** — automatic retry (with exponential backoff)
- **failed → dead_letter** — retry limit exceeded (typically 3 retries)

## Execution Pipeline (Detailed)

### Step 1: Submission
You trigger a service from the UI or API. The system creates a job record with:
- Service key (which service to run)
- Neuron IDs (input neurons)
- Author ID (your user account)
- Input parameters (service-specific configuration)
- Status: pending

### Step 2: Credit Reservation
Before any processing begins, credits are reserved:
- System calls \`reserve_credits(user_id, amount, job_id)\`
- Credits deducted from available balance
- Reservation logged in transaction ledger
- If insufficient balance: job rejected, no reservation made

### Step 3: Processing
The edge function corresponding to the service executes:
- Input neurons retrieved from database
- Prompt constructed from service manifest + neuron content
- AI model invoked (via Lovable AI gateway)
- Response parsed and validated
- Quality checks applied

### Step 4: Artifact Generation
On successful processing:
- Artifact object created in database
- Content stored with proper formatting
- Metadata links established (source neurons, service key, job ID)
- Artifact type and tags assigned

### Step 5: Settlement
- Credits formally settled: \`settle_credits(user_id, amount, job_id)\`
- Transaction logged as "spend"
- Job status updated to "completed"

### Step 6: Notification
- Notification created for the user
- Push notification sent (if enabled)
- Job appears in Jobs page with "completed" status

### Step 7: Failure Handling
If processing fails:
- Error message recorded in job
- Credits automatically refunded: \`refund_credits(user_id, amount, job_id)\`
- Retry scheduled with exponential backoff
- After max retries: moved to dead letter queue

## Job Monitoring

### Jobs Page (/jobs)
View all your jobs with:
- Status filter (pending, processing, completed, failed)
- Service type filter
- Date range filter
- Direct links to resulting artifacts

### Real-Time Updates
Job status updates in real-time. You don't need to refresh the page to see when a job completes.

### Notifications
Every completed or failed job generates a notification accessible from the notification bell in the header.

## Batch Processing

The Batch Runner processes multiple neurons through a single service:

1. **Input validation** — all neurons checked against service schema
2. **Cost estimation** — total credits calculated (per-neuron cost × count)
3. **Bulk reservation** — all credits reserved upfront
4. **Parallel execution** — jobs run concurrently where possible
5. **Result aggregation** — unified report of all outputs

Batch processing is ideal for:
- Generating articles from 10+ neurons
- Running analysis across your entire library
- Creating course modules from a neuron cluster

## Retry Logic

Failed jobs are automatically retried with exponential backoff:

| Retry | Delay |
|---|---|
| 1st | 30 seconds |
| 2nd | 60 seconds |
| 3rd | 90 seconds |

After the 3rd failed retry, the job is moved to the dead letter queue. Dead letter jobs:
- Are flagged for manual review
- Credits remain refunded
- Can be re-submitted manually after the issue is resolved

## Credit Safety

The Job Engine implements multiple credit safety mechanisms:

1. **Pre-execution check** — balance verified before job creation
2. **Reservation pattern** — credits held during execution, not spent
3. **Automatic refund** — failed jobs return credits immediately
4. **Idempotent settlement** — credits can't be double-spent
5. **Transaction audit trail** — every credit movement is logged

## Further Reading

- [Service Manifests](/docs/architecture/service-manifests) — what services are available
- [Credits & Pricing](/docs/getting-started/credits-system) — understanding credit economics
- [How It Works](/docs/getting-started/how-it-works) — the full pipeline overview`,
  },
};
