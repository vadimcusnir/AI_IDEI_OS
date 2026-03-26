# API Reference — AI-IDEI Platform

**Version:** 2.0  
**Base URL:** `https://swghuuxkcilayybesadm.supabase.co/functions/v1`  
**Last Updated:** 2026-03-26

---

## Authentication

All API requests require authentication via one of two methods:

### 1. API Key (Recommended for integrations)

```
X-API-Key: aiidei_your_key_here
```

API keys are SHA-256 hashed and validated against the `api_keys` table. Each key has:
- **Scopes**: `neurons:read`, `entities:read`, `services:read`, `artifacts:read`, `*` (all)
- **Daily limit**: Configurable per key (default: 1000 requests/day)
- **Expiry**: Optional expiration date

### 2. JWT Bearer Token (For authenticated users)

```
Authorization: Bearer <access_token>
```

Obtain via Supabase Auth login. Grants full `read`, `write`, `admin` scopes.

---

## API Endpoints

### Public API v2 (`/api-v2`)

Query-param based routing for structured data access.

#### Neurons

| Method | Params | Description |
|--------|--------|-------------|
| GET | `?resource=neurons&limit=20&offset=0` | List user's neurons |
| GET | `?resource=neurons&id={neuron_id}` | Get single neuron |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "My Neuron",
      "score": 85,
      "status": "active",
      "lifecycle": "mature",
      "created_at": "2026-03-01T00:00:00Z",
      "content_category": "business"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### Entities

| Method | Params | Description |
|--------|--------|-------------|
| GET | `?resource=entities&limit=20&offset=0` | List entities |
| GET | `?resource=entities&id={entity_id}` | Get entity with relations & labels |
| GET | `?resource=entities&search=keyword` | Search entities |

#### Services

| Method | Params | Description |
|--------|--------|-------------|
| GET | `?resource=services&limit=20&offset=0` | List active service catalog |

#### Artifacts

| Method | Params | Description |
|--------|--------|-------------|
| GET | `?resource=artifacts&limit=20&offset=0` | List user's artifacts |
| GET | `?resource=artifacts&id={artifact_id}` | Get single artifact |

---

### Neuron API (`/neuron-api`)

RESTful path-based API with full CRUD operations.

#### Neurons CRUD

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/neurons` | read | List neurons (paginated) |
| POST | `/neurons` | write | Create neuron |
| GET | `/neurons/:id` | read | Get neuron by number |
| PATCH | `/neurons/:id` | write | Update neuron (title, status, visibility) |
| DELETE | `/neurons/:id` | write | Delete neuron |
| POST | `/neurons/:id/clone` | write | Clone neuron with blocks |
| POST | `/neurons/:id/fork` | write | Fork neuron (creates derived_from link) |

**Query params for GET /neurons:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `status` — filter by status
- `sort` — field to sort by (default: `updated_at`)
- `order` — `asc` or `desc` (default: `desc`)

**Include related data:**
```
GET /neurons/42?include=blocks,links
```

#### Blocks

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/neurons/:id/blocks` | read | List blocks for neuron |
| POST | `/neurons/:id/blocks` | write | Add block to neuron |

#### Versions

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/neurons/:id/versions` | read | List version history |
| POST | `/neurons/:id/versions` | write | Create version snapshot |

#### Entities

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/entities` | read | List published entities |
| GET | `/entities/:slug` | read | Get entity by slug with relations & topics |

**Query params for GET /entities:**
- `page`, `per_page`, `type`, `sort`, `order`

#### IdeaRank

| Method | Path | Description |
|--------|------|-------------|
| GET | `/idearank?limit=50` | Top entities by importance score |

#### Search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=keyword` | Full-text search across neurons |

#### Jobs

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/jobs` | auth | List user's jobs |
| GET | `/jobs/:id` | auth | Get job details |

#### Templates

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/templates` | read | List templates |
| POST | `/templates` | write | Create template |
| POST | `/templates/:id/use` | write | Instantiate neuron from template |

---

## Webhooks (`/webhook-ingest`)

Receive external content via webhook for automated processing.

**POST** `/webhook-ingest`

**Headers:**
```
Authorization: Bearer <jwt>
X-Webhook-Signature: <HMAC-SHA256 signature>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "New article",
  "content": "Full text content...",
  "content_type": "text|url|json|markdown",
  "url": "https://example.com/article",
  "metadata": { "source": "zapier" }
}
```

**Validation:** All fields validated via Zod schema (`webhookIngestSchema`).

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error description",
  "details": ["field: validation message"]  // Only on 400
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 401 | Missing or invalid authentication |
| 403 | Insufficient scope or permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal error |

**Rate limit headers:**
```
Retry-After: 45
```

---

## Rate Limiting

- **API Keys**: Configurable daily limit per key (default: 1000/day)
- **Edge Functions**: Database-backed rate limiter with sliding window
  - Default: 30 requests / 60 seconds per user
  - Fail-closed: blocked if rate limit check fails
- **Response on limit**: HTTP 429 with `retry_after` in body and `Retry-After` header

---

## Pagination

All list endpoints support pagination:

```json
{
  "data": [...],
  "total": 150,
  "page": 2,
  "per_page": 20
}
```

Maximum `per_page` / `limit`: **100**

---

## SDK Usage (JavaScript)

```typescript
import { supabase } from "@/integrations/supabase/client";

// Invoke API v2
const { data } = await supabase.functions.invoke("api-v2", {
  headers: { "X-API-Key": "aiidei_your_key" },
  body: null,
  method: "GET",
});

// Invoke Neuron API
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/neuron-api/neurons?page=1`,
  { headers: { "X-API-Key": "aiidei_your_key" } }
);
```
