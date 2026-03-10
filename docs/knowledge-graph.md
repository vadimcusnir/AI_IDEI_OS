# Knowledge Graph Model

## Overview

The Knowledge Graph is a language-independent semantic layer that stores entities and their relationships. Each entity has localized labels and content for multilingual access.

## Schema

### Entities (language-independent)

```sql
entities (id, entity_type, slug, title, neuron_id, idea_rank, importance_score, ...)
```

### Localized Labels

```sql
entity_labels (entity_id, language, name, description)
entity_content (entity_id, language, title, summary, content, slug)
```

### Relations

```sql
entity_relations (source_entity_id, target_entity_id, relation_type, weight)
```

## Entity Types

- **insight** — extracted knowledge pattern
- **pattern** — recurring structural element
- **formula** — actionable framework
- **application** — strategic/commercial application
- **contradiction** — conflicting viewpoints
- **profile** — person/avatar psychological profile

## Relation Types & Weights

| Relation | Weight | Description |
|----------|--------|-------------|
| derived_from | 1.0 | Direct derivation |
| supports | 0.8 | Evidence support |
| extends | 0.7 | Conceptual extension |
| applies_to | 0.6 | Practical application |
| references | 0.5 | Citation |
| contradicts | 0.3 | Opposition |

## IdeaRank Algorithm

PageRank-derived scoring with 5 components:

```
PVS = 0.30·Activation + 0.20·Growth + 0.20·Centrality + 0.15·Authority + 0.15·Economic
```

Includes emergence detection engine that flags top 5% entities as "emerging ideas" based on novelty, acceleration, and connectivity growth.

## Topics

Entities are clustered into topics via `entity_topics` with relevance scores. Topics support hierarchical nesting via `parent_topic_id`.
