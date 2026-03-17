import type { DocTopic } from "../docsContent";

export const derivativesContent: Record<string, DocTopic> = {
  insights: {
    title: "Insights",
    content: `Insights are non-obvious mechanisms affecting decisions. They represent hidden causal chains extracted from source material — the "why behind the why" that most people miss when consuming content.

## What Qualifies as an Insight

Understanding what constitutes a genuine insight is critical to using AI-IDEI effectively. The extraction pipeline is designed to identify true insights, not surface-level observations.

### An Insight Is NOT

- **An observation:** "People buy more during sales" — this is obvious and adds no explanatory power
- **A fact:** "The market grew 15% last quarter" — this is data, not a mechanism
- **An opinion:** "I think video content performs better" — this is subjective preference
- **A correlation:** "Companies that blog get more leads" — correlation without mechanism
- **A tip:** "Use shorter subject lines" — actionable but lacks the explanatory layer

### An Insight IS

- **A non-obvious mechanism:** "Price anchoring shifts perceived value by 40% regardless of actual cost difference — because the brain evaluates prices relative to the first number seen, not absolute value"
- **A hidden driver:** "Decision fatigue at hour 3 of meetings causes 67% of strategic reversals — because cognitive resource depletion shifts decision-makers from analytical to heuristic processing"
- **A counter-intuitive relationship:** "Increasing friction in the signup process improves 90-day retention by 40% — because the qualifying question filters out low-intent users who would churn"

The key difference: insights explain **HOW** something works, not just **WHAT** happens. They reveal the mechanism.

## The Three Filters

Every extracted insight must pass three quality filters:

### 1. Non-Obvious
The mechanism should not be immediately apparent from surface reading. If most people would arrive at the same conclusion without analysis, it's an observation, not an insight.

**Test:** Would a smart person reading the source material likely miss this? If yes, it's non-obvious.

### 2. Mechanistic
The insight must describe a causal mechanism — it explains WHY something happens, not just that it happens.

**Test:** Does it answer "How does this work?" or "Why does this happen?" If yes, it's mechanistic.

### 3. Actionable
The insight must imply a possible intervention or application. Knowing the mechanism should suggest something you can do differently.

**Test:** Can you act on this information? Can you use it to make a different decision? If yes, it's actionable.

## Insight Categories

Insights are further classified by domain:

### Cognitive Insights
Mechanisms related to how people think, decide, and perceive:
- Cognitive bias exploits and defenses
- Decision-making under uncertainty
- Attention and memory mechanisms
- Emotional influence on rational processes

### Strategic Insights
Mechanisms related to competitive positioning and business strategy:
- Market dynamics and competitive forces
- Value perception and pricing psychology
- Growth mechanisms and network effects
- Timing and sequencing in market entry

### Communication Insights
Mechanisms related to how messages influence audiences:
- Persuasion mechanics (beyond technique)
- Trust-building mechanisms
- Authority construction patterns
- Story impact on decision-making

### Behavioral Insights
Mechanisms related to how people act in specific contexts:
- Habit formation and breaking mechanisms
- Social proof dynamics
- Motivation and incentive structures
- Friction effects on behavior

## Using Insights

Insights become powerful inputs for AI services:

### Article Generation
An insight about pricing psychology can generate a 2000-word article explaining the mechanism, providing examples, and offering applications. The AI service uses the insight as the core thesis and expands it.

### Framework Construction
Multiple related insights can be assembled into a framework. Five insights about decision-making under uncertainty become a "Decision Stress-Test Framework."

### Strategy Development
Insights about competitive dynamics become inputs for strategy documents. The AI service combines the mechanism with your specific context to produce applicable recommendations.

### Training Material
Insights with examples become teaching units in courses and workshops. Each insight is a lesson that explains a mechanism and shows how to apply it.

## Insight Quality Metrics

Each insight carries quality scores:

| Metric | Description |
|---|---|
| **Confidence** | Source reliability and extraction precision |
| **Evidence count** | Number of independent sources supporting the insight |
| **Novelty** | How unique this insight is in the graph |
| **Reuse count** | How often it's been used in service execution |
| **IdeaRank** | Graph-based importance score |

Higher-scoring insights produce better service outputs and appear higher in search results.

## Browsing Insights

Published insights are accessible on the public Insights page (/insights). Each insight has:
- A dedicated page with full content
- Related entities (patterns, formulas, profiles it connects to)
- Source references
- SEO-optimized structured data (JSON-LD)

## Further Reading

- [Signal Extraction](/docs/pipeline/signal-extraction) — how insights are extracted
- [Patterns](/docs/derivatives/patterns) — recurring structures built from insights
- [Formulas](/docs/derivatives/formulas) — actionable rules derived from insights
- [Intelligence Assets](/docs/foundation/intelligence-assets) — the complete asset taxonomy`,
  },
  patterns: {
    title: "Patterns",
    content: `Patterns are recurring cognitive structures detected across multiple sources. They represent stable regularities in thinking, decision-making, or strategy — structures that appear reliably enough to be predictive.

## Patterns vs. Insights

An **insight** is a single mechanism extracted from a single source. A **pattern** is a recurring structure identified across multiple sources.

| Property | Insight | Pattern |
|---|---|---|
| Source count | 1+ | 3+ (for stable classification) |
| Scope | Specific mechanism | Recurring structure |
| Predictive power | Moderate | High |
| Reliability | Source-dependent | Validated across sources |

Patterns are inherently more reliable than individual insights because they've been independently confirmed multiple times.

## How Patterns Are Detected

### Cross-Source Correlation
The system compares signals extracted from different transcripts. When similar structures appear in 3+ independent sources, the system flags them as patterns.

### Structural Similarity
Pattern detection goes beyond keyword matching. Two speakers might describe the same framework using completely different vocabulary. The system identifies **structural similarity** — the underlying logic is the same even when the words differ.

For example:
- Speaker A: "I always start pricing conversations by mentioning the enterprise tier"
- Speaker B: "The first number I show clients is always the premium package"
- Speaker C: "Opening with the highest option makes everything else feel reasonable"

Different words, same pattern: **anchor-high pricing**.

### Contradiction as Pattern
When sources consistently contradict each other on a specific point, the contradiction itself becomes a pattern. This is valuable because it reveals **boundary conditions** — situations where a principle works and situations where it doesn't.

## Pattern Categories

### Behavioral Patterns
Recurring decision-making structures:
- How experts evaluate opportunities under uncertainty
- Systematic approaches to resource allocation
- Consistent risk assessment frameworks
- Hiring and team-building regularities

### Rhetorical Patterns
Repeated communication frameworks:
- Story structures used by successful communicators
- Argument topologies that win debates
- Persuasion sequences that shift beliefs
- Framing techniques that reposition perception

### Strategic Patterns
Consistent business approaches:
- Market entry strategies that succeed across industries
- Pricing architectures that maximize value capture
- Growth patterns that scale predictably
- Competitive positioning moves

### Cognitive Patterns
Stable thinking structures:
- Mental models shared by domain experts
- Systematic biases across decision-makers
- Information processing heuristics
- Problem-solving approaches

## Pattern Lifecycle

1. **Emerging** — 2 occurrences detected, low confidence
2. **Established** — 3+ occurrences, standard confidence
3. **Stable** — 5+ occurrences with consistent structure
4. **Structural** — 10+ occurrences, considered reliable
5. **Formalized** — pattern has generated derivative formulas

## Using Patterns

### Generate Content
Patterns make excellent article topics. "The 5 Communication Patterns of Successful Fundraisers" — each pattern becomes a section with examples from different sources.

### Build Frameworks
Related patterns combine into frameworks. Five strategic patterns about market entry become a "Market Entry Decision Framework."

### Train Teams
Patterns are ideal teaching material because they're validated across sources. "Here's a pattern we've identified across 15 expert interviews..."

### Develop Strategy
Recognize patterns in your own market and decide whether to follow or deliberately break them.

## Pattern Quality Metrics

| Metric | Description |
|---|---|
| **Frequency** | Number of independent observations |
| **Consistency** | Structural similarity across instances |
| **Predictive power** | Does the pattern help predict outcomes? |
| **Boundary clarity** | How well-defined are the breaking conditions? |
| **Actionability** | Can the pattern be applied to new situations? |

## Browsing Patterns

Published patterns are accessible at /patterns. Each pattern page includes:
- Full description with examples
- Source references (which transcripts contributed)
- Related entities (insights, formulas, contradictions)
- Quality metrics and IdeaRank
- SEO-optimized metadata

## Further Reading

- [Pattern Detection (Pipeline)](/docs/pipeline/pattern-detection) — technical detection details
- [Insights](/docs/derivatives/insights) — the building blocks of patterns
- [Formulas](/docs/derivatives/formulas) — actionable rules from patterns
- [Knowledge Graph](/docs/architecture/knowledge-graph) — where patterns live`,
  },
  formulas: {
    title: "Formulas",
    content: `Formulas are operational rules extracted from patterns. They are the most directly actionable derivative type — structured rules you can apply immediately in new contexts.

## What Makes a Formula

A formula is not a vague guideline ("be authentic"). A formula is a structured rule with clear conditions, actions, outcomes, and boundaries:

\`\`\`
IF [condition set]
THEN [action/outcome]
BECAUSE [mechanism from underlying insight]
BOUNDARY [conditions where this breaks]
\`\`\`

### Example

\`\`\`
IF the target audience has high decision fatigue (3+ options evaluated)
THEN present your offer as the "obvious choice" with a single clear CTA
BECAUSE cognitive load reduction increases conversion by 25-40% in exhausted decision-makers
BOUNDARY breaks when the audience is in exploration mode (early funnel) — they want options, not shortcuts
\`\`\`

This is actionable. You know when to use it, what to do, why it works, and when it fails.

## Formula Types

### Decision Formulas
Rules for making specific types of decisions under defined conditions:
- When to launch vs. when to wait
- How to price based on market position
- When to pivot vs. when to persevere

### Copywriting Formulas
Structural templates for persuasive communication:
- Headline structures that maximize click-through
- Email sequences that convert
- Landing page copy frameworks
- Social media post templates

### Strategy Formulas
Operational frameworks for positioning and competition:
- Market entry timing rules
- Competitive response frameworks
- Resource allocation heuristics
- Partnership evaluation criteria

### Pricing Formulas
Rules for value communication and price architecture:
- Anchor pricing constructions
- Discount framing strategies
- Bundle optimization rules
- Free-to-paid conversion triggers

## Formula Validation

Formulas are scored on three dimensions:

### Source Diversity
How many independent sources support the formula's underlying mechanism? A formula supported by 5 different experts across 5 different transcripts is more reliable than one from a single source.

### Application Breadth
How many different contexts can this formula be applied to? A formula about "cognitive load in decision-making" applies across marketing, UX design, sales, and management. A formula about "pricing Mac accessories" has narrow application.

### Predictive Accuracy
When the formula has been applied, does it predict the outcome accurately? This is tracked through usage history and feedback.

## Using Formulas

Formulas are the most service-ready derivative type:

### Direct Application
Copy the formula, fill in your context, and apply. No AI required — formulas are designed to be immediately usable.

### Service Input
Use formulas as input for AI services:
- "Generate 5 email subject lines using this copywriting formula"
- "Create a pricing page following this pricing formula"
- "Write a sales script applying this persuasion formula"

### Teaching Material
Formulas are excellent training content because they're structured and actionable:
- Workshop exercises: "Apply this formula to your product"
- Course lessons: "Here's the formula, here's why it works, here's how to adapt it"

### Template Creation
Formulas become reusable templates. The AI service fills in context-specific details while preserving the formula structure.

## Browsing Formulas

Published formulas are accessible at /formulas. Each formula page shows:
- Complete formula structure (IF/THEN/BECAUSE/BOUNDARY)
- Usage examples across different contexts
- Supporting insights and patterns
- Quality metrics and source count
- Related formulas

## Further Reading

- [Insights](/docs/derivatives/insights) — the mechanisms behind formulas
- [Patterns](/docs/derivatives/patterns) — the recurring structures that generate formulas
- [Service Manifests](/docs/architecture/service-manifests) — using formulas in AI services
- [Decision Artifacts](/docs/derivatives/decision-artifacts) — combining formulas into frameworks`,
  },
  profiles: {
    title: "Profiles",
    content: `Profiles are intelligence derivatives synthesized from transcript analysis of specific subjects. They represent analytical maps of cognitive patterns, decision styles, and strategic behaviors — built entirely from observed communication, not speculation.

## The Profile Pipeline

Profile generation follows a multi-stage process:

\`\`\`
media → transcript → signal extraction → indicator scoring → pattern detection → profile synthesis
\`\`\`

Each stage adds analytical depth. By the final stage, the system has built a comprehensive map of how the subject thinks, decides, and communicates.

## Profile Structure

Every profile consists of six layers:

### 1. Context Layer
Verified, public facts about the subject:
- Professional role and domain
- Public track record and achievements
- Known affiliations and positions
- Any relevant public statements

This layer is factual only. No interpretation or speculation.

### 2. Source Material Layer
Metadata about analyzed transcripts:
- Which episodes were analyzed
- Total duration of analyzed content
- Date range of recordings
- Topics covered across sources

More source material produces richer, more reliable profiles. A profile from a single 15-minute interview is thin. A profile from 10 hours across 8 interviews is comprehensive.

### 3. Extracted Indicators Layer
Measurable cognitive signals identified across sources:
- **Decision speed** — how quickly the subject commits to positions
- **Language density** — complexity and precision of vocabulary
- **Risk tolerance** — how the subject frames uncertainty and potential losses
- **Bias markers** — observable cognitive biases in reasoning
- **Strategic framing** — how the subject positions arguments relative to alternatives
- **Emotional regulation** — how emotions interact with reasoning
- **Authority construction** — how the subject establishes credibility

Each indicator is scored on a normalized scale with confidence intervals based on evidence count.

### 4. Cognitive Patterns Layer
Recurring thinking structures identified across sources:
- Decision-making frameworks the subject uses consistently
- Communication patterns that repeat across contexts
- Strategic approaches that remain stable over time
- Intellectual tendencies and analytical preferences

### 5. Profile Synthesis Layer
Integrated assessment combining all indicators and patterns:
- **Decision style** — analytical vs. intuitive, fast vs. deliberate
- **Strategic behavior** — aggressive vs. conservative, creative vs. systematic
- **Cognitive strengths** — what the subject does well intellectually
- **Cognitive risks** — potential blind spots or systematic errors

### 6. Analytical Summary
A concise overview of observed mechanisms. This layer follows strict rules:
- No diagnosis or medical terminology
- No speculation beyond observed data
- No personality type labels
- Only observed mechanisms with evidence references

## Guest Pages

Profiles can be published as Guest Pages — public profile pages accessible at /guest/:slug. Guest pages include:
- Biographical context
- Cognitive pattern visualization
- Key insights attributed to the subject
- Source material references
- SEO-optimized structured data

Guest pages require your explicit approval before publishing. You control whether each guest profile is public or private.

## Profile Quality

Profile reliability scales with source material:
- **1 transcript:** Preliminary indicators only
- **2-3 transcripts:** Pattern detection begins, moderate confidence
- **5+ transcripts:** Stable patterns, high-confidence profile
- **10+ transcripts:** Comprehensive analytical map

Cross-context diversity matters too. Analyzing the same person in different settings (interview vs. presentation vs. panel discussion) reveals more dimensions than multiple recordings of the same type.

## Ethical Guidelines

AI-IDEI profiles are analytical tools, not psychological diagnoses:
- Based only on observable communication patterns
- No speculation about private thoughts or motivations
- No diagnostic labels or clinical terminology
- Subject to correction if inaccurate
- Published only with explicit user consent

## Further Reading

- [Synthesis Layer](/docs/pipeline/synthesis-layer) — how profiles are synthesized
- [Signal Extraction](/docs/pipeline/signal-extraction) — how signals are identified
- [Intelligence Assets](/docs/foundation/intelligence-assets) — the complete asset taxonomy`,
  },
  "decision-artifacts": {
    title: "Decision Artifacts",
    content: `Decision Artifacts are the highest-order derivatives on the AI-IDEI platform. They combine multiple intelligence asset types — insights, patterns, formulas, and contradictions — into executable decision frameworks.

## What Makes Decision Artifacts Special

Individual insights tell you one mechanism. Patterns show you recurring structures. Formulas give you actionable rules. But real decisions require integrating all of these simultaneously while accounting for boundary conditions and trade-offs.

Decision artifacts do this integration automatically, producing frameworks you can apply to real decisions.

## Composition

A decision artifact integrates four asset types:

### Insights — The Mechanisms
"Price anchoring shifts perceived value by 40%." These explain HOW things work.

### Patterns — The Structures
"Experts consistently anchor high in B2B negotiations." These show WHAT happens reliably.

### Formulas — The Rules
"IF enterprise deal AND multiple stakeholders, THEN anchor at 3× expected close price." These tell you WHAT TO DO.

### Contradictions — The Boundaries
"Anchoring fails when the buyer has expert-level price knowledge." These tell you WHEN IT BREAKS.

## Decision Artifact Types

### Decision Trees
Branching logic models for specific decision domains. Each branch is backed by an insight or formula, and each leaf node includes a confidence score.

### Evaluation Matrices
Multi-criteria scoring frameworks for complex choices. Criteria are derived from extracted patterns, and weights reflect the relative importance revealed by source analysis.

### Risk Maps
Probability × impact visualizations for strategic scenarios. Probabilities are estimated from pattern frequency and historical evidence.

### Scenario Models
If-then chains that map possible outcomes from specific starting conditions. Each chain is built from formulas with boundary conditions defining where the chain breaks.

## Generating Decision Artifacts

Decision artifacts are produced through AI services:

1. Select a domain or decision context
2. Choose relevant neurons (insights, patterns, formulas)
3. Run a decision artifact service
4. The AI integrates the inputs into a structured framework
5. Review and refine the output

The quality of the artifact depends directly on the richness of your neuron library in the relevant domain. More neurons → more nuanced, more reliable decision frameworks.

## Value and Reuse

Decision artifacts represent the highest compound returns because they:
- Combine the most knowledge per unit
- Are directly applicable to real decisions
- Can be reused across similar decision contexts
- Improve as underlying neurons accumulate more evidence

## Further Reading

- [Insights](/docs/derivatives/insights) — the mechanisms inside artifacts
- [Patterns](/docs/derivatives/patterns) — the structures that shape artifacts
- [Formulas](/docs/derivatives/formulas) — the rules that drive artifacts
- [Service Manifests](/docs/architecture/service-manifests) — how to generate artifacts`,
  },
};
