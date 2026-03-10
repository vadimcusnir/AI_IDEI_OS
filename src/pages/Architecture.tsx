import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Layers, GitBranch, Blocks, Copy, Zap, Search, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.gif";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-xl font-serif">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">{children}</div>
  </section>
);

const CodeBlock = ({ title, children }: { title?: string; children: string }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden my-4">
    {title && <div className="px-4 py-2 border-b border-border bg-muted text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>}
    <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre text-foreground">{children}</pre>
  </div>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="rounded-lg border border-border overflow-hidden my-4">
    <table className="w-full text-xs">
      <thead><tr className="bg-muted">{headers.map(h => <th key={h} className="text-left px-4 py-2 font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-border">{row.map((cell, j) => <td key={j} className="px-4 py-2 text-foreground">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export default function Architecture() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="h-12 border-b border-border bg-card flex items-center gap-3 px-6">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
        <span className="text-sm font-serif">Knowledge Operating System — Architecture</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-16">
          <h1 className="text-3xl font-serif mb-3">KOS Architecture</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Complete architecture for a Knowledge Operating System built on atomic, programmable Neurons.
            Designed for 100K+ neurons with full-text search, Git-like versioning, dynamic block types,
            cloning/templates, and a RESTful API.
          </p>
        </div>

        {/* 1. DATA MODEL */}
        <Section icon={Database} title="1. Data Model — The Neuron Object">
          <p>A Neuron is the atomic unit of knowledge. Internally it's a programmable document composed of typed blocks, with a three-layer identity system:</p>
          <Table
            headers={["Layer", "Field", "Purpose", "Mutability"]}
            rows={[
              ["Internal", "id (bigint)", "Database primary key", "Immutable"],
              ["Global", "uuid (UUID v7)", "Cross-system reference", "Immutable"],
              ["Public", "number (bigint)", "Human citation ref #245", "Immutable"],
            ]}
          />
          <CodeBlock title="Neuron Core Schema">{`neurons
├── id: bigint (PK, auto-increment)
├── uuid: uuid (unique, default gen_random_uuid())
├── number: bigint (unique, from neuron_number_seq)
├── title: text (default 'Untitled Neuron')
├── author_id: uuid → auth.users(id)
├── status: enum('draft', 'validated', 'published')
├── visibility: enum('private', 'team', 'public')
├── score: float (0-100, computed)
├── created_at: timestamptz
└── updated_at: timestamptz (auto-trigger)`}</CodeBlock>

          <p><strong>Composition hierarchy:</strong> 1 neuron = 1 idea → 10 = article → 30 = framework → 100 = course → 500+ = book/knowledge base.</p>
        </Section>

        {/* 2. BLOCK SYSTEM */}
        <Section icon={Blocks} title="2. Universal Block System">
          <p>Blocks are the content primitives within a Neuron. Each block has a type that determines its rendering, execution behavior, and metadata schema. New block types can be registered dynamically via the <code className="text-xs bg-muted px-1 rounded">block_type_registry</code> table.</p>

          <CodeBlock title="Block Schema">{`neuron_blocks
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── type: text → references block_type_registry(type_key)
├── content: text
├── position: integer (ordered within neuron)
├── execution_mode: enum('passive','validated','executable','automated')
├── language: text (nullable, for code blocks)
├── checked: boolean (nullable, for todo blocks)
├── metadata: jsonb (flexible per-type config)
├── created_at / updated_at: timestamptz`}</CodeBlock>

          <CodeBlock title="Dynamic Block Type Registry">{`block_type_registry
├── type_key: text (PK) — e.g. "code", "prompt", "dataset"
├── label: text — "Code Block"
├── short_label: text — "Code"
├── icon: text — lucide icon name
├── description: text
├── category: enum('content','code','ai','structure')
├── is_executable: boolean
├── default_execution_mode: text
├── config_schema: jsonb — JSON Schema for metadata validation
├── is_system: boolean — true = built-in, false = user-defined
├── created_at: timestamptz`}</CodeBlock>

          <Table
            headers={["Category", "Block Types", "Executable"]}
            rows={[
              ["Content", "text, heading, subheading, markdown, todo, quote, list, idea, reference", "No"],
              ["Structure", "divider", "No"],
              ["Code", "code, yaml, json", "Yes"],
              ["AI", "prompt, dataset, diagram, ai-action", "Yes"],
            ]}
          />
        </Section>

        {/* 3. RELATIONS & GRAPH */}
        <Section icon={Layers} title="3. Relations & Knowledge Graph">
          <p>Neurons form a directed graph through typed links. Each link has a semantic relation type enabling knowledge traversal, contradiction detection, and dependency tracking.</p>

          <CodeBlock title="Link Schema">{`neuron_links
├── id: uuid (PK)
├── source_neuron_id: bigint → neurons(id)
├── target_neuron_id: bigint → neurons(id)
├── relation_type: enum('supports','contradicts','extends',
│                        'references','derived_from','parent','child')
├── weight: float (0-1, relevance score)
├── metadata: jsonb
└── created_at: timestamptz

Indexes:
  - (source_neuron_id, relation_type)
  - (target_neuron_id, relation_type)
  - (relation_type) for graph queries`}</CodeBlock>

          <p><strong>NAS (Neuron Addressing System):</strong> Semantic coordinates separate identity from location. Path: <code className="text-xs bg-muted px-1 rounded">/marketing/virality/identity-signals</code>. Aliases provide shortcuts.</p>
        </Section>

        {/* 4. VERSIONING */}
        <Section icon={GitBranch} title="4. Git-like Versioning System">
          <p>Each version stores a complete blocks snapshot with optional diff from parent. Supports branching, restore, and knowledge evolution tracking.</p>

          <CodeBlock title="Enhanced Version Schema">{`neuron_versions
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── version: integer (sequential per neuron)
├── parent_version_id: uuid → neuron_versions(id) [nullable]
├── title: text (snapshot title)
├── change_summary: text (what changed)
├── blocks_snapshot: jsonb (full state)
├── diff: jsonb (delta from parent, for efficient storage)
├── author_id: uuid → auth.users(id)
├── created_at: timestamptz

Operations:
  snapshot()  → capture current state
  restore(v)  → revert to version v
  diff(a, b)  → compute changes between versions
  branch(v)   → create new version chain from v
  merge(a, b) → combine two version chains`}</CodeBlock>

          <Table
            headers={["Operation", "Method", "Description"]}
            rows={[
              ["Snapshot", "POST /versions", "Save current state as new version"],
              ["Restore", "POST /versions/:id/restore", "Revert neuron to version state"],
              ["Diff", "GET /versions/:a/diff/:b", "Compare two versions"],
              ["Branch", "POST /versions/:id/branch", "Fork version into new chain"],
            ]}
          />
        </Section>

        {/* 5. EXECUTION MODEL */}
        <Section icon={Zap} title="5. Execution Model">
          <p>Blocks can be executed based on their execution mode. Jobs track async AI worker executions.</p>

          <Table
            headers={["Mode", "Behavior", "Use Case"]}
            rows={[
              ["passive", "No execution, content only", "Text, headings, quotes"],
              ["validated", "Schema/syntax check on change", "JSON, dataset, diagram"],
              ["executable", "Run on demand (play button)", "Code, YAML pipelines, prompts"],
              ["automated", "Auto-run on trigger/schedule", "AI actions, workflows"],
            ]}
          />

          <CodeBlock title="Job Tracking Schema">{`neuron_jobs
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── block_id: uuid → neuron_blocks(id) [nullable]
├── worker_type: text — 'extract_insights', 'transcribe', etc.
├── status: enum('pending','running','success','error','cancelled')
├── input: jsonb
├── result: jsonb
├── author_id: uuid
├── created_at: timestamptz
├── completed_at: timestamptz [nullable]

Pipeline: Upload → Transcribe → Extract → Graph → Service → Deliverable`}</CodeBlock>
        </Section>

        {/* 6. CLONING & TEMPLATES */}
        <Section icon={Copy} title="6. Cloning & Template System">
          <p>Templates are pre-configured neuron structures. Cloning creates a deep copy with lineage tracking.</p>

          <CodeBlock title="Template & Clone Schema">{`neuron_templates
├── id: uuid (PK)
├── name: text
├── description: text
├── category: text — 'research', 'analysis', 'report', etc.
├── blocks_template: jsonb — array of block definitions
├── default_tags: text[] — suggested tags
├── is_public: boolean
├── author_id: uuid → auth.users(id)
├── usage_count: integer (default 0)
├── created_at: timestamptz

neuron_clones
├── id: uuid (PK)
├── source_neuron_id: bigint → neurons(id)
├── cloned_neuron_id: bigint → neurons(id)
├── cloned_by: uuid → auth.users(id)
├── clone_type: enum('full','template','fork')
├── created_at: timestamptz`}</CodeBlock>

          <Table
            headers={["Operation", "Description"]}
            rows={[
              ["Create from Template", "Instantiate a new neuron with pre-defined block structure"],
              ["Clone Neuron", "Deep copy all blocks + metadata, track lineage"],
              ["Fork Neuron", "Clone + create link(derived_from) to source"],
              ["Save as Template", "Extract current neuron structure as reusable template"],
            ]}
          />
        </Section>

        {/* 7. SCALABILITY */}
        <Section icon={Search} title="7. Scalability & Indexing (100K+)">
          <p>Designed to handle millions of neurons with proper indexing, full-text search, and caching strategies.</p>

          <CodeBlock title="Indexing Strategy">{`-- Full-text search (GIN indexes)
CREATE INDEX idx_neurons_fts ON neurons
  USING GIN (to_tsvector('english', title));
CREATE INDEX idx_blocks_fts ON neuron_blocks
  USING GIN (to_tsvector('english', content));

-- Composite indexes for common queries
CREATE INDEX idx_neurons_author_status ON neurons(author_id, status);
CREATE INDEX idx_neurons_visibility ON neurons(visibility);
CREATE INDEX idx_neurons_updated ON neurons(updated_at DESC);
CREATE INDEX idx_blocks_neuron_pos ON neuron_blocks(neuron_id, position);
CREATE INDEX idx_links_source ON neuron_links(source_neuron_id, relation_type);
CREATE INDEX idx_links_target ON neuron_links(target_neuron_id, relation_type);
CREATE INDEX idx_jobs_status ON neuron_jobs(neuron_id, status);
CREATE INDEX idx_versions_neuron ON neuron_versions(neuron_id, version DESC);

-- Caching: Materialized view for dashboard stats
CREATE MATERIALIZED VIEW neuron_stats AS
SELECT
  author_id,
  COUNT(*) as total_neurons,
  COUNT(*) FILTER (WHERE status='published') as published,
  COUNT(*) FILTER (WHERE status='draft') as drafts,
  AVG(score) as avg_score,
  MAX(updated_at) as last_active
FROM neurons GROUP BY author_id;`}</CodeBlock>

          <Table
            headers={["Strategy", "Implementation", "Benefit"]}
            rows={[
              ["GIN FTS Index", "to_tsvector on title + content", "Sub-100ms full-text search"],
              ["Composite Indexes", "author+status, neuron+position", "Fast filtered queries"],
              ["Materialized Views", "Pre-computed stats per author", "Dashboard loads < 50ms"],
              ["Range Partitioning", "neuron_number_ranges table", "Collision-free parallel writes"],
              ["Connection Pooling", "Supabase built-in (PgBouncer)", "Handle 1000+ concurrent"],
              ["Edge Caching", "CDN for public neurons", "Global <200ms reads"],
            ]}
          />
        </Section>

        {/* 8. API */}
        <Section icon={Server} title="8. RESTful API Design">
          <p>Complete CRUD API via edge functions. All endpoints require authentication except public neuron reads.</p>

          <CodeBlock title="API Endpoints">{`# Neurons
GET    /neuron-api/neurons              → List neurons (paginated, filterable)
GET    /neuron-api/neurons/:id          → Get neuron with blocks
POST   /neuron-api/neurons              → Create neuron
PATCH  /neuron-api/neurons/:id          → Update neuron metadata
DELETE /neuron-api/neurons/:id          → Delete neuron

# Blocks
GET    /neuron-api/neurons/:id/blocks   → List blocks (ordered)
POST   /neuron-api/neurons/:id/blocks   → Add block
PATCH  /neuron-api/blocks/:id           → Update block
DELETE /neuron-api/blocks/:id           → Delete block
POST   /neuron-api/blocks/reorder       → Reorder blocks

# Relations
GET    /neuron-api/neurons/:id/links    → Get neuron links
POST   /neuron-api/links                → Create link
DELETE /neuron-api/links/:id            → Delete link

# Versions
GET    /neuron-api/neurons/:id/versions → List versions
POST   /neuron-api/neurons/:id/versions → Create snapshot
POST   /neuron-api/versions/:id/restore → Restore version

# Templates
GET    /neuron-api/templates            → List templates
POST   /neuron-api/templates            → Create template
POST   /neuron-api/templates/:id/use    → Instantiate from template

# Clone
POST   /neuron-api/neurons/:id/clone    → Clone neuron
POST   /neuron-api/neurons/:id/fork     → Fork neuron (clone + link)

# Search
GET    /neuron-api/search?q=...         → Full-text search across neurons`}</CodeBlock>

          <Table
            headers={["Feature", "Query Param", "Example"]}
            rows={[
              ["Pagination", "page, per_page", "?page=2&per_page=20"],
              ["Filter by status", "status", "?status=published"],
              ["Filter by visibility", "visibility", "?visibility=public"],
              ["Sort", "sort, order", "?sort=updated_at&order=desc"],
              ["Full-text search", "q", "?q=viral+marketing"],
              ["Include blocks", "include", "?include=blocks,links"],
            ]}
          />
        </Section>

        <div className="border-t border-border pt-8 mt-16 text-center">
          <p className="text-xs text-muted-foreground">AI-IDEI Knowledge Operating System v1.0</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">Architecture Document — {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
