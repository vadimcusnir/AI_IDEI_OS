import type { DocTopic } from "../docsContent";

export const developerContent: Record<string, DocTopic> = {
  "api-overview": {
    title: "API Overview",
    content: `The AI-IDEI REST API provides programmatic access to your knowledge library — neurons, artifacts, entities, and job execution. This guide covers authentication, endpoints, pagination, error handling, and best practices.

## Base URL

All API requests use the base URL:
\`\`\`
https://<project-url>/functions/v1/neuron-api
\`\`\`

Replace \`<project-url>\` with your project's domain.

## Authentication

The API supports two authentication methods:

### JWT Token (for authenticated users)
Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

This method is ideal for frontend applications where the user is already signed in.

### API Key (for programmatic access)
Generate an API key from your profile settings:
\`\`\`
X-API-Key: aidei_xxxxxxxxxxxxxxxxxxxx
\`\`\`

API keys are recommended for server-to-server integrations, cron jobs, and automated pipelines.

## Rate Limits

| Tier | Requests/Day | Burst Rate |
|------|-------------|------------|
| Free | 500 | 10/min |
| Standard | 2000 | 30/min |
| Pro | 10000 | 100/min |

Rate limit headers are included in every response:
\`\`\`
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1847
X-RateLimit-Reset: 1711929600
\`\`\`

When the limit is exceeded, the API returns \`429 Too Many Requests\` with a \`Retry-After\` header.

## Available Endpoints

### Neurons

- \`GET /neurons\` — List your neurons (paginated)
- \`GET /neurons/:id\` — Get a specific neuron by numeric ID
- \`POST /neurons\` — Create a new neuron
- \`PATCH /neurons/:id\` — Update an existing neuron
- \`DELETE /neurons/:id\` — Delete a neuron
- \`GET /neurons/search?q=query\` — Full-text + semantic search

**Example — List neurons with filters:**
\`\`\`bash
curl -X GET "https://<project-url>/functions/v1/neuron-api/neurons?page=1&per_page=20&category=framework&lifecycle=active" \\
  -H "X-API-Key: aidei_xxxxxxxxxxxxxxxxxxxx"
\`\`\`

**Example — Create a neuron:**
\`\`\`bash
curl -X POST "https://<project-url>/functions/v1/neuron-api/neurons" \\
  -H "X-API-Key: aidei_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Anchoring Effect in SaaS Pricing",
    "content_category": "framework",
    "blocks": [
      {
        "type": "insight",
        "content": "Showing a higher reference price before the actual price increases perceived value by 40-60%."
      },
      {
        "type": "formula",
        "content": "IF product has 3+ tiers THEN place anchor price on the highest tier AND highlight the middle tier as recommended."
      }
    ]
  }'
\`\`\`

### Entities

- \`GET /entities\` — List published entities (paginated)
- \`GET /entities/:slug\` — Get entity by slug
- \`GET /entities/:id/connections\` — Get connected entities

### Jobs

- \`GET /jobs\` — List your jobs (paginated, filterable by status)
- \`GET /jobs/:id\` — Get job details and result
- \`POST /jobs\` — Create a new job (execute a service)
- \`POST /jobs/:id/retry\` — Retry a failed job

**Example — Execute a service:**
\`\`\`bash
curl -X POST "https://<project-url>/functions/v1/neuron-api/jobs" \\
  -H "X-API-Key: aidei_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_key": "article_generator",
    "input": {
      "neuron_ids": [42, 67, 103],
      "tone": "professional",
      "length": "long"
    }
  }'
\`\`\`

### Artifacts

- \`GET /artifacts\` — List your artifacts
- \`GET /artifacts/:id\` — Get artifact content
- \`DELETE /artifacts/:id\` — Delete an artifact

### Search

- \`GET /search?q=query\` — Hybrid search (keyword + semantic)
- \`GET /search?q=query&type=neuron\` — Search only neurons
- \`GET /search?q=query&type=entity\` — Search only entities

## Pagination

All list endpoints support cursor-based pagination:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| \`page\` | 1 | — | Page number |
| \`per_page\` | 20 | 100 | Items per page |
| \`order\` | \`created_at.desc\` | — | Sort order |

## Response Format

All responses follow a consistent JSON envelope:
\`\`\`json
{
  "data": [...],
  "count": 142,
  "page": 1,
  "per_page": 20,
  "has_more": true
}
\`\`\`

Single-resource responses omit the pagination fields:
\`\`\`json
{
  "data": {
    "id": 42,
    "title": "Anchoring Effect",
    "content_category": "framework",
    "blocks": [...]
  }
}
\`\`\`

## Error Handling

Errors return standard HTTP status codes with structured messages:

| Code | Meaning |
|------|---------|
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — missing or invalid credentials |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate resource |
| 422 | Unprocessable — validation failed |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Server Error — internal failure |

\`\`\`json
{
  "error": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "details": { "required": 50, "available": 20 }
}
\`\`\`

## Idempotency

For write operations (POST, PATCH, DELETE), include an \`Idempotency-Key\` header to prevent duplicate operations:
\`\`\`
Idempotency-Key: unique-request-id-12345
\`\`\`

The server caches results for 24 hours — replaying the same key returns the original response without re-executing the operation.

## Versioning

The API is currently at v1. Breaking changes will result in a new version. Non-breaking additions (new fields, new endpoints) are added without version changes.

## SDKs & Libraries

The API is REST-only. Use any HTTP client:
- **JavaScript/TypeScript** — \`fetch\`, \`axios\`
- **Python** — \`requests\`, \`httpx\`
- **cURL** — command-line access
- **Postman** — GUI-based testing

## Best Practices

- **Cache responses** — neuron data doesn't change frequently; cache with a 5-minute TTL
- **Use pagination** — always paginate list requests; the default limit is 1000 rows
- **Handle rate limits** — implement exponential backoff on 429 responses
- **Store API keys securely** — never commit keys to source control; use environment variables
- **Use idempotency keys** — prevent duplicate job executions in retry scenarios

## Further Reading

- [Webhooks](/docs/developer/webhooks) — real-time event notifications
- [Authentication](/docs/developer/authentication) — detailed auth guide`,
  },
  webhooks: {
    title: "Webhooks",
    content: `Webhooks allow you to receive real-time notifications when events occur in AI-IDEI, and to send content into the platform programmatically. This enables powerful automation workflows.

## Outgoing Webhooks

Outgoing webhooks send HTTP POST requests to your server whenever specific events happen on the platform.

### Setup

1. Navigate to **Operate → API** → Webhooks tab
2. Click **Add Webhook**
3. Enter your endpoint URL (must be HTTPS)
4. Select events to subscribe to
5. Copy the generated webhook secret
6. Click **Save**

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| \`neuron.created\` | A new neuron is extracted | Neuron object |
| \`neuron.updated\` | A neuron is modified | Updated neuron |
| \`neuron.deleted\` | A neuron is removed | Neuron ID |
| \`job.started\` | A service execution begins | Job metadata |
| \`job.completed\` | A service execution finishes | Job + artifact |
| \`job.failed\` | A service execution fails | Job + error |
| \`artifact.created\` | A new artifact is generated | Artifact object |
| \`extraction.started\` | Extraction pipeline begins | Episode metadata |
| \`extraction.complete\` | Full extraction pipeline done | Episode + neurons |
| \`credits.low\` | Credit balance drops below threshold | Balance info |

### Payload Format

Every webhook request includes:
\`\`\`json
{
  "event": "neuron.created",
  "timestamp": "2026-03-22T10:00:00Z",
  "webhook_id": "wh_abc123",
  "data": {
    "id": 42,
    "title": "Pricing Framework",
    "content_category": "framework",
    "blocks": [...]
  }
}
\`\`\`

### Headers

Each request includes these headers:
\`\`\`
Content-Type: application/json
X-Webhook-Event: neuron.created
X-Webhook-Signature: sha256=abc123...
X-Webhook-ID: wh_abc123
X-Webhook-Timestamp: 1711929600
\`\`\`

### Signature Verification

Every webhook request includes an HMAC-SHA256 signature. Verify it to ensure the request is genuine:

\`\`\`javascript
import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from("sha256=" + expected)
  );
}
\`\`\`

### Retries & Delivery

- Failed deliveries are retried up to 5 times
- Retry schedule: 5s, 30s, 5min, 30min, 2h
- A delivery is considered failed if your endpoint returns a non-2xx status or times out (30s)
- After all retries are exhausted, the webhook is marked as failed in the dashboard
- You can manually retry failed deliveries from the webhook log

### Webhook Log

The webhook dashboard shows delivery history:
- Timestamp of each attempt
- HTTP response status
- Response time
- Payload sent
- Any error messages

## Incoming Webhooks

Send content to AI-IDEI programmatically using incoming webhook endpoints.

### Content Ingestion

\`\`\`bash
curl -X POST "https://<project>/functions/v1/webhook-ingest" \\
  -H "X-Webhook-Key: your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "New Episode",
    "content": "Full transcript text here...",
    "source_type": "podcast",
    "auto_extract": true,
    "tags": ["marketing", "pricing"]
  }'
\`\`\`

### Supported Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`title\` | string | Yes | Content title |
| \`content\` | string | Yes | Full text content |
| \`source_type\` | string | No | Type: podcast, article, interview |
| \`auto_extract\` | boolean | No | Auto-run extraction pipeline |
| \`tags\` | string[] | No | Tags for organization |
| \`metadata\` | object | No | Custom metadata |

### Auto-Extraction

When \`auto_extract\` is \`true\`, the system automatically:
1. Creates an episode from the content
2. Runs semantic chunking
3. Executes the full extraction pipeline
4. Stores extracted neurons in your library
5. Sends an \`extraction.complete\` outgoing webhook when done

### Error Responses

\`\`\`json
{
  "error": "Content too short",
  "code": "VALIDATION_ERROR",
  "details": { "min_length": 100, "received": 42 }
}
\`\`\`

## Best Practices

- **Always verify signatures** — never trust unverified webhook payloads
- **Respond quickly** — return 200 within 5 seconds; process asynchronously if needed
- **Handle duplicates** — use the \`X-Webhook-ID\` header to deduplicate
- **Monitor failures** — check the webhook log regularly for delivery issues
- **Use HTTPS** — webhook endpoints must use TLS encryption

## Further Reading

- [API Overview](/docs/developer/api-overview) — full REST API documentation
- [Automating Workflows](/docs/tutorials/automating-workflows) — automation tutorial
- [Authentication](/docs/developer/authentication) — credential management`,
  },
  authentication: {
    title: "Authentication",
    content: `This guide covers all authentication methods for the AI-IDEI platform — both user-facing authentication and programmatic API access.

## User Authentication

### Email + Password

The standard authentication flow:

1. **Register** — provide email and password at the signup page
2. **Verify** — click the confirmation link sent to your email
3. **Sign in** — use your credentials to log in
4. **Session** — a JWT session is created automatically

Password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one number

### Google OAuth

For faster access, sign in with your Google account:

1. Click **Sign in with Google** on the auth page
2. Authorize AI-IDEI in the Google consent screen
3. You're redirected back and signed in automatically

If you signed up with email first, you can link your Google account later from Profile settings.

### Password Reset

If you forget your password:
1. Click **Forgot password?** on the sign-in page
2. Enter your email address
3. Check your inbox for the reset link
4. Set a new password

Reset links expire after 1 hour.

### Session Management

Sessions use JWT tokens with automatic refresh:

| Property | Value |
|----------|-------|
| Token type | JWT (JSON Web Token) |
| Access token lifetime | 1 hour |
| Refresh token lifetime | 30 days |
| Storage | localStorage (encrypted) |
| Auto-refresh | Yes, transparent to user |

Sessions persist across browser restarts. Signing out explicitly invalidates the session.

### Multi-Device Sessions

You can be signed in on multiple devices simultaneously. Each device maintains its own session. Changing your password invalidates all existing sessions.

## API Authentication

### Generating API Keys

For programmatic access:

1. Go to **Account → Profile**
2. Scroll to the **API Keys** section
3. Click **Generate New Key**
4. Configure the key:

| Setting | Description |
|---------|-------------|
| Name | Descriptive label (e.g., "Production Server") |
| Scopes | Permissions granted to this key |
| Daily limit | Maximum requests per day |
| Expiry | Optional expiration date |

5. Copy the key — it's shown only once

**Key format:** \`aidei_xxxxxxxxxxxxxxxxxxxxxxxxxxxx\`

### Available Scopes

API keys can be scoped to specific operations for security:

| Scope | Permission |
|-------|-----------|
| \`neurons:read\` | Read neuron data |
| \`neurons:write\` | Create, update, delete neurons |
| \`jobs:read\` | Read job status and results |
| \`jobs:write\` | Create and manage jobs |
| \`artifacts:read\` | Read artifact content |
| \`artifacts:write\` | Delete artifacts |
| \`search\` | Perform search operations |
| \`entities:read\` | Read entity data |
| \`webhooks:manage\` | Create and manage webhooks |

**Principle of least privilege:** Only grant the scopes your integration actually needs.

### Using API Keys

Include the key in the request header:
\`\`\`bash
curl -X GET "https://<project>/functions/v1/neuron-api/neurons" \\
  -H "X-API-Key: aidei_xxxxxxxxxxxxxxxxxxxx"
\`\`\`

### Key Rotation

For security, rotate your API keys periodically:
1. Generate a new key with the same scopes
2. Update your integration to use the new key
3. Verify the new key works
4. Revoke the old key

### Key Revocation

Revoke a key immediately if it's compromised:
1. Go to **Account → Profile** → API Keys
2. Click the **Revoke** button next to the key
3. The key is invalidated instantly — all requests using it will return 401

## Row-Level Security

All data access is governed by Row-Level Security (RLS) at the database level. This means:

- **Even with a valid API key**, you can only access data you own
- Public data (published entities, shared neurons) is accessible to all authenticated users
- Admin operations require a verified admin role in the \`user_roles\` table
- RLS policies are checked on every single query — no exceptions

This provides defense-in-depth security: even if application code has a vulnerability, the database prevents unauthorized data access.

## Security Best Practices

- **Never expose API keys in client-side code** — use them only in server-side applications
- **Use environment variables** — store keys in \`.env\` files, never in source code
- **Monitor usage** — check your API key usage regularly in the Profile dashboard
- **Set expiry dates** — for temporary integrations, set an expiration date
- **Use minimal scopes** — grant only the permissions your integration needs
- **Enable notifications** — get alerted when a key approaches its daily limit

## Troubleshooting

### "401 Unauthorized"
- Verify the API key is correct and hasn't been revoked
- Check that the key hasn't expired
- Ensure the \`X-API-Key\` header is spelled correctly

### "403 Forbidden"
- The key lacks the required scope for this operation
- Generate a new key with the appropriate scopes

### "429 Too Many Requests"
- You've exceeded the daily rate limit
- Wait until the limit resets (see \`X-RateLimit-Reset\` header)
- Consider upgrading your key's daily limit

## Further Reading

- [API Overview](/docs/developer/api-overview) — full API documentation
- [Security & Privacy](/docs/reference/security) — platform security details
- [Webhooks](/docs/developer/webhooks) — webhook configuration`,
  },
};
