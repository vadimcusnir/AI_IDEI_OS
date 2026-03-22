import type { DocTopic } from "../docsContent";

export const tutorialsContent: Record<string, DocTopic> = {
  "first-extraction": {
    title: "Your First Extraction",
    content: `This tutorial walks you through extracting knowledge from your first piece of content — from upload to neuron library in under 10 minutes.

## What You'll Need

- An AI-IDEI account with credits (500 free credits on signup)
- A content source: audio file, video, YouTube URL, or text

## Step 1: Upload Your Content

Navigate to **Create → Extract** from the sidebar. You'll see the upload interface.

**Options:**
- **YouTube URL** — paste any YouTube video URL, the system fetches and transcribes automatically
- **Audio/Video** — upload MP3, WAV, M4A, MP4, or WebM files
- **Text** — paste or type content directly

Click **Upload** or **Start Transcription**. The system begins processing immediately.

## Step 2: Wait for Transcription

For audio/video content, transcription takes 30 seconds to 3 minutes depending on length. You'll see a progress indicator. The system uses advanced speech-to-text models optimized for accuracy.

## Step 3: Review the Transcript

Once transcription is complete, the full text appears in the transcript viewer. You can:
- Read through the content
- Check for accuracy
- See speaker detection (if applicable)

## Step 4: Extract Neurons

Click **Extract Neurons** to start the AI extraction pipeline. The system:
1. Segments the transcript into semantic chunks
2. Analyzes each chunk across three axes (psychological, narrative, commercial)
3. Identifies knowledge units (insights, patterns, formulas, frameworks)
4. Creates structured neurons with typed blocks

This takes 2-5 minutes depending on transcript length. Cost: ~50-200 credits.

## Step 5: Review Your Neurons

Navigate to **Create → Knowledge** to see your extracted neurons. Each neuron has:
- A descriptive title
- Content blocks (insight, formula, framework, etc.)
- Category and lifecycle tags
- A unique ID and number

Click any neuron to open the full editor.

## What's Next?

- [Creating AI Outputs](/docs/tutorials/creating-outputs) — generate articles, scripts, and more from your neurons
- [Building Collections](/docs/tutorials/building-collections) — organize neurons into thematic groups
- [Automating Workflows](/docs/tutorials/automating-workflows) — set up automated extraction pipelines`,
  },
  "creating-outputs": {
    title: "Creating AI Outputs",
    content: `Once you have neurons in your library, you can generate dozens of professional deliverables. This tutorial shows you how.

## Available Services

The platform offers 80+ specialized AI services organized by category:
- **Content** — articles, blog posts, newsletters, scripts
- **Marketing** — ad copy, landing pages, email sequences, funnels
- **Education** — course modules, quizzes, lesson plans
- **Strategy** — competitive analysis, positioning, SWOT frameworks
- **Communication** — presentations, pitch decks, talking points

## Step 1: Choose a Service

Navigate to **Operate → Services**. Browse the service catalog or search for a specific output type.

Each service card shows:
- Name and description
- Credit cost
- Input requirements
- Expected output format

## Step 2: Select Input Neurons

Click **Run** on your chosen service. The system asks you to select input neurons. You can:
- Choose specific neurons manually
- Let the AI auto-select relevant neurons based on the service type
- Use a previous extraction batch

## Step 3: Configure & Execute

Review the service configuration:
- Verify input neurons
- Check credit cost
- Adjust any optional parameters

Click **Execute**. Credits are reserved (not spent until completion).

## Step 4: Retrieve Your Artifact

When the service completes (30 seconds to 15 minutes):
- Navigate to **Explore → Library**
- Find your new artifact
- Export in Markdown, JSON, or HTML

## Pro Tips

- **Batch execution**: Run multiple services on the same neurons to generate 50+ outputs from one extraction
- **Templates**: Save service configurations as templates for repeated use
- **Quality**: More detailed neurons produce better outputs — invest time in extraction quality`,
  },
  "building-collections": {
    title: "Building Collections",
    content: `Collections help you organize neurons thematically, making them easier to find and more powerful when used together.

## Why Collections Matter

Individual neurons are valuable. But neurons organized into collections become exponentially more useful:
- Services can process entire collections for richer outputs
- The knowledge graph surfaces stronger relationships
- You build a structured knowledge library over time

## Creating a Collection

1. Navigate to **Create → Knowledge**
2. Click **New Folder** in the sidebar
3. Name your collection (e.g., "Pricing Frameworks", "Sales Psychology")
4. Drag neurons into the collection, or use the neuron editor to assign folders

## Organization Strategies

**By Topic**: Group neurons that share a subject area
- "Email Marketing Tactics"
- "B2B Sales Patterns"
- "Customer Psychology"

**By Source**: Group neurons from the same content
- "Podcast EP.42 — Guest Interview"
- "Webinar Series Q1"

**By Project**: Group neurons for a specific output
- "Course: Advanced Pricing"
- "Book: Marketing Patterns"

## Using Collections with Services

When running a service, you can select an entire collection as input. This gives the AI more context and produces more comprehensive outputs.

## Sharing Collections

Collections can be shared via the Marketplace:
- Set neurons to "public" visibility
- Package the collection with a title and description
- Optionally set a price in NEURONS credits`,
  },
  "automating-workflows": {
    title: "Automating Workflows",
    content: `AI-IDEI supports automation through integrations, webhooks, and the API. This tutorial shows how to set up automated knowledge pipelines.

## Webhook-Based Automation

### Incoming Webhooks
Send content to AI-IDEI automatically:

1. Go to **Operate → Integrations** → Webhooks tab
2. Copy your webhook URL and API key
3. Send POST requests with content:

\`\`\`json
POST /webhooks/incoming
{
  "title": "New Episode",
  "content": "Transcript text...",
  "source_type": "podcast",
  "auto_extract": true
}
\`\`\`

When \`auto_extract\` is true, the system automatically runs the extraction pipeline.

### Outgoing Webhooks
Get notified when events happen:
- **neuron_created** — a new neuron is extracted
- **job_completed** — a service finishes
- **extraction_complete** — full extraction pipeline done

Configure at **Operate → API** → Webhooks section.

## Zapier Integration

Connect AI-IDEI to 5000+ apps via Zapier:

**Triggers** (when something happens in AI-IDEI):
- New neuron created
- Extraction finished
- New artifact generated

**Actions** (do something in AI-IDEI):
- Create a neuron
- Run an extraction
- Ingest a document

## API Automation

For full programmatic control, use the REST API:
1. Generate an API key at **Account → Profile**
2. Use endpoints documented at **/api**
3. Implement your custom pipeline

See the [Developer Guide](/docs/developer/api-overview) for full API documentation.`,
  },
};
