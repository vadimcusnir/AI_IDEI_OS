import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Database, Layers, GitBranch, Blocks, Copy, Zap, Search, Server,
  Brain, Shield, Coins, Workflow, MessageSquare, Users, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.gif";
import { ThemeToggle } from "@/components/ThemeToggle";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mb-14">
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

const Callout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/5 border-l-2 border-primary rounded-r-lg px-4 py-3 text-sm my-4">{children}</div>
);

export default function Architecture() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
          <span className="text-sm font-serif">Knowledge Operating System — Architecture</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-3xl font-serif mb-3">AI-IDEI · Knowledge Operating System</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mb-6">
            Complete architecture for a Knowledge Operating System built on atomic, programmable Neurons.
            Designed for 100K+ neurons with full-text search, Git-like versioning, dynamic block types,
            cloning/templates, deterministic AI services, and a credit-based economy.
          </p>
          <div className="flex flex-wrap gap-2">
            {["React + Vite + TypeScript", "Supabase (PostgreSQL)", "Edge Functions", "Lovable AI Gateway", "RLS Security", "SSE Streaming"].map(t => (
              <span key={t} className="text-[10px] uppercase tracking-wider bg-muted px-2 py-1 rounded font-semibold text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        {/* ─── 1. CONCEPT & MISSION ─── */}
        <Section icon={Brain} title="1. Concept & Mission">
          <Callout>
            <strong>Misiune:</strong> Transformarea cunoașterii brute (transcrieri, note, idei) în active intelectuale programabile, capitalizabile și tranzacționabile.
          </Callout>
          <p>AI-IDEI este un <strong>Knowledge Operating System (KOS)</strong> — nu un simplu editor de note sau CMS. Sistemul operează pe principiul că fiecare unitate de cunoaștere (Neuron) este un obiect programabil care poate fi:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Capturat</strong> — din transcrieri, interviuri, podcasturi, texte</li>
            <li><strong>Structurat</strong> — în blocuri tipizate cu metadate semantice</li>
            <li><strong>Conectat</strong> — prin grafuri de relații (supports, contradicts, extends)</li>
            <li><strong>Executat</strong> — prin servicii AI deterministe cu costuri fixe</li>
            <li><strong>Versionat</strong> — cu istoric Git-like și restaurare</li>
            <li><strong>Capitalizat</strong> — transformat în livrabile economice (cursuri, strategii, produse)</li>
          </ul>
          <p><strong>Filosofie:</strong> „Services First, Knowledge Always." Sistemul nu generează conținut aleatoriu — execută servicii deterministe cu input definit, cost fixat, și output auditabil.</p>
        </Section>

        {/* ─── 2. NEURON OBJECT MODEL ─── */}
        <Section icon={Database} title="2. Neuron Object — Data Model">
          <p>Neuronul este unitatea atomică de cunoaștere. Intern, este un document programabil compus din blocuri tipizate, cu un sistem de identitate pe trei nivele:</p>
          <Table
            headers={["Layer", "Field", "Purpose", "Mutability"]}
            rows={[
              ["Internal", "id (bigint)", "Database primary key, auto-increment", "Immutable"],
              ["Global", "uuid (UUID v4)", "Cross-system reference", "Immutable"],
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
├── lifecycle: enum('ingested','structured','active','capitalized','compounded')
├── content_category: enum('transcript','insight','framework','strategy',
│                          'formula','pattern','avatar','argument_map',
│                          'narrative','psychological','commercial')
├── episode_id: uuid → episodes(id) [nullable]
├── credits_cost: integer (default 0)
├── score: float (0-100, computed)
├── created_at / updated_at: timestamptz`}</CodeBlock>

          <p><strong>Composition hierarchy:</strong></p>
          <Table
            headers={["Scale", "Neurons", "Example"]}
            rows={[
              ["Atomic", "1", "A single insight or idea"],
              ["Article", "10", "Blog post or analysis"],
              ["Framework", "30", "Mental model or methodology"],
              ["Course", "100", "Complete educational program"],
              ["Knowledge Base", "500+", "Book or comprehensive system"],
            ]}
          />

          <p><strong>Lifecycle progression:</strong> <code className="text-xs bg-muted px-1 rounded">ingested → structured → active → capitalized → compounded</code></p>
        </Section>

        {/* ─── 3. BLOCK SYSTEM ─── */}
        <Section icon={Blocks} title="3. Universal Block System">
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

          <Table
            headers={["Category", "Block Types", "Executable"]}
            rows={[
              ["Content", "text, heading, subheading, markdown, todo, quote, list, idea, reference", "No"],
              ["Structure", "divider", "No"],
              ["Code", "code, yaml, json", "Yes"],
              ["AI", "prompt, dataset, diagram, ai-action", "Yes"],
            ]}
          />

          <p>Editorul Neuron este un sistem hibrid bloc-based — hybrid între Notion (structură), Google Docs (editare), VSCode (cod), și Jupyter (execuție). Suportă inserție via slash command (<code className="text-xs bg-muted px-1 rounded">/</code>).</p>
        </Section>

        {/* ─── 4. CONTENT CLASSIFICATION ─── */}
        <Section icon={Layers} title="4. Content Classification">
          <p>Fiecare neuron este clasificat pe două dimensiuni: <strong>content_category</strong> (ce conține) și <strong>lifecycle</strong> (stadiul de maturitate).</p>

          <Table
            headers={["Category", "Description", "Example"]}
            rows={[
              ["transcript", "Raw transcribed content", "Podcast episode verbatim"],
              ["insight", "Extracted key takeaway", "Customer retention driver"],
              ["framework", "Mental model or methodology", "AIDA model applied to SaaS"],
              ["strategy", "Action plan or approach", "Go-to-market plan"],
              ["formula", "Repeatable pattern or recipe", "Pricing formula for info products"],
              ["pattern", "Recurring behavior identified", "Churn pattern in month 3"],
              ["avatar", "User or audience profile", "Solo entrepreneur persona"],
              ["argument_map", "Logical structure of ideas", "Pro/contra analysis"],
              ["narrative", "Story or case study", "Founder journey narrative"],
              ["psychological", "Behavioral or cognitive insight", "Loss aversion in pricing"],
              ["commercial", "Business or revenue model", "Subscription tier architecture"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Service Classification</h3>
          <Table
            headers={["Class", "Type", "Cost Range", "Examples"]}
            rows={[
              ["A", "Analysis & Extraction", "50-100 credits", "Insight Extractor, Framework Detector, Quote Extractor"],
              ["B", "Production & Generation", "100-200 credits", "Course Generator, Strategy Builder, Prompt Generator"],
              ["C", "Complex Orchestration", "200-500 credits", "Market Research, Argument Mapper, Content Classifier"],
            ]}
          />
        </Section>

        {/* ─── 5. RELATIONS & GRAPH ─── */}
        <Section icon={Layers} title="5. Relations & Knowledge Graph">
          <p>Neurons form a directed graph through typed links. Each link has a semantic relation type enabling knowledge traversal, contradiction detection, and dependency tracking.</p>

          <CodeBlock title="Link Schema">{`neuron_links
├── id: uuid (PK)
├── source_neuron_id: bigint → neurons(id)
├── target_neuron_id: bigint → neurons(id)
├── relation_type: text — 'supports','contradicts','extends',
│                         'references','derived_from','parent','child'
└── created_at: timestamptz`}</CodeBlock>

          <p><strong>NAS (Neuron Addressing System):</strong> Semantic coordinates separate identity from location.</p>
          <CodeBlock title="Addressing">{`neuron_addresses
├── neuron_id → neurons(id)
├── domain: text — 'marketing', 'psychology', etc.
├── level_1..level_4: text — hierarchical path segments
├── path: text — '/marketing/virality/identity-signals'
├── depth: integer

neuron_address_aliases
├── alias: text — 'viral-marketing'
├── target_path: text — '/marketing/virality'`}</CodeBlock>
        </Section>

        {/* ─── 6. VERSIONING ─── */}
        <Section icon={GitBranch} title="6. Git-like Versioning System">
          <p>Each version stores a complete blocks snapshot with optional diff from parent. Supports branching, restore, and knowledge evolution tracking.</p>

          <CodeBlock title="Version Schema">{`neuron_versions
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── version: integer (sequential per neuron)
├── parent_version_id: uuid → neuron_versions(id) [nullable]
├── title: text (snapshot title)
├── change_summary: text
├── blocks_snapshot: jsonb (full state)
├── diff: jsonb (delta from parent)
├── author_id: uuid
├── created_at: timestamptz`}</CodeBlock>

          <Table
            headers={["Operation", "Description"]}
            rows={[
              ["Snapshot", "Capture current blocks state as new version"],
              ["Restore", "Revert neuron to any previous version state"],
              ["Diff", "Compare two versions to see changes"],
              ["Branch", "Fork version into new chain for parallel editing"],
            ]}
          />
        </Section>

        {/* ─── 7. EXECUTION MODEL & SERVICES ─── */}
        <Section icon={Zap} title="7. Execution Model & AI Services">
          <p>Blocks can be executed based on their execution mode. Services are deterministic AI pipelines with fixed costs and auditable outputs.</p>

          <Table
            headers={["Mode", "Behavior", "Use Case"]}
            rows={[
              ["passive", "No execution, content only", "Text, headings, quotes"],
              ["validated", "Schema/syntax check on change", "JSON, dataset, diagram"],
              ["executable", "Run on demand (play button)", "Code, YAML pipelines, prompts"],
              ["automated", "Auto-run on trigger/schedule", "AI actions, workflows"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Implemented Services (10)</h3>
          <Table
            headers={["Service Key", "Name", "Class", "Credits"]}
            rows={[
              ["insight-extractor", "Extract Insights", "A", "50"],
              ["framework-detector", "Detect Frameworks", "A", "75"],
              ["question-engine", "Generate Questions", "A", "50"],
              ["quote-extractor", "Extract Quotes", "A", "50"],
              ["prompt-generator", "Generate Prompts", "B", "100"],
              ["market-research", "Market Research", "C", "200"],
              ["course-generator", "Course Generator", "B", "150"],
              ["content-classifier", "Content Classifier", "A", "75"],
              ["strategy-builder", "Strategy Builder", "B", "150"],
              ["argument-mapper", "Argument Mapper", "B", "100"],
            ]}
          />

          <CodeBlock title="Job Tracking">{`neuron_jobs
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── block_id: uuid → neuron_blocks(id) [nullable]
├── worker_type: text — service_key
├── status: enum('pending','running','completed','failed')
├── input: jsonb
├── result: jsonb { content, credits_spent, service }
├── author_id: uuid
├── created_at / completed_at: timestamptz`}</CodeBlock>
        </Section>

        {/* ─── 8. CREDIT ECONOMY ─── */}
        <Section icon={Coins} title="8. Credit Economy (NEURONS)">
          <Callout>
            <strong>Dual-Token Model:</strong> NOTA2 (on-chain, acces & staking) + NEURONS (off-chain, credite de computație pentru servicii AI)
          </Callout>

          <p>Sistemul de credite implementează un model de economie internă cu rezervare atomică, auditare și release on failure.</p>

          <CodeBlock title="Credit Schema">{`user_credits
├── user_id: uuid (unique)
├── balance: integer (default 500)
├── total_earned: integer (default 500)
├── total_spent: integer (default 0)
├── updated_at: timestamptz

credit_transactions
├── id: uuid (PK)
├── user_id: uuid
├── job_id: uuid → neuron_jobs(id) [nullable]
├── amount: integer (+ earned, - spent)
├── type: enum('spend','reserve','release','denied','topup','bonus')
├── description: text
├── created_at: timestamptz`}</CodeBlock>

          <h3 className="text-base font-serif mt-6 text-foreground">Credit Flow</h3>
          <CodeBlock title="Job Runner Pipeline">{`1. Client → POST /run-service { job_id, service_key, neuron_id, inputs, user_id }
2. Server: Check balance ≥ service.credits_cost
3. Server: RESERVE — deduct credits atomically
4. Server: Log transaction (type: 'reserve')
5. Server: Execute AI via Lovable AI Gateway (SSE streaming)
6. Server: TEE stream → client (live) + audit (collect full result)
7. On SUCCESS:
   └─ Log transaction (type: 'spend')
   └─ Save result as neuron_block (type: 'markdown')
   └─ Update neuron lifecycle → 'structured'
   └─ Mark job 'completed'
8. On FAILURE:
   └─ RELEASE credits (restore balance)
   └─ Log transaction (type: 'release')
   └─ Mark job 'failed'`}</CodeBlock>
        </Section>

        {/* ─── 9. INGESTION PIPELINE ─── */}
        <Section icon={Workflow} title="9. Ingestion & Extraction Pipeline">
          <p>Pipeline-ul complet de la conținut brut la neuroni structurați:</p>

          <CodeBlock title="Full Pipeline">{`┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Raw Input  │ ──→ │   Episode    │ ──→ │   Extract     │ ──→ │   Neurons    │
│  (text/url) │     │  (Extractor) │     │   (AI, 100cr) │     │  (3-8 per ep)│
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘

Episode Status Flow:
  uploaded → transcribed → analyzing → analyzed

For each extracted neuron:
  - title: AI-generated (max 12 words)
  - content_category: classified by AI
  - blocks: heading + text + quote + idea blocks
  - lifecycle: 'structured'
  - episode_id: linked to source episode
  - credits_cost: proportional (100 / num_neurons)`}</CodeBlock>

          <p><strong>Podcast Intelligence:</strong> Sistemul poate extrage din podcasturi: identificarea segmentelor cheie, extragerea citatelor directe, generarea de rezumate, și clasificarea conținutului. Episoadele suportă tipuri: <code className="text-xs bg-muted px-1 rounded">text, audio, video, url</code>.</p>

          <Table
            headers={["Stage", "Component", "Output"]}
            rows={[
              ["1. Upload", "Extractor page", "Episode record (status: uploaded)"],
              ["2. Transcribe", "Manual/AI (planned)", "Transcript text (status: transcribed)"],
              ["3. Extract", "extract-neurons Edge Function", "3-8 neurons with blocks (status: analyzed)"],
              ["4. Structure", "Neuron Editor", "Refined blocks, categories, addresses"],
              ["5. Service", "run-service Edge Function", "AI deliverables saved as blocks"],
              ["6. Capitalize", "Export/Publish", "Courses, strategies, products"],
            ]}
          />
        </Section>

        {/* ─── 10. RULES & PRINCIPLES ─── */}
        <Section icon={Shield} title="10. Rules & Operating Principles">
          <Callout>
            <strong>Core Principles:</strong> Services First · Job-centric Architecture · Invisible Library · Deterministic Execution
          </Callout>

          <Table
            headers={["Principle", "Description"]}
            rows={[
              ["Services First", "Every AI interaction is a defined service with cost, input schema, and deliverables — not free-form chat"],
              ["Job-centric Architecture", "All work is tracked as auditable jobs: pending → running → completed/failed"],
              ["Deterministic Execution", "Same input + same service = predictable output structure. No randomness in pipeline"],
              ["Credit Firewall", "No execution without sufficient credits. Reserve before execution, release on failure"],
              ["Invisible Library", "Knowledge graph is implicit — neurons are connected but never exposed as a traditional library"],
              ["Audit Trail", "Every credit movement is logged: reserve, spend, release, denied. Full transaction ledger"],
              ["RLS Everywhere", "Row-Level Security on all tables. Users only see their own data. Admins have separate policies"],
              ["Lifecycle Progression", "Neurons evolve: ingested → structured → active → capitalized → compounded"],
              ["Block Composability", "Any block type can be added to any neuron. New types registered dynamically"],
              ["Version Immutability", "Versions are append-only snapshots. History cannot be altered"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Security Model</h3>
          <Table
            headers={["Layer", "Implementation"]}
            rows={[
              ["Authentication", "Supabase Auth with email/password, session persistence"],
              ["Authorization", "RLS policies per table; has_role() SECURITY DEFINER function"],
              ["Roles", "Separate user_roles table (admin, moderator, user) — never on profile"],
              ["Edge Functions", "Service role key for server-side operations; CORS headers"],
              ["Credit Protection", "Server-side balance check and atomic deduction before AI execution"],
            ]}
          />
        </Section>

        {/* ─── 11. CLONING & TEMPLATES ─── */}
        <Section icon={Copy} title="11. Cloning & Template System">
          <p>Templates are pre-configured neuron structures. Cloning creates a deep copy with lineage tracking.</p>

          <CodeBlock title="Template & Clone Schema">{`neuron_templates
├── id: uuid (PK)
├── name: text
├── description: text
├── category: text — 'research', 'analysis', 'report', etc.
├── blocks_template: jsonb — array of block definitions
├── default_tags: text[]
├── is_public: boolean
├── author_id: uuid
├── usage_count: integer (default 0)

neuron_clones
├── source_neuron_id: bigint → neurons(id)
├── cloned_neuron_id: bigint → neurons(id)
├── cloned_by: uuid
├── clone_type: enum('full','template','fork')`}</CodeBlock>

          <Table
            headers={["Operation", "Description"]}
            rows={[
              ["Create from Template", "Instantiate new neuron with pre-defined block structure"],
              ["Clone Neuron", "Deep copy all blocks + metadata, track lineage"],
              ["Fork Neuron", "Clone + create link(derived_from) to source"],
              ["Save as Template", "Extract current neuron structure as reusable template"],
            ]}
          />
        </Section>

        {/* ─── 12. PAGES & UI ─── */}
        <Section icon={BookOpen} title="12. Application Pages & Flow">
          <Table
            headers={["Route", "Page", "Function"]}
            rows={[
              ["/", "Index", "Neuron list, search, navigation hub"],
              ["/auth", "Auth", "Login/signup with email verification"],
              ["/n/new", "Neuron Editor", "Create new neuron"],
              ["/n/:number", "Neuron Editor", "Edit existing neuron (3-panel layout)"],
              ["/extractor", "Extractor", "Episode ingestion, transcript management, AI extraction"],
              ["/services", "Service Catalog", "Browse 10 AI services by class (A/B/C)"],
              ["/run/:serviceKey", "Run Service", "Execute service with inputs, SSE streaming, credit tracking"],
              ["/jobs", "Jobs", "Job history with status, duration, expandable results"],
              ["/credits", "Credits", "Balance, transaction ledger, consumption by service"],
              ["/intelligence", "Intelligence", "Aggregate stats: neurons, episodes, categories, activity"],
              ["/architecture", "Architecture", "This documentation page"],
              ["/admin", "Admin Dashboard", "Admin-only: system metrics, user management"],
              ["/links", "Links", "External resource directory"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Neuron Editor Layout</h3>
          <CodeBlock title="3-Panel Layout">{`┌─────────────────────────────────────────────────┐
│  TopBar: title, status, #number, save indicator │
├──────┬──────────────────────┬───────────────────┤
│ Left │    Main Editor       │      Right        │
│Panel │  ┌────────────────┐  │  Panel            │
│      │  │ Block 1 [text] │  │  ├─ Score         │
│ Nav  │  │ Block 2 [code] │  │  ├─ AI Tools      │
│ TOC  │  │ Block 3 [quote]│  │  ├─ Links         │
│ Meta │  │ ...            │  │  ├─ Versions       │
│      │  └────────────────┘  │  ├─ Addresses     │
│      │  EditorToolbar       │  └─ Execution Log │
├──────┴──────────────────────┴───────────────────┤
│  BottomBar: block count, execution logs, status │
└─────────────────────────────────────────────────┘`}</CodeBlock>
        </Section>

        {/* ─── 13. SCALABILITY ─── */}
        <Section icon={Search} title="13. Scalability & Indexing (100K+)">
          <Table
            headers={["Strategy", "Implementation", "Benefit"]}
            rows={[
              ["GIN FTS Index", "to_tsvector on title + content", "Sub-100ms full-text search"],
              ["Composite Indexes", "author+status, neuron+position", "Fast filtered queries"],
              ["Materialized Views", "neuron_stats view per author", "Dashboard loads < 50ms"],
              ["Range Partitioning", "neuron_number_ranges table", "Collision-free parallel AI writes"],
              ["Connection Pooling", "PgBouncer built-in", "Handle 1000+ concurrent users"],
              ["Edge Caching", "CDN for public neurons", "Global <200ms reads"],
            ]}
          />
        </Section>

        {/* ─── 14. API ─── */}
        <Section icon={Server} title="14. Edge Functions & API">
          <p>Backend logic runs as Edge Functions deployed on Lovable Cloud. All endpoints use CORS headers and service role authentication.</p>

          <Table
            headers={["Function", "Purpose", "Auth"]}
            rows={[
              ["neuron-api", "CRUD for neurons, blocks, links, versions, search", "JWT"],
              ["run-service", "Job runner: credit reserve → AI execute → audit → save", "Anon key"],
              ["extract-neurons", "Episode transcript → AI extraction → 3-8 neurons", "Anon key"],
              ["neuron-chat", "Contextual AI chat within neuron editor", "JWT"],
              ["extract-insights", "Legacy insight extraction from blocks", "JWT"],
            ]}
          />

          <CodeBlock title="AI Gateway Integration">{`Endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
Auth: Bearer LOVABLE_API_KEY (auto-provisioned)
Models: google/gemini-3-flash-preview (default)
Mode: Streaming (SSE) or non-streaming
Rate limits: per-workspace, 429 on exceed, 402 on credits exhausted`}</CodeBlock>
        </Section>

        {/* Footer */}
        <div className="border-t border-border pt-8 mt-16 text-center">
          <p className="text-xs text-muted-foreground">AI-IDEI · Knowledge Operating System v1.0</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">Architecture Document — Generated from codebase · {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
