import type { DocTopic } from "../docsContent";

export const gettingStartedContent: Record<string, DocTopic> = {
  introduction: {
    title: "What is AI-IDEI?",
    content: `AI-IDEI is a knowledge extraction and capitalization platform. You give it raw content — a podcast, an interview, a lecture, a written article — and it returns structured knowledge units you can reuse, recombine, and monetize forever.

## The Problem AI-IDEI Solves

Every expert, creator, and consultant has the same problem: they produce enormous amounts of valuable content, but the knowledge inside that content stays trapped. A podcast episode gets published, listened to once or twice, and then disappears into the archive. The insights, frameworks, and strategies discussed during that episode are lost.

This is not a storage problem. It's an extraction problem.

The knowledge exists. It's buried inside hours of conversation, thousands of words, dozens of tangential discussions. Extracting it manually would take days. Most people never do it. The result is that 95% of the intellectual value created during content production is wasted.

AI-IDEI solves this by automating the extraction process. The platform uses specialized AI pipelines to analyze your content across three dimensions — psychological, narrative, and commercial — and extract every reusable knowledge unit it can find.

## Think of It This Way

You record a 1-hour podcast with a marketing expert. During that hour, the guest mentions:

- A pricing framework they use with enterprise clients
- A psychological trigger that increases conversion by 30%
- A storytelling structure they apply to sales presentations
- Three copywriting formulas they developed over 20 years
- A hiring pattern they've observed across successful companies

Without AI-IDEI, all of this stays buried in the transcript. With AI-IDEI, each of these becomes a separate, addressable, reusable **neuron** — a knowledge unit you can use to generate articles, courses, marketing copy, strategy documents, and more.

## The Core Idea

**Content decays. Knowledge compounds.**

A blog post gets old. A social media post disappears in hours. But a structured framework — like "the inverted pricing ladder" or "the 3-signal trust formula" — stays valuable forever. And it becomes MORE valuable as you connect it to other frameworks.

This is the compounding effect that makes AI-IDEI fundamentally different from content management tools. You're not storing files. You're building a knowledge graph that grows more valuable with every piece of content you process.

## Who Is This For?

AI-IDEI is designed for anyone who creates or works with knowledge-dense content:

- **Content creators** who want to turn each episode into dozens of derivative assets — articles, social posts, course modules, lead magnets — automatically
- **Consultants** who want to package their expertise into reusable frameworks, methodologies, and deliverables that scale beyond billable hours
- **Educators** who want to build comprehensive course material from lectures, workshops, and presentations
- **Marketers** who need to produce large volumes of high-quality content without starting from scratch every time
- **Authors** who want to extract, organize, and structure their ideas before writing
- **Agencies** who want to systematize their intellectual output and create reusable knowledge assets
- **Podcasters** who want to maximize the value of every episode they record

## What You Get From a Single Podcast

From one 60-minute podcast episode, the platform can extract:

- **10-30 knowledge neurons** — insights, patterns, formulas, frameworks, and strategies
- **Guest profiles** with psychological and cognitive analysis
- **Marketing frameworks** ready for client application
- **Copywriting formulas** you can use in campaigns
- **Article drafts** generated from extracted knowledge
- **Course outlines** structured around key concepts
- **Social media content** derived from key insights
- **Strategy documents** combining multiple extraction axes

All of this happens automatically. You upload. The system extracts. You review, edit, and publish.

## How AI-IDEI Is Different

Most content tools help you create new content from scratch. AI-IDEI does the opposite — it extracts the knowledge that already exists inside your content and structures it for infinite reuse.

| Traditional Tools | AI-IDEI |
|---|---|
| Create content from nothing | Extract knowledge from existing content |
| Each piece is independent | Every extraction enriches the knowledge graph |
| Output quality depends on input effort | Output quality improves as the library grows |
| Linear production | Compounding knowledge economy |

## The Knowledge Economy Model

AI-IDEI implements a knowledge economy where:

1. **Raw content** is the input (transcripts, texts, recordings)
2. **Neurons** are the processed knowledge units (insights, patterns, formulas)
3. **Services** are the AI workflows that transform neurons into deliverables
4. **Artifacts** are the final outputs (articles, courses, strategies)
5. **Credits (NEURONS)** power the computational operations

This creates a flywheel: more content → more neurons → better outputs → more value → more content uploaded.

## Getting Started

Ready to try it? Head to [Your First Neuron](/docs/getting-started/your-first-neuron) to create your first knowledge unit in 5 minutes. Or read [How It Works](/docs/getting-started/how-it-works) for a detailed walkthrough of the extraction pipeline.`,
  },
  "how-it-works": {
    title: "How It Works",
    content: `AI-IDEI works like a knowledge refinery. Raw content goes in. Structured, reusable knowledge comes out. The process is automated, systematic, and repeatable.

## The 6-Stage Pipeline

Every piece of content you upload passes through a multi-stage processing pipeline. Each stage adds structure, context, and intelligence to the raw material.

### Stage 1 — Upload (Source Ingestion)

You start by uploading your content to the **Extractor**. The platform accepts multiple input formats:

- **Audio files** — MP3, WAV, M4A, OGG
- **Video files** — MP4, WebM
- **YouTube URLs** — paste any YouTube link and the system fetches the audio
- **Plain text** — paste or type directly into the editor
- **Documents** — structured text input

The system creates an **Episode** — an internal object that tracks your content through the entire pipeline. Each episode maintains full provenance: where the content came from, when it was uploaded, and every processing step it goes through.

After upload, audio and video files are automatically sent to the transcription service. Text goes directly to the extraction stage.

### Stage 2 — Transcription

For audio and video content, the platform generates a full transcript using state-of-the-art speech-to-text models. The transcription process includes:

- **Speaker diarization** — identifying who said what (when multiple speakers are present)
- **Timestamp alignment** — every segment is timestamped for reference
- **Language detection** — automatic identification of the content language
- **Quality scoring** — confidence metrics for transcription accuracy

Transcription typically takes 1-3 minutes for a 1-hour recording. The resulting transcript is stored alongside the episode and becomes the source material for extraction.

### Stage 3 — Semantic Chunking

Raw transcripts can be thousands of words long. Processing them as a single block would produce poor results. Instead, the platform segments the transcript into semantically coherent chunks of 200-800 tokens each.

The chunking algorithm identifies natural boundaries:

- **Topic transitions** — where the conversation shifts to a new subject
- **Speaker changes** — when a different person begins speaking
- **Rhetorical shifts** — changes in argument structure or tone
- **Argument boundaries** — where one line of reasoning ends and another begins

This ensures each chunk contains a complete thought or argument, making downstream extraction more precise.

### Stage 4 — AI Extraction (Three-Axis Analysis)

This is the core intelligence layer. Each chunk is analyzed across three dimensions using 9 specialized AI prompts:

**Axis 1 — Internal / Psychological**
- Cognitive patterns and mental models used by speakers
- Decision-making frameworks and heuristics
- Behavioral insights and cognitive biases
- Risk tolerance and strategic thinking indicators

**Axis 2 — Narrative**
- Storytelling structures and narrative frameworks
- Persuasion techniques and rhetorical formulas
- Argument maps showing logical structure
- Communication patterns and framing strategies

**Axis 3 — Commercial / JTBD (Jobs-to-Be-Done)**
- Market insights and value proposition patterns
- Growth strategies and pricing models
- Customer job identification
- Competitive positioning frameworks

Each identified knowledge unit becomes a **neuron** — a self-contained, addressable, reusable piece of structured knowledge.

### Stage 5 — Knowledge Graph Integration

Extracted neurons don't exist in isolation. The system automatically:

- **Assigns categories** — marketing, psychology, strategy, narrative, etc.
- **Creates connections** — links between related neurons (supports, contradicts, extends)
- **Projects entities** — neurons become nodes in the knowledge graph
- **Computes IdeaRank** — a PageRank-style algorithm that scores entity importance based on connection topology

This transforms your flat list of neurons into a navigable, interconnected knowledge graph that reveals relationships you might not have noticed in the original content.

### Stage 6 — Asset Generation

With neurons extracted and connected, you can generate deliverables using **AI Services**:

- **Articles** — long-form content built from multiple neurons
- **Social media posts** — platform-specific content from key insights
- **Course modules** — structured learning sequences
- **Marketing copy** — campaigns built on extracted frameworks
- **Strategy documents** — comprehensive analyses combining multiple extraction axes
- **Scripts** — video/podcast scripts using proven narrative patterns

Each service has a fixed credit cost displayed before execution. You always know what you'll pay before you run anything.

## The Compounding Effect

The critical insight about the pipeline is that it improves over time. Each new piece of content enriches the knowledge graph:

- New neurons create connections to existing neurons
- More connections improve the quality of generated outputs
- Higher neuron density enables more sophisticated service execution
- The marginal cost of each extraction decreases as the graph provides more context

This is why AI-IDEI is not a content tool — it's a **knowledge infrastructure** that compounds in value with every use.

## Credit Economics

Every AI operation consumes credits (NEURONS). Exchange rate: **$1 = 500 NEURONS** (1N = $0.002).

| Operation | Credit Cost | USD Cost |
|---|---|---|
| Simple extraction (quotes, insights) | 20-47N | $0.04-$0.09 |
| Article generation | 74N | $0.15 |
| Full analysis (competitor, JTBD) | 83-110N | $0.17-$0.22 |
| Complex pipeline (avatar, campaign) | 200-380N | $0.40-$0.76 |

Subscribers get execution discounts: Core -10%, Pro -25%, Elite -40%. A Pro user running a 290N campaign pays only 218N.

Read more about credits in [Credits & Pricing](/docs/getting-started/credits-system).

## What Happens to Your Data

- **Your files are private** — only you can access uploaded content
- **Neurons are private by default** — you choose what to make public
- **Full provenance tracking** — every neuron links back to its source episode and chunk
- **Export anytime** — download your neurons, artifacts, and data

For details, see [Security & Privacy](/docs/reference/security).`,
  },
  "your-first-neuron": {
    title: "Your First Neuron",
    content: `This guide walks you through creating your first neuron on AI-IDEI. By the end, you'll have a structured knowledge unit in your library ready for reuse and AI service execution.

## What Is a Neuron?

Before we start, let's be clear about what you're creating. A **neuron** is the smallest unit of structured knowledge in AI-IDEI. Think of it as a single idea, framework, formula, or insight — self-contained enough to be useful on its own, but designed to connect with other neurons.

A neuron is NOT:
- A note or bookmark
- A summary of a long article
- A copy-paste of content

A neuron IS:
- A specific, actionable piece of knowledge
- Structured with typed content blocks (text, insight, formula, prompt, code)
- Addressable — it has a unique number and semantic path
- Connectable — it can link to other neurons
- Executable — it can be processed by AI services

## Option A — Extract from Content (Recommended)

The fastest way to create neurons is to let the AI extract them from your content.

### Step 1: Open the Extractor

Navigate to **Extractor** from the sidebar. This is the primary content ingestion interface.

### Step 2: Upload Your Content

You have several options:
- **Upload an audio file** (MP3, WAV, M4A) — a podcast episode, interview, or recording
- **Upload a video file** (MP4, WebM) — a presentation, webinar, or video interview
- **Paste a YouTube URL** — the system will fetch and transcribe the audio automatically
- **Paste text directly** — if you already have a transcript or article

For your first try, we recommend starting with a short piece — a 10-15 minute podcast clip or a 500-word article. This keeps processing time under 2 minutes.

### Step 3: Wait for Transcription

If you uploaded audio or video, the system transcribes it automatically. You'll see a progress indicator. Typical transcription times:
- 10-minute clip: ~30 seconds
- 30-minute episode: ~1-2 minutes
- 1-hour recording: ~2-3 minutes

### Step 4: Extract Neurons

Once the transcript is ready, click **Extract Neurons**. The AI analyzes the content across three axes (psychological, narrative, commercial) and identifies extractable knowledge units.

Extraction typically produces:
- 3-8 neurons from a 10-minute clip
- 10-20 neurons from a 30-minute episode
- 20-40 neurons from a 1-hour recording

### Step 5: Review and Edit

The extracted neurons appear in your neuron list. For each one:
- **Review the title** — make it specific and descriptive
- **Check the blocks** — edit content for accuracy and clarity
- **Adjust the category** — ensure it's classified correctly (insight, formula, pattern, etc.)
- **Set visibility** — keep it private or make it public

### Step 6: Save

Save the neurons you want to keep. They're now in your library, connected to the knowledge graph, and ready for AI service execution.

## Option B — Create Manually

Sometimes you want to capture a specific idea without processing a full piece of content.

### Step 1: Navigate to Neurons

Go to **Neurons** from the sidebar and click **New Neuron** (or use the shortcut).

### Step 2: Set the Title

Give your neuron a clear, specific title. Good titles describe the idea precisely:

- ✅ "The 80/20 Rule Applied to Content Marketing ROI"
- ✅ "Price Anchoring Increases Perceived Value by 40%"
- ❌ "Marketing ideas"
- ❌ "Notes from Tuesday meeting"

### Step 3: Add Content Blocks

The neuron editor supports multiple block types:
- **Text** — general explanation or context
- **Insight** — a non-obvious mechanism or causal relationship
- **Formula** — an actionable rule with conditions and outcomes
- **Prompt** — an AI prompt template
- **Code** — technical implementation
- **Data/YAML** — structured data

Add blocks that capture the essence of your idea. A typical neuron has 2-5 blocks.

### Step 4: Set Metadata

- **Category** — what type of knowledge this is (insight, pattern, formula, framework, etc.)
- **Visibility** — private (only you) or public (discoverable)
- **Tags** — optional keywords for organization

### Step 5: Create Connections

If your neuron relates to existing neurons, create connections:
- **Supports** — this neuron reinforces another
- **Contradicts** — this neuron conflicts with another
- **Extends** — this neuron builds on another
- **Derives from** — this neuron was extracted from another

Connections build the knowledge graph and improve the quality of AI service outputs.

## What Makes a Good Neuron?

A well-structured neuron follows five principles:

### 1. Atomic
One idea per neuron. If you find yourself writing "also" or "additionally," you probably have two neurons.

### 2. Self-Contained
Understandable without external context. A reader should grasp the core idea without needing to read the source material.

### 3. Specific
Precise and actionable, not vague or generic. Include numbers, conditions, and boundaries when possible.

### 4. Reusable
Applicable in multiple situations. A neuron about "how to price consulting services for European SMBs" is more specific but less reusable than "the anchoring effect in B2B pricing."

### 5. Connected
Linked to related neurons. Isolated neurons lose most of their compounding value.

## Examples

**Bad neuron:**
- Title: "Marketing is important"
- Content: "You need to do marketing to grow your business."
- Why it's bad: Obvious, vague, not actionable, not reusable.

**Good neuron:**
- Title: "Increasing Signup Friction Improves 90-Day Retention"
- Content: "When you add a qualifying question to the signup process, conversion drops 15% but 90-day retention increases by 40%. This happens because the friction filters out low-intent users who would churn anyway. The mechanism works best when the qualifying question relates to the core value proposition."
- Why it's good: Specific, counter-intuitive, mechanistic (explains HOW), includes numbers, defines when it works best.

## Next Steps

Now that you have your first neuron, explore these capabilities:

- [Run an AI Service](/docs/architecture/service-manifests) to generate deliverables from your neurons
- [Explore the Knowledge Graph](/docs/architecture/knowledge-graph) to see how your neurons connect
- [Learn about Credits](/docs/getting-started/credits-system) to understand the economics
- [Read about Extraction](/docs/pipeline/signal-extraction) to understand what the AI looks for`,
  },
  "credits-system": {
    title: "Credits & Pricing",
    content: `AI-IDEI uses a credit system called **NEURONS** to power all AI operations on the platform. This guide explains how credits work, what they cost, how to manage your balance, and how to get the most value from every credit spent.

## How Credits Work

Every AI operation on the platform — transcription, extraction, generation, analysis — has a fixed credit cost. You always see the exact price before running any operation. There are no hidden fees, no variable charges, and no surprise costs.

Credits are consumed only when an operation completes successfully. If a service execution fails, your credits are automatically refunded.

## Credit Pricing

The fundamental pricing unit:

**1000 NEURONS credits = 11 USD**

This means 1 credit costs $0.011. All credit packages follow the Root2 pricing system, where every price's digit sum reduces to 2.

## Typical Operation Costs

| Operation | Credit Cost | USD Equivalent |
|---|---|---|
| Audio transcription (1 hour) | 100-500 | $1.10-$5.50 |
| Neuron extraction (full transcript) | 500-2000 | $5.50-$22.00 |
| Single article generation | 300-800 | $3.30-$8.80 |
| Guest profile analysis | 200-500 | $2.20-$5.50 |
| Knowledge graph projection | 100-300 | $1.10-$3.30 |
| Full pipeline (upload → artifacts) | 2000-5000 | $22.00-$55.00 |

## Real-World Cost Example

You upload a 45-minute podcast episode. Here's the full cost breakdown:

1. **Transcription:** 300 credits
2. **Semantic chunking:** 50 credits
3. **Neuron extraction (3-axis):** 1500 credits
4. **Guest profile generation:** 300 credits
5. **Entity projection:** 100 credits
6. **3 articles generated:** 900 credits
7. **Total:** 3150 credits (~$34.65)

**What you get:**
- Full transcript with timestamps
- 18 structured neurons (insights, patterns, formulas)
- 1 guest psychological profile
- Knowledge graph entities with IdeaRank scores
- 3 ready-to-publish articles

**Cost per deliverable:** ~$1.50

Compare this to hiring a content writer ($50-200 per article) or a research analyst ($100-500 per analysis), and the value proposition becomes clear.

## Getting Credits

### Welcome Bonus
Every new account receives **500 NEURONS** for free. This is enough to run a basic extraction pipeline on a short piece of content, giving you a hands-on experience of what the platform can do.

### Credit Top-Up
Buy additional credits through the **Credits** page. Packages are available via secure Stripe checkout. Larger packages offer better value per credit.

### Subscription Plans
Monthly subscription plans include a recurring credit allocation plus platform features. Check the Credits page for current plan options.

### Contribution Rewards
You can earn credits by contributing to the platform:
- Writing knowledge base articles
- Submitting feedback and improvement proposals
- Participating in community discussions
- Reporting bugs

## Managing Your Balance

### Balance Visibility
Your current credit balance is always visible in the sidebar. You never have to wonder how many credits you have.

### Transaction History
The Credits page shows your complete transaction history:
- Every credit purchase (top-ups, bonuses)
- Every credit expenditure (services, extractions)
- Refunds from failed operations
- Contribution rewards

### Low Balance Alerts
When your balance drops below 50 credits, you'll receive a notification. This gives you time to top up before you run out during an important workflow.

### Usage Analytics
The Credits page includes consumption charts showing:
- Daily and monthly credit usage trends
- Cost per service type breakdown
- Average cost per deliverable
- Projected balance based on usage patterns

## Credit Reservation System

When you trigger a service execution, the system follows a reservation pattern:

1. **Check** — verify your balance covers the service cost
2. **Reserve** — credits are held (deducted from available balance)
3. **Execute** — the AI service runs
4. **Settle** — on success, the reservation is confirmed
5. **Refund** — on failure, credits are returned automatically

This ensures you're never charged for failed operations and prevents overdraft situations.

## Cost Optimization Tips

### 1. Start with Short Content
For your first extractions, use 10-15 minute clips instead of full hours. This lets you evaluate quality at lower cost.

### 2. Review Before Bulk Processing
Extract from one episode first. Review the neuron quality. Then batch-process remaining episodes once you're satisfied.

### 3. Use Services Strategically
Not every neuron needs every service. Prioritize services based on what you'll actually use — don't generate articles you won't publish.

### 4. Build Your Graph First
The more neurons in your graph, the better the AI services perform. Invest early in extraction; the generation quality improves as your library grows.

### 5. Check Service Costs Before Running
Every service displays its credit cost upfront. Compare costs between similar services and choose the one that best fits your needs.

## Enterprise & Volume Pricing

For organizations processing large volumes of content, custom pricing is available. Contact us for:
- Volume discounts on credit packages
- Custom service configurations
- API access for automated pipelines
- Dedicated support

## Further Reading

- [How It Works](/docs/getting-started/how-it-works) — understand the full pipeline
- [Service Manifests](/docs/architecture/service-manifests) — learn about service costs
- [Job Engine](/docs/architecture/job-engine) — understand execution and billing`,
  },
};
