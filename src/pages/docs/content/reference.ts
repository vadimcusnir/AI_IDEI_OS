import type { DocTopic } from "../docsContent";

export const referenceContent: Record<string, DocTopic> = {
  faq: {
    title: "Frequently Asked Questions",
    content: `This page answers the most common questions about the AI-IDEI platform. If you can't find your answer here, use the Feedback page to submit your question.

## Getting Started

### What file formats can I upload?
You can upload MP3, WAV, M4A audio files, MP4/WebM video files, paste YouTube URLs, or enter plain text directly. The system handles transcription automatically for audio and video content.

### How long does processing take?
Processing times depend on the operation:
- **Transcription:** 30 seconds to 3 minutes for a 1-hour file
- **Semantic chunking:** 10-30 seconds
- **Neuron extraction:** 2-5 minutes depending on transcript length
- **Service execution:** 30 seconds to 15 minutes depending on complexity
- **Full pipeline (upload → artifacts):** 5-15 minutes total

### Can I edit extracted neurons?
Yes. Every extracted neuron is fully editable. You can change the title, modify content blocks, add or remove blocks, adjust categories, create connections to other neurons, and set visibility. The neuron editor provides a full-featured interface for all these operations.

### Is there a limit on how much I can upload?
There are no hard limits on the number of uploads. Processing is limited by your credit balance — each operation consumes credits. As long as you have credits, you can continue processing content.

## Credits & Pricing

### What are NEURONS credits?
NEURONS are the compute currency of the platform. Every AI operation costs a fixed number of credits. The pricing is transparent — you always see the exact cost before running any operation.

**Base rate:** 1000 credits = 11 USD (one credit = $0.011)

### How do I get credits?
There are several ways to obtain credits:
- **Welcome bonus:** Every new account receives 500 free credits
- **Top-up:** Buy credit packages through the Credits page via Stripe
- **Subscription:** Monthly plans include recurring credit allocations
- **Contributions:** Earn credits by contributing to the platform (articles, feedback, community participation)

### What happens if I run out of credits?
You'll see a low balance warning when your credits drop below 50. You can top up anytime from the Credits page. If you try to run a service with insufficient credits, the system will prompt you to top up before proceeding.

### Are credits refunded if a service fails?
Yes. Credits are reserved (held) during execution, not spent. If a service execution fails for any reason, your credits are automatically and immediately refunded. You can see refunds in your transaction history.

### What are credit packages?
Credit packages are pre-defined amounts you can purchase:
- Packages follow the Root2 pricing system (digit sums equal 2)
- Larger packages offer better value per credit
- Purchase is via secure Stripe checkout

## Content & Privacy

### Is my content private?
Yes. Your uploaded files, transcripts, and extracted neurons are private by default. Only you can see them. You explicitly choose what to make public — private content is never shared, sold, or used for training.

### Can I delete my data?
Yes. You can delete any content, neuron, artifact, or profile at any time. Deletion is permanent. The platform also supports GDPR data export and deletion requests.

### Can I export my work?
Yes. Neurons and artifacts can be exported in multiple formats:
- **Markdown** — for use in writing tools, documentation, and publishing
- **JSON** — for programmatic access and integration
- **HTML** — for web publishing

### Who owns the extracted knowledge?
You own all your data and extracted knowledge. Your uploads, transcripts, neurons, and artifacts are your intellectual property.

## Technical

### What AI models are used?
The platform uses state-of-the-art language models for transcription, extraction, and generation. Models are selected automatically based on the task to optimize quality and cost. The specific models may change as better options become available — the platform always uses the best available technology.

### How is the knowledge graph built?
As you extract neurons, the system automatically identifies semantic relationships between them. Neurons that share concepts, reference similar patterns, or build on each other are linked. You can also create manual connections from the neuron editor. The graph is scored using IdeaRank (a PageRank-style algorithm) to surface the most important entities.

### Can I access my data via API?
Yes. The platform provides API access to your neuron library. API keys can be generated from your profile settings with configurable scopes and rate limits.

### What happens if a service fails?
If a service execution fails:
1. Your credits are automatically refunded
2. You receive a notification explaining the error
3. The failed job appears in your Jobs page
4. You can retry the job (the system will attempt up to 3 automatic retries with exponential backoff)

## Platform

### Can I use the platform in multiple languages?
The platform interface is available in English, Romanian, and Russian. Content extraction works with any language supported by the underlying AI models, including most major languages. Entity pages support localized content.

### Is there a mobile app?
The platform is a responsive web application that works on mobile devices. There is no native mobile app at this time, but the responsive design provides a good experience on tablets and smartphones.

### How do I report a bug or suggest a feature?
Use the **Feedback** button (floating action button in the bottom-right corner) to submit:
- Bug reports
- Feature suggestions
- General feedback
- Testimonials

All feedback is reviewed by the team.

## Further Reading

- [How It Works](/docs/getting-started/how-it-works) — detailed pipeline walkthrough
- [Credits & Pricing](/docs/getting-started/credits-system) — full pricing explanation
- [Security & Privacy](/docs/reference/security) — data protection details
- [Glossary](/docs/reference/glossary) — terminology reference`,
  },
  glossary: {
    title: "Glossary",
    content: `This glossary defines the key terms used throughout the AI-IDEI platform and documentation. Understanding these terms will help you navigate the platform effectively and communicate precisely about its capabilities.

## Core Entities

### Neuron
The atomic unit of knowledge on the AI-IDEI platform. A self-contained idea, framework, pattern, or formula extracted from content. Neurons contain typed content blocks, carry metadata (category, lifecycle, visibility), and connect to other neurons via typed relationships. Every neuron has a unique numeric ID, a UUID, and a semantic address (NAS path).

**Related:** [The Neuron Model](/docs/foundation/neuron-model)

### Episode
A piece of uploaded content — an audio file, video, text document, or URL — that serves as source material for extraction. Episodes track processing status through the pipeline: uploaded → transcribing → transcribed → extracting → completed.

### Artifact
A generated deliverable produced by running an AI service on neurons. Artifacts include articles, scripts, course modules, strategy documents, and other outputs. Each artifact is stored in the Library and linked to its source neurons and generating service.

### Block
A content unit within a neuron. Blocks are typed — each type serves a specific function:
- **Text** — general explanation or context
- **Insight** — non-obvious mechanism
- **Formula** — actionable rule with conditions
- **Framework** — complete mental model
- **Prompt** — AI prompt template
- **Code** — technical implementation
- **Data/YAML** — structured data
- **Checklist** — actionable steps

### Entity
A node in the knowledge graph. Entities are projections of neurons into the graph structure, classified by type (insight, pattern, formula, contradiction, application, profile). Entities have IdeaRank scores and can be published as public pages.

## Processing

### Extraction
The process of analyzing content to identify and structure knowledge units. Extraction uses a three-axis analysis (psychological, narrative, commercial) with 9 specialized AI prompts to identify signals in transcript chunks.

**Related:** [Signal Extraction](/docs/pipeline/signal-extraction)

### Semantic Chunking
The process of segmenting transcripts into coherent segments of 200-800 tokens. Chunks are divided by meaning (topic transitions, speaker changes, argument boundaries), not by arbitrary word count.

**Related:** [Transcript Refinery](/docs/pipeline/transcript-refinery)

### Signal
A identifiable knowledge structure embedded in natural language. Signals are the raw form of insights, patterns, and formulas before full neuron structuring. The extraction pipeline identifies signals and promotes the highest-quality ones to neuron status.

### Synthesis
The process of combining multiple signals, patterns, and formulas into higher-order structures (profiles, frameworks, decision models). Synthesis produces the most complex and valuable derivatives.

**Related:** [Synthesis Layer](/docs/pipeline/synthesis-layer)

## Organization

### Knowledge Graph
The network of connections between entities. The graph stores neurons and their relationships (supports, contradicts, extends, derives_from), enabling traversal, discovery, and importance scoring.

**Related:** [Knowledge Graph](/docs/architecture/knowledge-graph)

### NAS (Neuron Addressing System)
A hierarchical semantic path that locates a neuron by meaning: \`/domain/category/subcategory\`. Example: \`/marketing/pricing/anchoring-effect\`. NAS enables browsing, clustering, and URL-based access.

### IdeaRank
A PageRank-style algorithm that scores entity importance based on knowledge graph topology. Entities with more connections, higher-quality sources, and greater reuse receive higher IdeaRank scores.

### Lifecycle
The maturity stages of a neuron representing increasing value density:
\`ingested → structured → active → capitalized → compounded\`

## Derivative Types

### Insight
A non-obvious mechanism affecting decisions. Must be non-obvious, mechanistic (explains HOW), and actionable.

### Pattern
A recurring cognitive structure detected across 3+ independent sources. More reliable than individual insights.

### Formula
An operational rule with defined conditions, actions, outcomes, and boundaries. The most directly actionable derivative type.

### Profile
An intelligence derivative synthesized from transcript analysis of a specific subject. Maps cognitive patterns, decision styles, and strategic behaviors.

### Decision Artifact
The highest-order derivative combining insights, patterns, formulas, and contradictions into executable decision frameworks.

**Related:** [Intelligence Assets](/docs/foundation/intelligence-assets)

## Economics

### NEURONS (Credits)
The compute currency that powers all AI operations. Fixed pricing: 1000 credits = 11 USD. Credits are consumed by transcription, extraction, and generation services.

**Related:** [Credits & Pricing](/docs/getting-started/credits-system)

### Service
An AI workflow that processes neurons to generate specific outputs. Each service has a manifest defining input schema, processing pipeline, output format, and credit cost.

**Related:** [Service Manifests](/docs/architecture/service-manifests)

### Job
A single execution of a service. Jobs track status (pending → processing → completed/failed), store results as artifacts, and handle credit reservation/settlement.

**Related:** [Job Engine](/docs/architecture/job-engine)

## Platform Components

### Extractor
The content ingestion interface where you upload files, paste URLs, and initiate transcription and extraction.

### Library
The artifact storage and retrieval interface where generated outputs are organized and accessible.

### Intelligence
The knowledge graph visualization and analytics interface showing entity connections, IdeaRank scores, and graph topology.

### Marketplace
The platform for sharing and discovering knowledge assets (templates, frameworks, neurons) contributed by users.

### Community
The forum and discussion space for platform users.

## Further Reading

- [What is AI-IDEI?](/docs/getting-started/introduction) — platform overview
- [How It Works](/docs/getting-started/how-it-works) — pipeline walkthrough
- [FAQ](/docs/reference/faq) — common questions answered`,
  },
  security: {
    title: "Security & Privacy",
    content: `AI-IDEI is built with security and privacy as foundational requirements, not afterthoughts. This page details how your data is protected, what controls you have, and what security measures are in place at every layer of the platform.

## Data Ownership

You own all your data. This includes:
- **Uploaded files** — audio, video, text, and documents
- **Transcripts** — generated from your uploads
- **Neurons** — extracted knowledge units
- **Artifacts** — generated deliverables
- **Profiles** — your account information and settings
- **Guest profiles** — profiles generated from your content

AI-IDEI does not sell, share, or use your private data for model training. Your intellectual property remains yours.

## Privacy Controls

### Default Privacy
All content is **private by default**. When you upload a file, extract neurons, or generate artifacts, everything starts as private — visible only to you.

### Explicit Publishing
You choose what to make public. Publishing requires explicit action:
- Neuron visibility can be set to "public" in the editor
- Guest profiles require your approval before publishing
- Entity pages are published by administrators for the knowledge graph
- Artifacts remain private unless you explicitly share them

### Data Deletion
You can delete any data at any time:
- Delete individual neurons, artifacts, and episodes
- Delete your entire account and all associated data
- Request GDPR-compliant data export before deletion

### GDPR Compliance
The platform supports GDPR requirements:
- Data export (download all your data)
- Data deletion (remove all your data)
- Consent management (cookie consent for analytics)
- Data processing transparency (this document)

## Authentication & Access Control

### Authentication Methods
- **Email + password** — standard signup with email verification
- **Secure session management** — JWT-based sessions with automatic refresh
- **Password reset** — secure email-based password recovery

### Role-Based Access Control (RBAC)
The platform implements a strict role system:
- **User** — standard access to personal features
- **Moderator** — additional community management capabilities
- **Admin** — full platform administration

Roles are stored in a separate \`user_roles\` table (never on the user profile) and checked via a \`SECURITY DEFINER\` function to prevent privilege escalation.

### Row-Level Security (RLS)
Every database table has Row-Level Security policies that enforce access rules at the database level:
- Users can only read their own private data
- Public data is readable by all authenticated users
- Admin operations require verified admin role
- Service role operations are restricted to backend functions

This means that even if application code has a bug, the database itself prevents unauthorized access.

## Infrastructure Security

### Encryption
- **In transit:** All data is encrypted via HTTPS/TLS
- **At rest:** Database encryption provided by the infrastructure layer
- **Secrets:** API keys and credentials are stored in secure environment variables, never in code

### Edge Function Security
Backend functions (edge functions) implement multiple security layers:
- JWT verification on protected endpoints
- Input validation and sanitization
- Rate limiting on expensive operations
- Error handling that doesn't leak internal details

### Payment Security
- Payments are processed via **Stripe** — a PCI DSS Level 1 certified payment processor
- AI-IDEI never stores credit card numbers or payment credentials
- All payment operations use server-side Stripe API calls
- Webhook signatures are verified to prevent tampering

## Abuse Prevention

### Rate Limiting
The platform implements rate limiting to prevent abuse:
- API key daily request limits
- Access check frequency monitoring (prompt probing detection)
- Artifact generation rate monitoring (export farming detection)

### Abuse Detection
Automated systems detect suspicious behavior:
- **Prompt probing** — excessive access checks in short time windows
- **Export farming** — unusually high artifact generation rates
- **Account sharing** — simultaneous sessions from unusual locations

### Escalation Ladder
Detected abuse triggers a graduated response:
1. **Warning** — notification to the user
2. **Cooldown** — temporary rate limiting
3. **Downgrade** — credit penalty
4. **Suspension** — account freeze

### Decision Ledger
All access control decisions are recorded in an immutable, hash-chained ledger. This provides:
- Complete audit trail of who accessed what and when
- Tamper detection through cryptographic hash chains
- Regulatory compliance evidence

## Monitoring & Incident Response

### Logging
The platform maintains detailed logs of:
- Authentication events
- Access control decisions
- Credit transactions
- Service executions
- Error events

### Compliance Log
Administrative actions are recorded in a compliance log with:
- Actor identification
- Action description
- Severity classification
- Target resource identification
- Timestamp and metadata

## Your Responsibilities

To maintain account security:
- Use a strong, unique password
- Don't share your API keys
- Review your transaction history regularly
- Report suspicious activity via the Feedback page
- Keep your email address current for security notifications

## Further Reading

- [FAQ](/docs/reference/faq) — common questions including privacy topics
- [Credits & Pricing](/docs/getting-started/credits-system) — payment and billing details
- [What is AI-IDEI?](/docs/getting-started/introduction) — platform overview`,
  },
};
