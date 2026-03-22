import type { DocTopic } from "../docsContent";

export const developerContent: Record<string, DocTopic> = {
  "api-overview": {
    title: "API Overview",
    content: `The AI-IDEI REST API provides programmatic access to your knowledge library. This guide covers authentication, endpoints, and usage patterns.

## Base URL

All API requests use the base URL format:
\`\`\`
https://<project-url>/functions/v1/neuron-api
\`\`\`

## Authentication

The API supports two authentication methods:

### JWT Token (for authenticated users)
Include the Supabase JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### API Key (for programmatic access)
Generate an API key from your profile settings and include it in the header:
\`\`\`
X-API-Key: aidei_xxxxxxxxxxxx
\`\`\`

## Rate Limits

- Default: 1000 requests per day per API key
- Rate limit headers are included in every response
- When the limit is exceeded, the API returns 429 Too Many Requests

## Available Endpoints

### Neurons
- \`GET /neurons\` — List your neurons (paginated)
- \`GET /neurons/:id\` — Get a specific neuron
- \`POST /neurons\` — Create a new neuron
- \`GET /neurons/search?q=query\` — Search neurons

### Entities
- \`GET /entities\` — List published entities
- \`GET /entities/:slug\` — Get entity by slug

### Jobs
- \`GET /jobs\` — List your jobs
- \`POST /jobs\` — Create a new job (run a service)

### Search
- \`GET /search?q=query\` — Hybrid search (keyword + semantic)

## Response Format

All responses follow a consistent JSON format:
\`\`\`json
{
  "data": [...],
  "count": 42,
  "page": 1,
  "per_page": 20
}
\`\`\`

## Error Handling

Errors return standard HTTP status codes with descriptive messages:
\`\`\`json
{
  "error": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "details": { "required": 50, "available": 20 }
}
\`\`\`

## SDKs & Libraries

Currently, the API is REST-only. Use any HTTP client (fetch, axios, curl) to interact with it.

## Further Reading

- [Webhooks](/docs/developer/webhooks) — real-time event notifications
- [Authentication](/docs/developer/authentication) — detailed auth guide`,
  },
  webhooks: {
    title: "Webhooks",
    content: `Webhooks allow you to receive real-time notifications when events occur in AI-IDEI.

## Outgoing Webhooks

### Setup
1. Navigate to **Operate → API** → Webhooks
2. Click **Add Webhook**
3. Enter your endpoint URL
4. Select events to subscribe to
5. Copy the generated webhook secret

### Events

| Event | Description |
|-------|-------------|
| \`neuron.created\` | A new neuron is extracted |
| \`neuron.updated\` | A neuron is modified |
| \`job.completed\` | A service execution finishes |
| \`job.failed\` | A service execution fails |
| \`artifact.created\` | A new artifact is generated |
| \`extraction.complete\` | Full extraction pipeline done |

### Payload Format
\`\`\`json
{
  "event": "neuron.created",
  "timestamp": "2026-03-22T10:00:00Z",
  "data": {
    "id": 42,
    "title": "Pricing Framework",
    "content_category": "framework"
  }
}
\`\`\`

### Security
Every webhook request includes an HMAC-SHA256 signature in the \`X-Webhook-Signature\` header. Verify this signature using your webhook secret to ensure the request is genuine.

### Retries
Failed deliveries are retried up to 3 times with exponential backoff (5s, 30s, 5min).

## Incoming Webhooks

Send content to AI-IDEI programmatically:

\`\`\`bash
curl -X POST https://<project>/functions/v1/webhook-ingest \\
  -H "X-Webhook-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "New Content", "content": "...", "auto_extract": true}'
\`\`\`

See the [Integrations page](/integrations) for setup.`,
  },
  authentication: {
    title: "Authentication",
    content: `This guide covers authentication methods for the AI-IDEI platform and API.

## User Authentication

### Email + Password
Standard signup flow:
1. Register with email and password
2. Verify email via confirmation link
3. Log in with credentials

### Session Management
- Sessions use JWT tokens with automatic refresh
- Tokens expire after 1 hour but are refreshed automatically
- Sessions persist across browser restarts (stored in localStorage)

## API Authentication

### API Keys
For programmatic access, generate API keys from your profile:

1. Go to **Account → Profile**
2. Scroll to **API Keys**
3. Click **Generate New Key**
4. Set a name, scopes, and optional expiry
5. Copy the key (shown only once)

**Key format:** \`aidei_xxxxxxxxxxxxxxxxxxxx\`

### Scopes
API keys can be scoped to specific operations:
- \`neurons:read\` — read neuron data
- \`neurons:write\` — create/update neurons
- \`jobs:read\` — read job status
- \`jobs:write\` — create jobs
- \`search\` — search operations

### Key Management
- Keys can be revoked at any time
- Daily request limits are configurable
- Usage is tracked and visible in the API dashboard

## Row-Level Security

All data access is governed by Row-Level Security (RLS) policies at the database level. Even with a valid API key, you can only access data you own. This provides defense-in-depth security.

## Further Reading

- [API Overview](/docs/developer/api-overview) — full API documentation
- [Security & Privacy](/docs/reference/security) — platform security details`,
  },
};
