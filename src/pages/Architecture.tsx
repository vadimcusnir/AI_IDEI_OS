import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import {
  Database, Layers, GitBranch, Blocks, Copy, Zap, Search, Server,
  Brain, Shield, Coins, Workflow, MessageSquare, Users, BookOpen,
  Bell, MessageCircle, BarChart3, Globe, UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mb-14">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-xl">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">{children}</div>
  </section>
);

const CodeBlock = ({ title, children }: { title?: string; children: string }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden my-4">
    {title && <div className="px-4 py-2 border-b border-border bg-muted text-micro font-mono uppercase tracking-wider text-muted-foreground">{title}</div>}
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
  const { t } = useTranslation("architecture");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Architecture — AI-IDEI" description="Technical architecture overview: data model, pipeline, knowledge graph and system design." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-3xl mb-3">{t("hero.title")}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mb-6">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "React + Vite + TypeScript", "Supabase (PostgreSQL)", "Edge Functions",
              "Lovable AI Gateway", "RLS Security", "SSE Streaming",
              "Realtime Subscriptions", "Desktop Notifications",
            ].map(tag => (
              <span key={tag} className="text-micro uppercase tracking-wider bg-muted px-2 py-1 rounded font-semibold text-muted-foreground">{tag}</span>
            ))}
          </div>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="mb-14 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold mb-3">{t("toc.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {(t("toc.items", { returnObjects: true }) as string[]).map((item, i) => (
              <span key={i} className="text-xs text-muted-foreground py-0.5">{item}</span>
            ))}
          </div>
        </div>

        {/* ─── 1. CONCEPT & MISSION ─── */}
        <Section icon={Brain} title={t("s1.title")}>
          <Callout>
            <strong>{t("s1.callout_label")}:</strong> {t("s1.callout")}
          </Callout>
          <p>{t("s1.intro")}</p>
          <ul className="list-disc pl-6 space-y-1">
            {(t("s1.bullets", { returnObjects: true }) as string[]).map((b, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </ul>

          <h3 className="text-base mt-6 text-foreground">{t("s1.pipeline_title")}</h3>
          <CodeBlock title="Knowledge Pipeline">{t("s1.pipeline_code")}</CodeBlock>

          <p dangerouslySetInnerHTML={{ __html: t("s1.philosophy") }} />

          <h3 className="text-base mt-6 text-foreground">{t("s1.positioning_title")}</h3>
          <p dangerouslySetInnerHTML={{ __html: t("s1.positioning") }} />
        </Section>

        {/* ─── 2. NEURON OBJECT MODEL ─── */}
        <Section icon={Database} title={t("s2.title")}>
          <p>{t("s2.intro")}</p>
          <Table
            headers={["Layer", "Field", "Purpose", "Mutability"]}
            rows={[
              ["Internal", "id (bigint)", t("s2.id_purpose"), "Immutable"],
              ["Global", "uuid (UUID v4)", t("s2.uuid_purpose"), "Immutable"],
              ["Public", "number (bigint)", t("s2.number_purpose"), "Immutable"],
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

          <p><strong>{t("s2.composition_title")}:</strong></p>
          <Table
            headers={[t("s2.scale"), t("s2.neurons_col"), t("s2.example")]}
            rows={t("s2.composition_rows", { returnObjects: true }) as string[][]}
          />

          <p><strong>{t("s2.lifecycle_title")}:</strong> <code className="text-xs bg-muted px-1 rounded">ingested → structured → active → capitalized → compounded</code></p>
        </Section>

        {/* ─── 3. BLOCK SYSTEM ─── */}
        <Section icon={Blocks} title={t("s3.title")}>
          <p dangerouslySetInnerHTML={{ __html: t("s3.intro") }} />

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
            headers={[t("s3.category"), t("s3.block_types"), t("s3.executable")]}
            rows={t("s3.types_rows", { returnObjects: true }) as string[][]}
          />

          <p dangerouslySetInnerHTML={{ __html: t("s3.editor_desc") }} />
        </Section>

        {/* ─── 4. CONTENT CLASSIFICATION ─── */}
        <Section icon={Layers} title={t("s4.title")}>
          <p dangerouslySetInnerHTML={{ __html: t("s4.intro") }} />

          <Table
            headers={[t("s4.category"), t("s4.description"), t("s4.example")]}
            rows={t("s4.categories_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s4.service_title")}</h3>
          <Table
            headers={[t("s4.class"), t("s4.type"), t("s4.cost"), t("s4.examples")]}
            rows={t("s4.service_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 5. RELATIONS & GRAPH ─── */}
        <Section icon={Layers} title={t("s5.title")}>
          <p>{t("s5.intro")}</p>

          <CodeBlock title="Link Schema">{`neuron_links
├── id: uuid (PK)
├── source_neuron_id: bigint → neurons(id)
├── target_neuron_id: bigint → neurons(id)
├── relation_type: text — 'supports','contradicts','extends',
│                         'references','derived_from','parent','child'
└── created_at: timestamptz`}</CodeBlock>

          <p dangerouslySetInnerHTML={{ __html: t("s5.nas_desc") }} />
          <CodeBlock title="Addressing">{`neuron_addresses
├── neuron_id → neurons(id)
├── domain: text — 'marketing', 'psychology', etc.
├── level_1..level_4: text — hierarchical segments
├── path: text — '/marketing/virality/identity-signals'
├── depth: integer

neuron_address_aliases
├── alias: text — 'viral-marketing'
├── target_path: text — '/marketing/virality'`}</CodeBlock>
        </Section>

        {/* ─── 6. VERSIONING ─── */}
        <Section icon={GitBranch} title={t("s6.title")}>
          <p>{t("s6.intro")}</p>

          <CodeBlock title="Version Schema">{`neuron_versions
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── version: integer (sequential per neuron)
├── parent_version_id: uuid → neuron_versions(id) [nullable]
├── title: text (snapshot title)
├── change_summary: text
├── blocks_snapshot: jsonb (complete state)
├── diff: jsonb (delta from parent)
├── author_id: uuid
├── created_at: timestamptz`}</CodeBlock>

          <Table
            headers={[t("s6.operation"), t("s6.description")]}
            rows={t("s6.ops_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 7. EXECUTION MODEL & SERVICES ─── */}
        <Section icon={Zap} title={t("s7.title")}>
          <p>{t("s7.intro")}</p>

          <Table
            headers={[t("s7.mode"), t("s7.behavior"), t("s7.use_cases")]}
            rows={t("s7.modes_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s7.implemented_title")}</h3>
          <Table
            headers={["Service Key", t("s7.name"), t("s7.class"), t("s7.credits")]}
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

          <p>{t("s7.realtime")}</p>
        </Section>

        {/* ─── 8. CREDIT ECONOMY ─── */}
        <Section icon={Coins} title={t("s8.title")}>
          <Callout>
            <strong>{t("s8.callout_label")}:</strong> {t("s8.callout")}
          </Callout>

          <p>{t("s8.intro")}</p>

          <CodeBlock title="Credit Schema">{`user_credits
├── user_id: uuid (unique)
├── balance: integer (default 500 — free initial credits)
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

          <h3 className="text-base mt-6 text-foreground">{t("s8.flow_title")}</h3>
          <CodeBlock title="Job Runner Pipeline">{t("s8.flow_code")}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s8.economy_title")}</h3>
          <Table
            headers={[t("s8.metric"), t("s8.value")]}
            rows={t("s8.economy_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 9. INGESTION PIPELINE ─── */}
        <Section icon={Workflow} title={t("s9.title")}>
          <p>{t("s9.intro")}</p>

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

          <p dangerouslySetInnerHTML={{ __html: t("s9.podcast_desc") }} />

          <Table
            headers={[t("s9.stage"), t("s9.component"), t("s9.output")]}
            rows={t("s9.stages_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 10. NOTIFICATION SYSTEM ─── */}
        <Section icon={Bell} title={t("s10.title")}>
          <Callout>
            <strong>{t("s10.callout_label")}:</strong> {t("s10.callout")}
          </Callout>

          <CodeBlock title="Notifications Schema">{`notifications
├── id: uuid (PK)
├── user_id: uuid → auth.users(id)
├── type: text — 'job_completed','job_failed','credits_low',
│                 'version_created','feedback_new','feedback_response'
├── title: text
├── message: text
├── link: text (nullable — redirect target)
├── meta: jsonb (contextual data: job_id, neuron_id, etc.)
├── read: boolean (default false)
├── created_at: timestamptz`}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s10.triggers_title")}</h3>
          <Table
            headers={[t("s10.trigger"), t("s10.table"), t("s10.condition"), t("s10.notification")]}
            rows={t("s10.triggers_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s10.prefs_title")}</h3>
          <CodeBlock title="Notification Preferences">{`notification_preferences
├── user_id: uuid (unique)
├── push_enabled: boolean — Desktop Notifications API permission
├── push_jobs: boolean — Alert on job completion/failure
├── push_credits: boolean — Low credits alert
├── push_feedback: boolean — Feedback response alert
├── push_versions: boolean — New version alert
├── email_digest: enum('none','daily','weekly')
├── email_jobs / email_credits / email_feedback: boolean
├── quiet_hours_start / quiet_hours_end: smallint (0-23)

Auto-created via handle_new_user() trigger on auth.users INSERT.`}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s10.channels_title")}</h3>
          <Table
            headers={[t("s10.channel"), t("s10.implementation"), t("s10.status")]}
            rows={t("s10.channels_rows", { returnObjects: true }) as string[][]}
          />

          <p dangerouslySetInnerHTML={{ __html: t("s10.bell_desc") }} />
        </Section>

        {/* ─── 11. FEEDBACK & TESTIMONIALS ─── */}
        <Section icon={MessageCircle} title={t("s11.title")}>
          <p>{t("s11.intro")}</p>

          <CodeBlock title="Feedback Schema">{`feedback
├── id: uuid (PK)
├── user_id: uuid → auth.users(id)
├── type: enum('feedback','testimonial','review','proposal','complaint')
├── title: text
├── message: text (max 2000 characters)
├── rating: smallint (1-5, nullable — required for review/testimonial)
├── status: enum('pending','reviewed','resolved','published')
├── is_public: boolean (default false — admin-controlled)
├── context_page: text (page from which it was submitted)
├── admin_response: text (nullable)
├── admin_responded_at: timestamptz
├── created_at / updated_at: timestamptz`}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s11.collection_title")}</h3>
          <Table
            headers={[t("s11.point"), t("s11.component"), t("s11.behavior")]}
            rows={t("s11.collection_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s11.admin_title")}</h3>
          <CodeBlock title="Admin Feedback Flow">{t("s11.admin_code")}</CodeBlock>
        </Section>

        {/* ─── 12. USER PROFILES & PUBLIC PAGES ─── */}
        <Section icon={UserCircle} title={t("s12.title")}>
          <CodeBlock title="Profiles Schema">{`profiles
├── id: uuid (PK)
├── user_id: uuid → auth.users(id) (unique)
├── display_name: text
├── username: text (unique, nullable — for public URLs)
├── bio: text
├── avatar_url: text
├── created_at / updated_at: timestamptz

Auto-created via handle_new_user() trigger.
Public profiles readable by all (RLS: true for SELECT).`}</CodeBlock>

          <Table
            headers={[t("s12.page"), t("s12.route"), t("s12.function")]}
            rows={t("s12.pages_rows", { returnObjects: true }) as string[][]}
          />

          <p>{t("s12.settings_desc")}</p>
        </Section>

        {/* ─── 13. ADMIN DASHBOARD ─── */}
        <Section icon={BarChart3} title={t("s13.title")}>
          <Callout>
            <strong>{t("s13.callout_label")}:</strong> {t("s13.callout")}
          </Callout>

          <Table
            headers={["Tab", t("s13.functions")]}
            rows={t("s13.tabs_rows", { returnObjects: true }) as string[][]}
          />

          <CodeBlock title="Role System">{`user_roles
├── id: uuid (PK)
├── user_id: uuid → auth.users(id) (ON DELETE CASCADE)
├── role: enum('admin','moderator','user')
├── UNIQUE(user_id, role)

has_role(_user_id uuid, _role app_role) → boolean
  SECURITY DEFINER — bypasses RLS to prevent recursion
  Used in all admin RLS policies`}</CodeBlock>
        </Section>

        {/* ─── 14. RULES & PRINCIPLES ─── */}
        <Section icon={Shield} title={t("s14.title")}>
          <Callout>
            <strong>{t("s14.callout_label")}:</strong> {t("s14.callout")}
          </Callout>

          <Table
            headers={[t("s14.principle"), t("s14.description")]}
            rows={t("s14.principles_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s14.security_title")}</h3>
          <Table
            headers={[t("s14.layer"), t("s14.implementation")]}
            rows={t("s14.security_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 15. CLONING & TEMPLATES ─── */}
        <Section icon={Copy} title={t("s15.title")}>
          <p>{t("s15.intro")}</p>

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
            headers={[t("s15.operation"), t("s15.description")]}
            rows={t("s15.ops_rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 16. PAGES & UI ─── */}
        <Section icon={BookOpen} title={t("s16.title")}>
          <h3 className="text-base mt-2 text-foreground">{t("s16.public_routes")}</h3>
          <Table
            headers={[t("s16.route"), t("s16.page"), t("s16.function")]}
            rows={t("s16.public_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s16.protected_routes")}</h3>
          <Table
            headers={[t("s16.route"), t("s16.page"), t("s16.function")]}
            rows={t("s16.protected_rows", { returnObjects: true }) as string[][]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s16.admin_routes")}</h3>
          <Table
            headers={[t("s16.route"), t("s16.page"), t("s16.function")]}
            rows={[
              ["/admin", "Admin Dashboard", t("s16.admin_desc")],
            ]}
          />

          <h3 className="text-base mt-6 text-foreground">{t("s16.nav_title")}</h3>
          <p>{t("s16.nav_desc")}</p>
          <CodeBlock title="Navigation Flow">{`Home (Cockpit) → Extractor (Ingestion) → Neurons (Management)
→ Services (Execution) → Jobs (Monitoring) → Credits (Balance)

Header includes:
  - NEURONS balance badge (real-time via DB subscription)
  - NotificationBell (unread count, dropdown preview)
  - Feedback link
  - ThemeToggle (light/dark)`}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s16.editor_title")}</h3>
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

        {/* ─── 17. SCALABILITY ─── */}
        <Section icon={Search} title={t("s17.title")}>
          <Table
            headers={[t("s17.strategy"), t("s17.implementation"), t("s17.benefit")]}
            rows={t("s17.rows", { returnObjects: true }) as string[][]}
          />
        </Section>

        {/* ─── 18. API ─── */}
        <Section icon={Server} title={t("s18.title")}>
          <p>{t("s18.intro")}</p>

          <Table
            headers={["Function", "Purpose", "Auth"]}
            rows={[
              ["neuron-api", t("s18.neuron_api"), "JWT"],
              ["run-service", t("s18.run_service"), "Anon key"],
              ["extract-neurons", t("s18.extract_neurons"), "Anon key"],
              ["neuron-chat", t("s18.neuron_chat"), "JWT"],
              ["extract-insights", t("s18.extract_insights"), "JWT"],
            ]}
          />

          <CodeBlock title="AI Gateway Integration">{`Endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
Auth: Bearer LOVABLE_API_KEY (auto-provisioned)
Models: google/gemini-3-flash-preview (default)
         google/gemini-2.5-flash (backup)
Mode: Streaming (SSE) or non-streaming
Rate limits: per-workspace, 429 on exceed, 402 on credits exhausted`}</CodeBlock>

          <h3 className="text-base mt-6 text-foreground">{t("s18.secrets_title")}</h3>
          <Table
            headers={["Secret", t("s18.purpose")]}
            rows={[
              ["SUPABASE_URL", t("s18.secret_url")],
              ["SUPABASE_ANON_KEY", t("s18.secret_anon")],
              ["SUPABASE_SERVICE_ROLE_KEY", t("s18.secret_service")],
              ["SUPABASE_DB_URL", t("s18.secret_db")],
              ["LOVABLE_API_KEY", t("s18.secret_ai")],
            ]}
          />
        </Section>

        {/* Footer */}
        <div className="border-t border-border pt-8 mt-16 text-center">
          <p className="text-xs text-muted-foreground">AI-IDEI · Knowledge Operating System v1.1</p>
          <p className="text-micro text-muted-foreground/50 mt-1">
            {t("footer.doc_label")} — 18 {t("footer.sections")} · {new Date().toLocaleDateString()}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Landing Page
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/links")} className="text-xs gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Links
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
