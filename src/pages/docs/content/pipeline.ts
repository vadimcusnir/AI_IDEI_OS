import type { DocTopic } from "../docsContent";

export const pipelineContent: Record<string, DocTopic> = {
  "transcript-refinery": {
    title: "Transcript Refinery",
    content: `The Transcript Refinery is the first processing layer of the AI-IDEI pipeline. It transforms raw audio, video, or text into structured transcripts ready for intelligence extraction. Every knowledge unit on the platform begins its lifecycle here.

## Why Transcription Matters

The quality of downstream extraction depends entirely on the quality of the transcript. A poorly transcribed word can turn an insight into nonsense. A missed speaker transition can attribute ideas to the wrong person. A garbled timestamp makes source verification impossible.

AI-IDEI's transcription layer is designed for precision, not just speed. The system uses state-of-the-art speech-to-text models optimized for knowledge-dense content — interviews, lectures, debates, and strategy discussions where every word matters.

## Input Formats

The Transcript Refinery accepts a wide range of source types:

### Audio Files
- **MP3** — the most common podcast format
- **WAV** — uncompressed audio for maximum quality
- **M4A** — Apple's standard audio format
- **OGG** — open-source audio format

### Video Files
- **MP4** — standard video format (audio is extracted automatically)
- **WebM** — web-optimized video format

### URLs
- **YouTube** — paste any YouTube video URL; the system fetches and processes the audio track
- **Direct media links** — URLs pointing to audio/video files

### Text
- **Plain text** — paste or type directly into the editor
- **Documents** — structured text input

For text input, the transcription step is skipped entirely — the content goes directly to the semantic chunking stage.

## The Transcription Pipeline

When you upload audio or video, the system executes a 5-stage processing pipeline:

### Stage 1: Upload & Validation

The system receives your file and performs initial validation:
- File type detection and format verification
- File size check (maximum limits apply for large recordings)
- Duration estimation for progress tracking
- Episode object creation in the database

At this point, your content is assigned a unique Episode ID that tracks it through the entire pipeline. All downstream operations reference this ID for full provenance.

### Stage 2: Speech-to-Text Transcription

The audio is processed by an AI transcription model. The system produces:
- Full text transcript with high accuracy
- Confidence scores per segment
- Language detection (automatic or user-specified)
- Word count and duration metrics

For multilingual content, the system detects the primary language automatically. Transcription quality is highest for English, Romanian, and Russian, but supports most major languages.

### Stage 3: Speaker Diarization

When multiple speakers are present (interviews, panels, podcasts), the system identifies and labels distinct speakers:
- Speaker A, Speaker B, etc.
- Speaker transitions are timestamped
- Each segment is attributed to a specific speaker

This is critical for guest profile extraction — the system needs to know who said what to build accurate psychological and cognitive profiles.

### Stage 4: Semantic Segmentation

Raw transcripts can be thousands of words long. Processing the entire transcript as a single block would produce poor extraction results. Instead, the system segments the transcript into semantically coherent chunks of 200-800 tokens each.

The segmentation algorithm identifies natural boundaries:

- **Topic transitions** — where the conversation shifts to a new subject
- **Speaker changes** — when a different person begins speaking
- **Rhetorical structure shifts** — changes in argument type or reasoning style
- **Argument boundaries** — where one line of reasoning concludes and another begins

Each chunk maintains cognitive coherence — it contains a complete thought, argument, or topic. This is not arbitrary splitting by word count; it's intelligent segmentation by meaning.

### Stage 5: Quality Assessment

After transcription and segmentation, the system performs quality checks:
- Overall transcription confidence score
- Gap detection (segments with low confidence)
- Speaker attribution confidence
- Segment coherence validation

Segments with low confidence are flagged for manual review. You can edit the transcript at any point to correct errors before extraction.

## Chunking Strategy Details

The semantic chunking deserves special attention because it directly impacts extraction quality.

### Token Window
Each chunk targets 200-800 tokens. This range is optimized for the extraction prompts:
- Below 200 tokens, there's usually insufficient context for meaningful extraction
- Above 800 tokens, the extraction model may lose focus or merge distinct ideas

### Boundary Detection
The chunking algorithm uses multiple signals:
- Lexical cues (topic keywords, transition phrases like "but," "however," "speaking of")
- Structural cues (paragraph breaks, long pauses in audio)
- Semantic similarity (embedding-based topic shift detection)
- Speaker change markers

### Overlap Handling
Adjacent chunks share a small overlap (typically 50-100 tokens) to ensure that ideas spanning chunk boundaries are captured in at least one chunk. This prevents information loss at the seams.

## Managing Episodes

Each upload creates an Episode that you can manage from the Extractor page:

### Episode States
- **uploaded** — content received, awaiting processing
- **transcribing** — speech-to-text in progress
- **transcribed** — transcript ready for extraction
- **extracting** — neuron extraction in progress
- **completed** — full pipeline completed

### Episode Metadata
Every episode stores:
- Source type and format
- Upload timestamp
- Duration (for audio/video)
- Word count
- Language
- Processing status
- Number of chunks generated
- Number of neurons extracted

### Transcript Editing
You can edit the transcript at any time before or after extraction. Common edits include:
- Correcting misheard words
- Fixing speaker attributions
- Adding context notes
- Marking sections to skip during extraction

## Performance Metrics

Typical processing times:
- 10-minute clip: ~30 seconds transcription, ~10 seconds chunking
- 30-minute episode: ~1-2 minutes transcription, ~20 seconds chunking
- 1-hour recording: ~2-3 minutes transcription, ~30 seconds chunking

These times may vary based on audio quality, number of speakers, and system load.

## Best Practices

### For Audio Recording
- Use a good microphone — clear audio produces better transcripts
- Minimize background noise
- Avoid overlapping speech when possible
- Speak at a natural pace

### For Uploaded Content
- Use the highest quality available (WAV > MP3)
- Trim unnecessary intros/outros before upload
- Label your episodes descriptively — this helps organize your library

### For Text Input
- Paste clean, formatted text
- Remove irrelevant headers, footers, and navigation elements
- Preserve paragraph structure — it helps segmentation

## Further Reading

- [Signal Extraction](/docs/pipeline/signal-extraction) — what happens after transcription
- [How It Works](/docs/getting-started/how-it-works) — the full pipeline overview
- [Your First Neuron](/docs/getting-started/your-first-neuron) — hands-on walkthrough`,
  },
  "signal-extraction": {
    title: "Signal Extraction",
    content: `Signal Extraction is the core intelligence layer of AI-IDEI. It transforms structured transcripts into actionable knowledge by identifying cognitive, narrative, and commercial signals within the text. This is where raw words become structured neurons.

## What Are Signals?

In AI-IDEI's terminology, a **signal** is a identifiable knowledge structure embedded in natural language. It's the raw form of an insight, pattern, or formula before it's been fully structured as a neuron.

Signals include:
- A decision-making framework described by a guest
- A pricing strategy explained through a specific example
- A cognitive bias observable in how someone frames an argument
- A storytelling structure used to persuade
- A competitive positioning technique embedded in business advice

Most speakers are not consciously aware of the signals they emit. A marketing expert doesn't say "I'm now going to describe my anchoring bias framework." They simply explain how they price their services, and the anchoring mechanism is embedded in their explanation.

The extraction pipeline identifies these signals automatically.

## Three-Axis Analysis

Every transcript chunk is analyzed across three independent dimensions. This ensures comprehensive coverage — signals that would be missed by a single-axis analysis are captured by the complementary axes.

### Axis 1: Internal / Psychological

This axis focuses on the speaker's cognitive architecture:

- **Decision-making patterns** — how the speaker evaluates options, weighs risks, and commits to choices
- **Cognitive biases** — systematic deviations from rational thinking (anchoring, confirmation bias, sunk cost)
- **Risk tolerance signals** — how the speaker frames uncertainty and potential losses
- **Emotional regulation markers** — how emotions influence reasoning and communication
- **Mental models** — the conceptual frameworks the speaker uses to understand the world
- **Heuristics** — shortcuts and rules of thumb used for quick decisions

This axis produces neurons categorized as **psychological**, **avatar** (cognitive profiles), and **insight**.

### Axis 2: Narrative

This axis focuses on communication structure:

- **Rhetorical structures** — how arguments are constructed (ethos, pathos, logos deployment)
- **Argument frameworks** — logical structures (if-then-because chains, contrast patterns)
- **Persuasion techniques** — methods used to change audience beliefs or behaviors
- **Story patterns** — narrative structures (hero's journey, problem-solution, before-after)
- **Framing strategies** — how topics are positioned relative to alternatives
- **Analogy usage** — metaphorical thinking patterns

This axis produces neurons categorized as **narrative**, **argument_map**, and **formula** (specifically rhetorical formulas).

### Axis 3: Commercial / JTBD (Jobs-to-Be-Done)

This axis focuses on market and business intelligence:

- **Jobs-to-be-done signals** — what outcome the customer is hiring a product/service for
- **Value proposition patterns** — how value is communicated and positioned
- **Market positioning strategies** — competitive framing and differentiation approaches
- **Growth strategies** — methods for scaling and acquiring customers
- **Pricing models** — value capture and monetization approaches
- **Competitive framing** — how alternatives are discussed and dismissed

This axis produces neurons categorized as **strategy**, **commercial**, **pattern**, and **formula**.

## The Extraction Chain

The system uses a chain of **9 specialized prompts**, each targeting specific signal types. The prompts are executed sequentially, with each stage enriching the context for subsequent extraction.

### Prompt Architecture

Each prompt is:
- **Domain-specific** — tuned for its extraction axis and signal type
- **Context-aware** — receives the transcript chunk plus any previously extracted signals
- **Structured output** — returns signals in a defined schema (title, type, content blocks, confidence)
- **Quality-filtered** — applies internal validation to reject low-confidence or duplicate signals

The prompt architecture is managed through a centralized **Prompt Registry** that enables versioning, A/B testing, and rollback. Administrators can update extraction prompts without code deployment.

## Extraction Quality

### Signal Validation
Not every AI output becomes a neuron. The system applies quality filters:

1. **Confidence threshold** — signals below minimum confidence are discarded
2. **Duplication check** — signals that overlap with existing neurons are flagged
3. **Specificity test** — vague or generic signals are deprioritized
4. **Actionability check** — signals must imply a possible action or application

### Human Review
After automated extraction, you review the results:
- Edit titles for clarity and specificity
- Adjust content blocks for accuracy
- Re-categorize if the AI misclassified
- Remove false positives (things that looked like insights but aren't)
- Add context or boundary conditions the AI missed

This human-in-the-loop step ensures that your neuron library contains only high-quality, validated knowledge.

## Credit Cost

Signal extraction is the most computationally expensive pipeline stage because it runs multiple AI prompts per chunk. Typical costs:

- Short text (500 words): 200-500 credits
- Medium transcript (2000 words): 500-1000 credits
- Full episode (5000+ words): 1000-2000 credits

The exact cost depends on the number of chunks generated during segmentation.

## Optimization Tips

### 1. Quality Input = Quality Output
Clean, well-transcribed content produces better signals. Edit your transcript before extraction if you notice errors.

### 2. Domain Focus
Extraction works best when the content has a clear domain. A focused 20-minute segment on pricing strategy produces more valuable signals than a rambling 2-hour discussion.

### 3. Review and Refine
Spend time reviewing extracted neurons. Editing a title from "Strategy" to "The Negative Space Pricing Strategy for SaaS Products" transforms a mediocre neuron into a valuable one.

### 4. Connect After Extraction
Once you have neurons, create connections between them. The value multiplies through the graph.

## Further Reading

- [Transcript Refinery](/docs/pipeline/transcript-refinery) — the preceding pipeline stage
- [Pattern Detection](/docs/pipeline/pattern-detection) — the next processing layer
- [Intelligence Assets](/docs/foundation/intelligence-assets) — what signals become
- [The Neuron Model](/docs/foundation/neuron-model) — the atomic knowledge unit`,
  },
  "pattern-detection": {
    title: "Pattern Detection",
    content: `Pattern Detection identifies recurring cognitive structures across multiple transcripts and neurons. Patterns are second-order intelligence — they emerge from comparing and correlating first-order signals extracted during Signal Extraction.

## What Makes a Pattern Different from a Signal?

A **signal** is a single observation from a single source. "This speaker uses price anchoring" is a signal.

A **pattern** is a recurring structure observed across multiple sources. "Experts in B2B sales consistently use price anchoring as their primary negotiation opener" is a pattern.

The distinction matters because patterns are more reliable, more predictive, and more actionable than individual signals. A signal might be idiosyncratic — one person's habit. A pattern reveals a structural regularity that you can exploit.

## Detection Mechanisms

### Cross-Source Correlation

The system compares extracted signals across different transcripts to identify structures that appear repeatedly. This requires a minimum number of observations:

- **2 occurrences** — "emerging pattern" (low confidence)
- **3 occurrences** — "established pattern" (standard confidence)
- **5+ occurrences** — "stable pattern" (high confidence)
- **10+ occurrences** — "structural invariant" (very high confidence)

The correlation isn't based on keyword matching. Two speakers might describe the same pricing framework using completely different vocabulary. The system identifies structural similarity — the underlying logic is the same even if the words differ.

### Structural Similarity Analysis

Beyond surface-level keyword matching, the system evaluates structural similarity:

- **Argument topology** — do two arguments follow the same logical structure?
- **Causal chain similarity** — do two explanations describe the same cause-effect relationship?
- **Decision tree overlap** — do two decision processes branch at the same decision points?
- **Framework isomorphism** — are two frameworks structurally identical despite different domain labels?

This allows the system to detect that "the inverted funnel pricing model" described by a SaaS founder and "the premium-first approach" described by a luxury brand consultant are structurally the same pattern applied in different contexts.

### Contradiction Detection

When signals conflict across sources, the system flags contradictions as a special pattern type. Contradictions are often more valuable than agreements — they reveal boundary conditions and context dependencies.

For example:
- Source A: "Removing friction from signup increases conversion"
- Source B: "Adding friction to signup improves long-term retention"

This contradiction reveals that the optimal friction level depends on whether you're optimizing for top-of-funnel volume or bottom-of-funnel quality. The boundary condition is the optimization target.

Contradictions are stored as neurons with the **contradiction** entity type, linking to both supporting and conflicting neurons.

## Pattern Types

### Behavioral Patterns
Recurring decision-making structures observed in subject behavior across multiple interviews or presentations:
- How experts evaluate opportunities under uncertainty
- Systematic approaches to resource allocation
- Consistent risk assessment frameworks

### Rhetorical Patterns
Repeated persuasion and argument frameworks:
- Story structures that appear across multiple speakers
- Argument topologies used by successful communicators
- Framing techniques that consistently shift audience perception

### Strategic Patterns
Consistent positioning and competitive approaches:
- Market entry strategies that succeed across industries
- Pricing architectures that maximize perceived value
- Growth patterns that scale predictably

### Cognitive Patterns
Stable thinking structures that influence perception and judgment:
- Mental models shared by experts in a domain
- Systematic biases that appear across decision-makers
- Information processing heuristics

## Pattern Scoring

Each detected pattern receives multiple scores:

- **Frequency** — how many times the pattern has been observed
- **Consistency** — how similar the instances are to each other
- **Predictive power** — does the pattern help predict outcomes?
- **Boundary clarity** — are the conditions where the pattern breaks well-defined?
- **Actionability** — can the pattern be applied to new situations?

These scores contribute to the pattern's IdeaRank within the knowledge graph.

## Pattern Evolution

Patterns are not static. As you process more content, patterns evolve:

1. **Discovery** — pattern first detected with 2-3 instances
2. **Validation** — additional instances confirm the pattern
3. **Refinement** — boundary conditions become clearer
4. **Formalization** — pattern generates derivative formulas
5. **Integration** — pattern connects to other patterns forming meta-patterns

This evolution happens automatically as the knowledge graph grows.

## Using Patterns

Once detected, patterns become powerful inputs for AI services:

- **Generate articles** explaining the pattern with examples
- **Create frameworks** based on pattern structure
- **Build courses** that teach pattern recognition
- **Develop strategies** that exploit or counteract patterns

## Further Reading

- [Signal Extraction](/docs/pipeline/signal-extraction) — the preceding stage
- [Synthesis Layer](/docs/pipeline/synthesis-layer) — how patterns combine
- [Patterns (Derivative Type)](/docs/derivatives/patterns) — the derivative asset
- [Knowledge Graph](/docs/architecture/knowledge-graph) — where patterns live`,
  },
  "synthesis-layer": {
    title: "Synthesis Layer",
    content: `The Synthesis Layer combines extracted signals, detected patterns, and derived formulas into higher-order intelligence structures. It is the final processing stage before knowledge enters the graph as a fully formed entity.

## The Role of Synthesis

Signal extraction identifies individual knowledge units. Pattern detection finds recurring structures. The Synthesis Layer does something neither of these can do alone: it **integrates** multiple knowledge types into coherent, executable frameworks.

Think of it this way:
- Signals are the bricks
- Patterns are the architectural blueprints
- Synthesis is the construction process that turns bricks and blueprints into a building

## Synthesis Operations

### Profile Synthesis

Profile synthesis combines cognitive signals from a single subject across multiple transcripts to generate an integrated analytical profile.

**Input:** All neurons tagged with a specific speaker across all processed episodes.

**Process:**
1. Aggregate cognitive signals (decision speed, risk tolerance, bias markers)
2. Identify stable patterns in the subject's thinking
3. Detect evolution in the subject's views over time
4. Synthesize an integrated cognitive profile

**Output:** A guest profile page with:
- Verified biographical context
- Cognitive pattern map
- Decision style analysis
- Strategic behavior assessment
- Communication style breakdown

Profile synthesis requires at least 2-3 transcripts featuring the same person for meaningful results. More transcripts produce richer, more reliable profiles.

### Framework Assembly

Framework assembly groups related patterns and formulas into coherent mental models — complete thinking tools that can be applied to new domains.

**Input:** A cluster of related neurons (patterns, formulas, insights) in the same domain.

**Process:**
1. Identify the structural skeleton — how do these pieces relate?
2. Find the governing logic — what principle organizes them?
3. Detect gaps — what components are missing?
4. Assemble the framework with proper hierarchy
5. Generate usage instructions and application examples

**Output:** A complete framework neuron with:
- Structural overview
- Component listing
- Application guide
- Boundary conditions
- Example applications

### Decision Model Construction

Decision model construction builds executable decision trees from extracted patterns, formulas, and contradictions.

**Input:** Relevant neurons covering a decision domain (e.g., "pricing strategy for new products").

**Process:**
1. Map the decision space — what choices exist?
2. Identify decision criteria from extracted patterns
3. Apply formulas as evaluation rules
4. Incorporate contradictions as boundary conditions
5. Structure the model as an executable decision tree

**Output:** A decision artifact with:
- Decision tree visualization
- Evaluation criteria with weights
- Boundary conditions and exceptions
- Source references (which neurons contributed)

## Quality Metrics

Every synthesized output carries quality metrics:

### Confidence Score
Based on:
- Number of independent sources contributing to the synthesis
- Consistency across source signals
- Extraction confidence of contributing neurons
- Domain coverage completeness

### Coverage Map
Shows which source segments contributed to each component of the synthesis. This enables traceability — you can always trace a synthesized conclusion back to specific moments in specific transcripts.

### Contradiction Index
Measures internal consistency. A low contradiction index means the synthesis is coherent — contributing signals agree. A high contradiction index means there are unresolved tensions that may indicate:
- Context-dependent knowledge (it works in situation A but not B)
- Evolving best practices (old vs. new approaches)
- Genuine disagreement among experts

### Novelty Score
Measures how unique the synthesis is relative to existing knowledge in the graph. High novelty suggests the synthesis reveals a genuinely new framework or combination. Low novelty suggests it's a refinement of existing knowledge.

## Synthesis and the Knowledge Graph

Synthesized outputs are immediately integrated into the knowledge graph:

- New entities are created for synthesized frameworks and profiles
- Connections link synthesized entities to their source neurons
- IdeaRank is recomputed to reflect the new graph topology
- Derivative chains are extended (the synthesis can itself become input to further services)

## When Synthesis Happens

Synthesis can be triggered in several ways:

1. **Automatic** — after extraction, the system may detect sufficient material for profile synthesis or framework assembly
2. **Service execution** — you explicitly run a synthesis service selecting input neurons
3. **Pipeline orchestration** — the IMF (Information Multiplication Factory) pipeline includes synthesis as a stage

## Limitations

Synthesis quality depends on:
- Quantity and quality of source neurons (minimum 5-10 related neurons for meaningful framework assembly)
- Domain diversity (multiple perspectives produce richer synthesis)
- Signal clarity (well-edited, specific neurons produce better synthesis than vague ones)

## Further Reading

- [Pattern Detection](/docs/pipeline/pattern-detection) — the preceding pipeline stage
- [Intelligence Assets](/docs/foundation/intelligence-assets) — the derivative types produced
- [Knowledge Graph](/docs/architecture/knowledge-graph) — where synthesized entities live
- [Service Manifests](/docs/architecture/service-manifests) — how to trigger synthesis services`,
  },
};
