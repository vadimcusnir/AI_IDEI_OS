import type { DocTopic } from "../docsContent";

export const tutorialsContent: Record<string, DocTopic> = {
  "first-extraction": {
    title: "Your First Extraction",
    content: `This tutorial walks you through extracting knowledge from your first piece of content — from upload to neuron library in under 10 minutes.

## What You'll Need

- An AI-IDEI account with credits (500 free credits on signup)
- A content source: audio file, video, YouTube URL, or text

## Step 1: Upload Your Content

Navigate to **Create → Extract** from the sidebar. You'll see the upload interface with multiple input options.

**Supported Formats:**

| Format | Types | Max Size |
|--------|-------|----------|
| Audio | MP3, WAV, M4A, OGG | 500 MB |
| Video | MP4, WebM, MOV | 2 GB |
| URL | YouTube, Vimeo | Any length |
| Text | Plain text, Markdown | 100,000 chars |

**Options:**
- **YouTube URL** — paste any YouTube video URL; the system fetches and transcribes automatically
- **Audio/Video** — drag & drop or click to upload files
- **Text** — paste or type content directly into the text editor

Click **Upload** or **Start Transcription**. The system begins processing immediately and shows a real-time progress indicator.

## Step 2: Wait for Transcription

For audio/video content, transcription typically takes:

| Content Length | Processing Time |
|---------------|----------------|
| 5 minutes | ~15 seconds |
| 30 minutes | ~45 seconds |
| 1 hour | ~90 seconds |
| 2+ hours | ~3 minutes |

The system uses advanced speech-to-text models optimized for accuracy across multiple languages. Speaker detection is automatic for multi-speaker content.

## Step 3: Review the Transcript

Once transcription is complete, the full text appears in the transcript viewer. You can:
- Read through the content for accuracy
- See speaker labels (if detected)
- Check timestamps for reference
- Edit any transcription errors directly

**Pro tip:** Higher-quality audio produces significantly better transcriptions. If possible, use studio-quality recordings or noise-reduced files.

## Step 4: Extract Neurons

Click **Extract Neurons** to start the AI extraction pipeline. The system runs a multi-stage process:

1. **Semantic Chunking** — segments the transcript into coherent chunks of 200-800 tokens based on meaning, not arbitrary word count
2. **Three-Axis Analysis** — analyzes each chunk across psychological, narrative, and commercial dimensions
3. **Signal Detection** — identifies knowledge signals (insights, patterns, formulas, frameworks) using 9 specialized prompts
4. **Neuron Structuring** — promotes the highest-quality signals to full neuron status with typed blocks
5. **Graph Integration** — creates connections between new neurons and existing knowledge

Processing time: 2-5 minutes depending on transcript length.

**Credit cost estimates:**

| Transcript Length | Approximate Cost |
|-------------------|-----------------|
| Short (< 2000 words) | 50-80 credits |
| Medium (2000-8000 words) | 80-150 credits |
| Long (8000+ words) | 150-300 credits |

## Step 5: Review Your Neurons

Navigate to **Create → Knowledge** to see your extracted neurons. Each neuron displays:

- **Title** — a descriptive, searchable name
- **Content blocks** — typed blocks (insight, formula, framework, prompt, etc.)
- **Category** — classification (e.g., framework, pattern, insight)
- **Lifecycle** — maturity stage (ingested → structured → active → capitalized → compounded)
- **Unique ID** — numeric identifier and UUID
- **NAS Path** — semantic address (e.g., /marketing/pricing/anchoring-effect)

Click any neuron to open the full editor where you can refine content, add blocks, set visibility, and create connections.

## Troubleshooting

### Transcription seems inaccurate
- Check audio quality — background noise reduces accuracy
- Try a shorter segment first to verify
- Edit errors directly in the transcript viewer

### No neurons were extracted
- Ensure the content has substantive knowledge (tutorials, interviews, expert discussions work best)
- Very short content (< 500 words) may not produce meaningful neurons
- Check that extraction completed successfully in the Jobs page

### Credits weren't deducted
- Credits are reserved during processing, then settled on completion
- If a job fails, credits are automatically refunded
- Check your transaction history in the Credits page

## What's Next?

- [Creating AI Outputs](/docs/tutorials/creating-outputs) — generate articles, scripts, and more from your neurons
- [Building Collections](/docs/tutorials/building-collections) — organize neurons into thematic groups
- [Automating Workflows](/docs/tutorials/automating-workflows) — set up automated extraction pipelines`,
  },
  "creating-outputs": {
    title: "Creating AI Outputs",
    content: `Once you have neurons in your library, you can generate dozens of professional deliverables using AI services. This tutorial shows you how to go from neurons to finished outputs.

## Understanding Services

Services are AI workflows that combine your neurons with specialized prompts to generate specific output types. Each service is defined by a **manifest** that specifies:

- **Input schema** — what neurons and parameters are needed
- **Processing pipeline** — how the AI processes input
- **Output format** — what the deliverable looks like
- **Credit cost** — how many credits the execution costs

## Available Service Categories

The platform offers 80+ specialized services organized into categories:

| Category | Examples | Typical Cost |
|----------|----------|-------------|
| Content | Articles, blog posts, newsletters | 20-50 credits |
| Marketing | Ad copy, landing pages, email sequences | 30-80 credits |
| Education | Course modules, quizzes, lesson plans | 40-100 credits |
| Strategy | Competitive analysis, SWOT, positioning | 50-120 credits |
| Communication | Presentations, pitch decks, scripts | 30-70 credits |
| Social | Social media posts, threads, carousels | 15-40 credits |
| Sales | Sales pages, proposals, case studies | 40-90 credits |

## Step 1: Choose a Service

Navigate to **Operate → Services**. Browse the service catalog or search for a specific output type.

Each service card shows:
- **Name** and description
- **Credit cost** (exact or estimated range)
- **Input requirements** (minimum number of neurons, required types)
- **Expected output format** (Markdown, structured JSON, HTML)
- **Average execution time**

**Pro tip:** Start with simpler services (social media posts, short articles) to learn the workflow before running complex services (full courses, strategy documents).

## Step 2: Select Input Neurons

Click **Run** on your chosen service. The system asks you to select input neurons.

**Selection methods:**
- **Manual selection** — pick specific neurons from your library
- **Smart selection** — let the AI auto-select relevant neurons based on the service type
- **Collection-based** — select an entire collection of neurons
- **Batch selection** — choose neurons from a specific extraction batch

**Input quality matters:** The quality of your output directly correlates with the quality and relevance of your input neurons. More context-rich, well-structured neurons produce better results.

## Step 3: Configure & Execute

Review the service configuration panel:

1. **Verify inputs** — confirm selected neurons are appropriate
2. **Check credit cost** — see the exact cost before execution
3. **Adjust parameters** — some services offer configuration options:

| Parameter | Description |
|-----------|-------------|
| Tone | Professional, casual, academic, persuasive |
| Length | Short, medium, long, comprehensive |
| Audience | Beginners, intermediate, advanced, general |
| Language | Output language (may differ from input) |
| Format | Markdown, HTML, structured JSON |

4. Click **Execute**

Credits are **reserved** (held) during execution — not spent until completion. If the service fails, your credits are automatically refunded.

## Step 4: Monitor Execution

Track your job in real-time:
- **Pipeline indicator** — shows progress in the header bar
- **Jobs page** — detailed status at **Operate → Jobs**
- **Notifications** — bell icon alerts you when the job completes

Execution times vary:

| Service Complexity | Typical Duration |
|-------------------|-----------------|
| Simple (posts, captions) | 15-30 seconds |
| Medium (articles, emails) | 1-3 minutes |
| Complex (courses, strategies) | 5-15 minutes |

## Step 5: Retrieve Your Artifact

When the service completes:

1. Navigate to **Explore → Library**
2. Find your new artifact (sorted by creation date)
3. Click to open the full content viewer
4. Export in your preferred format:
   - **Markdown** — for writing tools, docs, publishing
   - **JSON** — for programmatic use and integration
   - **HTML** — for web publishing
   - **Copy to clipboard** — for quick paste

## Batch Execution

The real power emerges when you run multiple services on the same neurons:

**Example — from one podcast transcript:**
1. Extract neurons (50-200 credits)
2. Generate 5 social media posts (75 credits)
3. Write a blog article (40 credits)
4. Create an email newsletter (35 credits)
5. Build a presentation outline (45 credits)
6. Produce a course module (80 credits)

**Total cost:** ~475 credits (~$5.25)
**Total outputs:** 6+ professional deliverables

This is the "Magic Marketing Button" — one input, dozens of outputs.

## Pro Tips

- **Batch execution** — run multiple services on the same neurons to maximize value per extraction
- **Templates** — save service configurations as templates for repeated use
- **Quality investment** — spend time refining neuron quality; it directly improves all outputs
- **Iterate** — if an output isn't perfect, refine input neurons and re-run
- **Combine sources** — use neurons from multiple extractions for richer, more comprehensive outputs

## Further Reading

- [Building Collections](/docs/tutorials/building-collections) — organize neurons for better service inputs
- [Service Manifests](/docs/architecture/service-manifests) — how services are defined
- [Credits & Pricing](/docs/getting-started/credits-system) — understand the economics`,
  },
  "building-collections": {
    title: "Building Collections",
    content: `Collections help you organize neurons thematically, making them easier to find and exponentially more powerful when used together as service inputs.

## Why Collections Matter

Individual neurons are valuable. But neurons organized into collections unlock compound value:
- **Services produce richer outputs** when given thematically coherent collections
- **The knowledge graph surfaces stronger relationships** between grouped neurons
- **You build a structured knowledge library** that grows more valuable over time
- **Reuse becomes effortless** — select a collection instead of picking individual neurons

## Creating a Collection

1. Navigate to **Create → Knowledge**
2. Click **New Folder** in the sidebar
3. Name your collection with a clear, descriptive title
4. Drag neurons into the collection, or use the neuron editor to assign folders

**Naming conventions that work:**
- "Pricing Frameworks & Tactics"
- "B2B Sales Psychology Patterns"
- "Email Marketing — Sequences & Templates"
- "Course: Advanced Negotiation (Source Material)"

## Organization Strategies

### By Topic
Group neurons that share a subject area:
- "Email Marketing Tactics" — all email-related insights and formulas
- "B2B Sales Patterns" — recurring patterns in B2B sales conversations
- "Customer Psychology" — cognitive biases, decision-making frameworks
- "Content Strategy" — content creation and distribution patterns

### By Source
Group neurons from the same content or source:
- "Podcast EP.42 — Guest Interview"
- "Webinar Series Q1 2026"
- "Book Notes: Influence by Cialdini"

### By Project
Group neurons for a specific output or deliverable:
- "Course: Advanced Pricing — Source Neurons"
- "Book Draft: Marketing Patterns — Research"
- "Client Project: Brand Strategy Q2"

### By Lifecycle Stage
Group neurons by their maturity level:
- "Raw Insights — Needs Review"
- "Validated Frameworks — Ready for Services"
- "High-Value Patterns — Compounded"

## Using Collections with Services

When running a service, you can select an entire collection as input instead of picking individual neurons. This provides:
- **More context** — the AI sees related neurons together, producing more coherent outputs
- **Better cross-referencing** — patterns across neurons are detected and synthesized
- **Consistent outputs** — thematic coherence produces more focused deliverables

**Best practice:** Create purpose-built collections for specific service runs. A collection of 10-30 well-curated neurons typically produces the best results.

## Managing Collections

### Metrics
Each collection displays:
- Number of neurons
- Dominant categories
- Average quality score
- Last updated timestamp

### Nesting
Collections can contain sub-collections for complex organization:
\`\`\`
Marketing/
  ├── Pricing/
  │   ├── Anchoring Patterns
  │   └── Discount Frameworks
  ├── Email/
  │   ├── Subject Lines
  │   └── Sequence Templates
  └── Social/
      ├── Hooks & Headlines
      └── Engagement Patterns
\`\`\`

## Sharing Collections

Collections can be shared via the Marketplace:

1. Set individual neurons to "public" visibility
2. Package the collection with a title and description
3. Optionally set a price in NEURONS credits
4. Submit for community review

Shared collections maintain attribution — your name appears as the creator, and you earn credits when others use your work.

## Further Reading

- [Creating AI Outputs](/docs/tutorials/creating-outputs) — use collections as service inputs
- [Automating Workflows](/docs/tutorials/automating-workflows) — automated pipelines
- [Knowledge Graph](/docs/architecture/knowledge-graph) — how neurons connect`,
  },
  "automating-workflows": {
    title: "Automating Workflows",
    content: `AI-IDEI supports automation through webhooks, API integrations, and third-party connectors. This tutorial shows how to set up automated knowledge pipelines that run without manual intervention.

## Why Automate?

Manual extraction works for occasional content. But if you produce content regularly — podcasts, newsletters, interviews — automation eliminates repetitive work:

- **Podcast drops** → automatic transcription + extraction + social media posts
- **Blog published** → automatic neuron extraction + knowledge graph update
- **Newsletter sent** → automatic pattern detection + insight archiving

## Webhook-Based Automation

### Incoming Webhooks — Send Content to AI-IDEI

Send content to the platform automatically from any system:

1. Go to **Operate → Integrations** → Webhooks tab
2. Copy your webhook URL and API key
3. Send POST requests with content:

\`\`\`json
POST /webhooks/incoming
Content-Type: application/json
X-Webhook-Key: your-key-here

{
  "title": "Episode 42 — Pricing Psychology",
  "content": "Full transcript text here...",
  "source_type": "podcast",
  "auto_extract": true,
  "tags": ["pricing", "psychology", "podcast-s2"],
  "metadata": {
    "guest": "Dr. Jane Smith",
    "duration_minutes": 45
  }
}
\`\`\`

When \`auto_extract\` is true, the system automatically:
1. Creates an episode from the content
2. Runs semantic chunking
3. Executes the full 9-prompt extraction pipeline
4. Stores neurons in your library
5. Sends an \`extraction.complete\` outgoing webhook

### Outgoing Webhooks — Get Notified When Things Happen

Subscribe to platform events and receive real-time notifications:

| Event | When It Fires |
|-------|--------------|
| \`neuron.created\` | A new neuron is extracted |
| \`job.completed\` | A service finishes execution |
| \`job.failed\` | A service execution fails |
| \`extraction.complete\` | Full extraction pipeline done |
| \`artifact.created\` | A new deliverable is generated |
| \`credits.low\` | Credit balance drops below threshold |

Configure at **Operate → API** → Webhooks section. See the [Webhooks Guide](/docs/developer/webhooks) for detailed setup.

## Example: Automated Podcast Pipeline

Here's a complete automated workflow for a weekly podcast:

### Pipeline Flow

\`\`\`
Podcast Published
  ↓
RSS Feed Trigger (Zapier/Make)
  ↓
Incoming Webhook → AI-IDEI
  ↓
Auto-Transcription
  ↓
Auto-Extraction
  ↓
Outgoing Webhook: extraction.complete
  ↓
API: Run "Social Posts" Service
  ↓
API: Run "Newsletter" Service
  ↓
API: Run "Blog Article" Service
  ↓
Outgoing Webhook: artifacts.created
  ↓
Send artifacts to CMS / social scheduler
\`\`\`

### Implementation Steps

1. **Set up the RSS trigger** — use Zapier or Make.com to watch your podcast RSS feed
2. **Configure the incoming webhook** — send new episode content to AI-IDEI
3. **Enable auto-extraction** — set \`auto_extract: true\` in the webhook payload
4. **Create an automation server** — a simple script that listens for outgoing webhooks and triggers service executions via the API
5. **Connect your output tools** — send generated artifacts to your CMS, email tool, or social scheduler

### Cost Estimate

For a typical 45-minute podcast episode:
- Transcription: ~20 credits
- Extraction: ~150 credits
- 3 service executions: ~120 credits
- **Total: ~290 credits (~$3.20)**

Output: 3+ professional deliverables, automatically generated.

## Zapier Integration

Connect AI-IDEI to 5000+ apps via Zapier:

**Triggers** (when something happens in AI-IDEI):
- New neuron created
- Extraction finished
- New artifact generated
- Credit balance low

**Actions** (do something in AI-IDEI):
- Create a neuron
- Run an extraction
- Ingest a document
- Execute a service

### Popular Zapier Recipes

| Trigger | Action | Use Case |
|---------|--------|----------|
| New YouTube Video | AI-IDEI: Ingest + Extract | Auto-process video content |
| New WordPress Post | AI-IDEI: Ingest | Archive blog knowledge |
| AI-IDEI: Artifact Created | Notion: Create Page | Save outputs to Notion |
| AI-IDEI: Artifact Created | Slack: Post Message | Notify team of new content |
| Google Calendar: Event Ended | AI-IDEI: Ingest | Process meeting transcripts |

## API-Based Automation

For full programmatic control, use the REST API:

\`\`\`bash
# 1. Upload content
curl -X POST ".../webhook-ingest" \\
  -H "X-Webhook-Key: key" \\
  -d '{"title": "New Content", "content": "...", "auto_extract": true}'

# 2. Poll for extraction completion
curl -X GET ".../neuron-api/jobs?status=completed&limit=1" \\
  -H "X-API-Key: aidei_xxx"

# 3. Run a service on extracted neurons
curl -X POST ".../neuron-api/jobs" \\
  -H "X-API-Key: aidei_xxx" \\
  -d '{"service_key": "social_posts", "input": {"neuron_ids": [42, 67]}}'

# 4. Retrieve the artifact
curl -X GET ".../neuron-api/artifacts/abc123" \\
  -H "X-API-Key: aidei_xxx"
\`\`\`

See the [Developer Guide](/docs/developer/api-overview) for full API documentation.

## Best Practices

- **Start simple** — automate one workflow before building complex chains
- **Monitor credit usage** — automated pipelines can consume credits quickly; set up \`credits.low\` webhook alerts
- **Test with short content** — verify your pipeline with a 5-minute clip before processing full episodes
- **Log everything** — keep records of webhook deliveries and API responses for debugging
- **Set rate limits** — prevent accidental runaway automation from consuming all your credits

## Further Reading

- [API Overview](/docs/developer/api-overview) — full REST API documentation
- [Webhooks](/docs/developer/webhooks) — detailed webhook setup
- [Credits & Pricing](/docs/getting-started/credits-system) — cost planning for automation`,
  },
};
