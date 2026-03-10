import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Database, Layers, GitBranch, Blocks, Copy, Zap, Search, Server,
  Brain, Shield, Coins, Workflow, MessageSquare, Users, BookOpen,
  Bell, MessageCircle, BarChart3, Globe, UserCircle,
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
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full" />
            <span className="text-base font-serif font-bold">AI-IDEI</span>
            <span className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
              Docs
            </span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Înapoi
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-3xl font-serif mb-3">AI-IDEI · Knowledge Operating System</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mb-6">
            Arhitectura completă a unui Knowledge Operating System construit pe Neuroni atomici, programabili.
            Proiectat pentru 100K+ neuroni cu full-text search, versioning Git-like, tipuri de blocuri dinamice,
            clonare/template-uri, servicii AI deterministe, economie de credite, sistem de notificări în timp real,
            feedback & testimoniale, și administrare avansată.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "React + Vite + TypeScript", "Supabase (PostgreSQL)", "Edge Functions",
              "Lovable AI Gateway", "RLS Security", "SSE Streaming",
              "Realtime Subscriptions", "Desktop Notifications",
            ].map(t => (
              <span key={t} className="text-[10px] uppercase tracking-wider bg-muted px-2 py-1 rounded font-semibold text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="mb-14 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold mb-3">Cuprins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {[
              "1. Concept & Mission",
              "2. Neuron Object — Data Model",
              "3. Universal Block System",
              "4. Content Classification",
              "5. Relations & Knowledge Graph",
              "6. Git-like Versioning System",
              "7. Execution Model & AI Services",
              "8. Credit Economy (NEURONS)",
              "9. Ingestion & Extraction Pipeline",
              "10. Notification System",
              "11. Feedback & Testimonials",
              "12. User Profiles & Public Pages",
              "13. Admin Dashboard",
              "14. Rules & Operating Principles",
              "15. Cloning & Template System",
              "16. Application Pages & Flow",
              "17. Scalability & Indexing",
              "18. Edge Functions & API",
            ].map((item, i) => (
              <span key={i} className="text-xs text-muted-foreground py-0.5">{item}</span>
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

          <h3 className="text-base font-serif mt-6 text-foreground">Pipeline-ul Central</h3>
          <CodeBlock title="Knowledge Pipeline">{`Upload conținut → Extracție AI → Neuroni structurați → Servicii AI → Livrabile monetizabile

Exemplu concret:
  1 podcast (60 min) → 1 episod → extracție AI → 5 neuroni
  5 neuroni → 10 servicii AI → 50+ livrabile
  50+ livrabile = articole, cursuri, strategii, frameworks, scripturi`}</CodeBlock>

          <p><strong>Filosofie:</strong> „Services First, Knowledge Always." Sistemul nu generează conținut aleatoriu — execută servicii deterministe cu input definit, cost fixat, și output auditabil.</p>

          <h3 className="text-base font-serif mt-6 text-foreground">Poziționare</h3>
          <p>Platforma este „<strong>The Magic Marketing Button</strong>" — utilizatorii încarcă conținut o singură dată, iar sistemul generează automat zeci de livrabile profesionale. Marginea reală vine din reutilizare: un framework extras o dată poate fi reutilizat de 10.000 de ori.</p>
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
              ["Atomic", "1", "O singură idee sau insight"],
              ["Articol", "10", "Blog post sau analiză"],
              ["Framework", "30", "Model mental sau metodologie"],
              ["Curs", "100", "Program educațional complet"],
              ["Knowledge Base", "500+", "Carte sau sistem comprehensiv"],
            ]}
          />

          <p><strong>Lifecycle progression:</strong> <code className="text-xs bg-muted px-1 rounded">ingested → structured → active → capitalized → compounded</code></p>
        </Section>

        {/* ─── 3. BLOCK SYSTEM ─── */}
        <Section icon={Blocks} title="3. Universal Block System">
          <p>Blocurile sunt primitivele de conținut din interiorul unui Neuron. Fiecare bloc are un tip care determină randarea, comportamentul de execuție și schema de metadate. Tipurile noi pot fi înregistrate dinamic via tabelul <code className="text-xs bg-muted px-1 rounded">block_type_registry</code>.</p>

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
            headers={["Categorie", "Tipuri de Block", "Executabil"]}
            rows={[
              ["Conținut", "text, heading, subheading, markdown, todo, quote, list, idea, reference", "Nu"],
              ["Structură", "divider", "Nu"],
              ["Cod", "code, yaml, json", "Da"],
              ["AI", "prompt, dataset, diagram, ai-action", "Da"],
            ]}
          />

          <p>Editorul Neuron este un sistem hibrid bloc-based — între Notion (structură), Google Docs (editare), VSCode (cod) și Jupyter (execuție). Suportă inserție via slash command (<code className="text-xs bg-muted px-1 rounded">/</code>).</p>
        </Section>

        {/* ─── 4. CONTENT CLASSIFICATION ─── */}
        <Section icon={Layers} title="4. Content Classification">
          <p>Fiecare neuron este clasificat pe două dimensiuni: <strong>content_category</strong> (ce conține) și <strong>lifecycle</strong> (stadiul de maturitate).</p>

          <Table
            headers={["Categorie", "Descriere", "Exemplu"]}
            rows={[
              ["transcript", "Conținut transcris brut", "Episod de podcast verbatim"],
              ["insight", "Takeaway cheie extras", "Driver de retenție clienți"],
              ["framework", "Model mental sau metodologie", "Modelul AIDA aplicat la SaaS"],
              ["strategy", "Plan de acțiune", "Plan go-to-market"],
              ["formula", "Pattern sau rețetă repetabilă", "Formula de pricing pentru info-produse"],
              ["pattern", "Comportament recurent identificat", "Pattern de churn în luna 3"],
              ["avatar", "Profil de utilizator sau audiență", "Persona antreprenor solo"],
              ["argument_map", "Structură logică de idei", "Analiză pro/contra"],
              ["narrative", "Poveste sau studiu de caz", "Narativul fondatorului"],
              ["psychological", "Insight comportamental sau cognitiv", "Aversiunea la pierdere în pricing"],
              ["commercial", "Model de business sau revenue", "Arhitectura de subscription tiers"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Clasificarea Serviciilor</h3>
          <Table
            headers={["Clasă", "Tip", "Cost", "Exemple"]}
            rows={[
              ["A", "Analiză & Extracție", "50-100 credite", "Insight Extractor, Framework Detector, Quote Extractor"],
              ["B", "Producție & Generare", "100-200 credite", "Course Generator, Strategy Builder, Prompt Generator"],
              ["C", "Orchestrare Complexă", "200-500 credite", "Market Research, Argument Mapper, Content Classifier"],
            ]}
          />
        </Section>

        {/* ─── 5. RELATIONS & GRAPH ─── */}
        <Section icon={Layers} title="5. Relations & Knowledge Graph">
          <p>Neuronii formează un graf direcționat prin linkuri tipizate. Fiecare link are un tip de relație semantică ce permite traversarea cunoașterii, detectarea contradicțiilor și urmărirea dependențelor.</p>

          <CodeBlock title="Link Schema">{`neuron_links
├── id: uuid (PK)
├── source_neuron_id: bigint → neurons(id)
├── target_neuron_id: bigint → neurons(id)
├── relation_type: text — 'supports','contradicts','extends',
│                         'references','derived_from','parent','child'
└── created_at: timestamptz`}</CodeBlock>

          <p><strong>NAS (Neuron Addressing System):</strong> Coordonate semantice care separă identitatea de locație.</p>
          <CodeBlock title="Addressing">{`neuron_addresses
├── neuron_id → neurons(id)
├── domain: text — 'marketing', 'psychology', etc.
├── level_1..level_4: text — segmente ierarhice
├── path: text — '/marketing/virality/identity-signals'
├── depth: integer

neuron_address_aliases
├── alias: text — 'viral-marketing'
├── target_path: text — '/marketing/virality'`}</CodeBlock>
        </Section>

        {/* ─── 6. VERSIONING ─── */}
        <Section icon={GitBranch} title="6. Git-like Versioning System">
          <p>Fiecare versiune stochează un snapshot complet al blocurilor cu diff opțional de la părinte. Suportă branching, restaurare și urmărirea evoluției cunoașterii.</p>

          <CodeBlock title="Version Schema">{`neuron_versions
├── id: uuid (PK)
├── neuron_id: bigint → neurons(id)
├── version: integer (secvențial per neuron)
├── parent_version_id: uuid → neuron_versions(id) [nullable]
├── title: text (titlul snapshot-ului)
├── change_summary: text
├── blocks_snapshot: jsonb (stare completă)
├── diff: jsonb (delta de la părinte)
├── author_id: uuid
├── created_at: timestamptz`}</CodeBlock>

          <Table
            headers={["Operație", "Descriere"]}
            rows={[
              ["Snapshot", "Capturează starea curentă a blocurilor ca versiune nouă"],
              ["Restore", "Revertă neuronul la orice versiune anterioară"],
              ["Diff", "Compară două versiuni pentru a vedea schimbările"],
              ["Branch", "Fork versiune într-un lanț nou pentru editare paralelă"],
            ]}
          />
        </Section>

        {/* ─── 7. EXECUTION MODEL & SERVICES ─── */}
        <Section icon={Zap} title="7. Execution Model & AI Services">
          <p>Blocurile pot fi executate în funcție de modul lor de execuție. Serviciile sunt pipeline-uri AI deterministe cu costuri fixe și output auditabil.</p>

          <Table
            headers={["Mod", "Comportament", "Cazuri de utilizare"]}
            rows={[
              ["passive", "Fără execuție, doar conținut", "Text, headings, quotes"],
              ["validated", "Verificare schemă/sintaxă la modificare", "JSON, dataset, diagram"],
              ["executable", "Rulare la cerere (buton play)", "Cod, pipeline-uri YAML, prompts"],
              ["automated", "Auto-run pe trigger/schedule", "AI actions, workflows"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Servicii Implementate (10)</h3>
          <Table
            headers={["Service Key", "Nume", "Clasă", "Credite"]}
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

          <p>Monitorizare în timp real via Supabase Realtime — pagina Jobs se actualizează automat la schimbarea statusului oricărui job.</p>
        </Section>

        {/* ─── 8. CREDIT ECONOMY ─── */}
        <Section icon={Coins} title="8. Credit Economy (NEURONS)">
          <Callout>
            <strong>Dual-Token Model:</strong> NOTA2 (on-chain, acces & staking) + NEURONS (off-chain, credite de computație pentru servicii AI)
          </Callout>

          <p>Sistemul de credite implementează un model de economie internă cu rezervare atomică, auditare și release on failure.</p>

          <CodeBlock title="Credit Schema">{`user_credits
├── user_id: uuid (unique)
├── balance: integer (default 500 — credite inițiale gratuite)
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
   └─ Trigger notification → 'Job finalizat ✓'
8. On FAILURE:
   └─ RELEASE credits (restore balance)
   └─ Log transaction (type: 'release')
   └─ Mark job 'failed'
   └─ Trigger notification → 'Job eșuat ✗'`}</CodeBlock>

          <h3 className="text-base font-serif mt-6 text-foreground">Economie</h3>
          <Table
            headers={["Metric", "Valoare"]}
            rows={[
              ["1000 credite", "10 USD"],
              ["1 credit", "0.01 USD"],
              ["Serviciu tipic", "50-200 credite (0.50-2.00 USD)"],
              ["Credite inițiale", "500 gratuite la înregistrare"],
              ["Alertă low-balance", "Notificare automată sub 50 credite"],
            ]}
          />
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

          <p><strong>Podcast Intelligence:</strong> Sistemul extrage din podcasturi: identificarea segmentelor cheie, extragerea citatelor directe, generarea de rezumate și clasificarea conținutului. Episoadele suportă tipuri: <code className="text-xs bg-muted px-1 rounded">text, audio, video, url</code>.</p>

          <Table
            headers={["Etapă", "Component", "Output"]}
            rows={[
              ["1. Upload", "Pagina Extractor", "Înregistrare episod (status: uploaded)"],
              ["2. Transcribe", "Manual/AI (planificat)", "Text transcript (status: transcribed)"],
              ["3. Extract", "extract-neurons Edge Function", "3-8 neuroni cu blocuri (status: analyzed)"],
              ["4. Structure", "Neuron Editor", "Blocuri rafinate, categorii, adrese"],
              ["5. Service", "run-service Edge Function", "Livrabile AI salvate ca blocuri"],
              ["6. Capitalize", "Export/Publish", "Cursuri, strategii, produse"],
            ]}
          />
        </Section>

        {/* ─── 10. NOTIFICATION SYSTEM ─── */}
        <Section icon={Bell} title="10. Notification System">
          <Callout>
            <strong>Real-time, multi-canal:</strong> Notificări in-app cu Supabase Realtime + Desktop Notifications API + preferințe granulare per utilizator.
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

          <h3 className="text-base font-serif mt-6 text-foreground">Triggere Automate (PostgreSQL)</h3>
          <Table
            headers={["Trigger", "Tabelă", "Condiție", "Notificare"]}
            rows={[
              ["notify_job_status", "neuron_jobs", "Status → completed/failed", "Job finalizat ✓ / Job eșuat ✗"],
              ["notify_credits_low", "user_credits", "Balance < 50", "Credite scăzute ⚠"],
              ["notify_version_created", "neuron_versions", "INSERT", "Versiune nouă salvată"],
              ["notify_feedback_submitted", "feedback", "INSERT", "Feedback nou → toți adminii"],
              ["notify_feedback_responded", "feedback", "admin_response UPDATE", "Răspuns la feedback-ul tău"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Preferințe Notificări</h3>
          <CodeBlock title="Notification Preferences">{`notification_preferences
├── user_id: uuid (unique)
├── push_enabled: boolean — Desktop Notifications API permission
├── push_jobs: boolean — Alertă la finalizare/eșec job
├── push_credits: boolean — Alertă credite scăzute
├── push_feedback: boolean — Alertă răspuns feedback
├── push_versions: boolean — Alertă versiune nouă
├── email_digest: enum('none','daily','weekly')
├── email_jobs / email_credits / email_feedback: boolean
├── quiet_hours_start / quiet_hours_end: smallint (0-23)

Auto-created via handle_new_user() trigger on auth.users INSERT.`}</CodeBlock>

          <h3 className="text-base font-serif mt-6 text-foreground">Canale de Livrare</h3>
          <Table
            headers={["Canal", "Implementare", "Status"]}
            rows={[
              ["In-app (bell icon)", "Supabase Realtime subscription pe notifications table", "✅ Activ"],
              ["Desktop (browser)", "Notification API — apare chiar dacă tab-ul nu e focusat", "✅ Activ"],
              ["Email digest", "Preferință stocată, sender planificat", "🔜 Planificat"],
              ["Web Push (offline)", "push_subscriptions table + VAPID keys", "🔜 Planificat"],
            ]}
          />

          <p>Componenta <code className="text-xs bg-muted px-1 rounded">NotificationBell</code> din header afișează badge cu numărul de unread notifications, dropdown cu preview, și link la pagina <code className="text-xs bg-muted px-1 rounded">/notifications</code> cu filtrare pe tip și acțiuni batch (mark all read, clear all).</p>
        </Section>

        {/* ─── 11. FEEDBACK & TESTIMONIALS ─── */}
        <Section icon={MessageCircle} title="11. Feedback & Testimonials System">
          <p>Sistem complet de colectare feedback, testimoniale, recenzii, propuneri și plângeri — cu workflow de moderare admin, publicare pe Landing Page, și feedback contextual automat.</p>

          <CodeBlock title="Feedback Schema">{`feedback
├── id: uuid (PK)
├── user_id: uuid → auth.users(id)
├── type: enum('feedback','testimonial','review','proposal','complaint')
├── title: text
├── message: text (max 2000 caractere)
├── rating: smallint (1-5, nullable — obligatoriu pt review/testimonial)
├── status: enum('pending','reviewed','resolved','published')
├── is_public: boolean (default false — controlat de admin)
├── context_page: text (pagina de pe care s-a trimis)
├── admin_response: text (nullable)
├── admin_responded_at: timestamptz
├── created_at / updated_at: timestamptz`}</CodeBlock>

          <h3 className="text-base font-serif mt-6 text-foreground">Puncte de Colectare</h3>
          <Table
            headers={["Punct", "Component", "Comportament"]}
            rows={[
              ["FAB global", "FeedbackFAB (buton floating)", "Disponibil pe orice pagină autentificată"],
              ["Pagina /feedback", "Formular inline integrat", "Deschis automat, colapsabil, cu istoric complet"],
              ["Post-job completion", "ContextualFeedbackPrompt", "Apare automat după finalizarea unui job (session-based)"],
              ["Landing Page", "PublicTestimonials", "Afișează feedback-uri marcate ca publice de admin"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Workflow Admin</h3>
          <CodeBlock title="Admin Feedback Flow">{`Feedback primit → Notificare automată toți adminii
                → Admin Dashboard tab "Feedback"
                → Statistici: Total, Pending, Plângeri, Rating mediu
                → Filtrare: tip, status
                → Acțiuni: schimbare status, răspuns (→ notificare user), 
                           publicare/ascundere, export CSV
                → Export CSV: UTF-8 BOM, toate coloanele, descărcare directă`}</CodeBlock>
        </Section>

        {/* ─── 12. USER PROFILES & PUBLIC PAGES ─── */}
        <Section icon={UserCircle} title="12. User Profiles & Public Pages">
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
            headers={["Pagină", "Rută", "Funcție"]}
            rows={[
              ["Profil privat", "/profile", "Editare display name, username, bio, avatar + preferințe notificări"],
              ["Profil public", "/u/:username", "Pagină publică cu neuroni publici ai utilizatorului"],
              ["Links page", "/links", "Director de resurse externe cu social proof"],
            ]}
          />

          <p>Profilul privat include secțiuni de setări pentru notificări: toggle-uri per tip de alertă, selectare frecvență email digest, configurare quiet hours.</p>
        </Section>

        {/* ─── 13. ADMIN DASHBOARD ─── */}
        <Section icon={BarChart3} title="13. Admin Dashboard">
          <Callout>
            <strong>Acces restricționat:</strong> Ruta /admin protejată de AdminRoute — verifică rolul 'admin' via funcția has_role() SECURITY DEFINER. Rolurile sunt stocate în tabel separat user_roles (nu pe profil!).
          </Callout>

          <Table
            headers={["Tab", "Funcții"]}
            rows={[
              ["Overview", "KPI-uri globale: utilizatori totali, neuroni, jobs, credite în circulație, rate succes"],
              ["Utilizatori", "Lista utilizatorilor, management roluri (admin/moderator/user), ajustare credite"],
              ["Neuroni", "Control vizibilitate, statistici per categorie"],
              ["Jobs", "Monitorizare execuții, rate eșec, durată medie"],
              ["Servicii", "Activare/dezactivare servicii din catalog, editare costuri"],
              ["Feedback", "Statistici (total, pending, plângeri, rating mediu), filtrare, răspuns, publicare, export CSV"],
            ]}
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
        <Section icon={Shield} title="14. Rules & Operating Principles">
          <Callout>
            <strong>Core Principles:</strong> Services First · Job-centric Architecture · Invisible Library · Deterministic Execution · Real-time Feedback
          </Callout>

          <Table
            headers={["Principiu", "Descriere"]}
            rows={[
              ["Services First", "Fiecare interacțiune AI este un serviciu definit cu cost, input schema și deliverables — nu chat liber"],
              ["Job-centric Architecture", "Toată munca e urmărită ca job-uri auditabile: pending → running → completed/failed"],
              ["Deterministic Execution", "Same input + same service = structură de output predictibilă. Fără randomness în pipeline"],
              ["Credit Firewall", "Nicio execuție fără credite suficiente. Rezervare înainte de execuție, release on failure"],
              ["Invisible Library", "Knowledge graph-ul e implicit — neuronii sunt conectați dar nu expuși ca bibliotecă tradițională"],
              ["Audit Trail", "Fiecare mișcare de credite e logată: reserve, spend, release, denied. Ledger complet de tranzacții"],
              ["RLS Everywhere", "Row-Level Security pe toate tabelele. Utilizatorii văd doar datele lor. Adminii au politici separate"],
              ["Lifecycle Progression", "Neuronii evoluează: ingested → structured → active → capitalized → compounded"],
              ["Block Composability", "Orice tip de bloc poate fi adăugat la orice neuron. Tipuri noi înregistrate dinamic"],
              ["Version Immutability", "Versiunile sunt snapshot-uri append-only. Istoria nu poate fi alterată"],
              ["Real-time Awareness", "Notificări instant pentru job-uri, credite, feedback — prin Supabase Realtime + Desktop Notifications"],
              ["Feedback Loop", "Feedback contextual automat după job-uri, colecție multiplă (FAB, inline, post-completion)"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Security Model</h3>
          <Table
            headers={["Layer", "Implementare"]}
            rows={[
              ["Autentificare", "Supabase Auth cu email/parolă, verificare email, persistența sesiunii"],
              ["Autorizare", "RLS policies per tabel; has_role() SECURITY DEFINER function"],
              ["Roluri", "Tabel separat user_roles (admin, moderator, user) — NICIODATĂ pe profil"],
              ["Edge Functions", "Service role key pentru operații server-side; CORS headers"],
              ["Credit Protection", "Verificare server-side a balanței și deducere atomică înainte de execuția AI"],
              ["Notification RLS", "Utilizatorii pot citi/modifica/șterge doar notificările proprii. INSERT doar din trigger-e server-side"],
              ["Feedback RLS", "Utilizatorii citesc propriul feedback + cele publice. Adminii citesc tot și pot actualiza"],
            ]}
          />
        </Section>

        {/* ─── 15. CLONING & TEMPLATES ─── */}
        <Section icon={Copy} title="15. Cloning & Template System">
          <p>Template-urile sunt structuri de neuroni pre-configurate. Clonarea creează o copie deep cu urmărire a originii.</p>

          <CodeBlock title="Template & Clone Schema">{`neuron_templates
├── id: uuid (PK)
├── name: text
├── description: text
├── category: text — 'research', 'analysis', 'report', etc.
├── blocks_template: jsonb — array de definiții de blocuri
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
            headers={["Operație", "Descriere"]}
            rows={[
              ["Create from Template", "Instanțiază neuron nou cu structură pre-definită de blocuri"],
              ["Clone Neuron", "Copie deep a tuturor blocurilor + metadate, cu urmărire lineage"],
              ["Fork Neuron", "Clone + creare link (derived_from) la sursă"],
              ["Save as Template", "Extrage structura neuronului curent ca template reutilizabil"],
            ]}
          />
        </Section>

        {/* ─── 16. PAGES & UI ─── */}
        <Section icon={BookOpen} title="16. Application Pages & Flow">
          <h3 className="text-base font-serif mt-2 text-foreground">Rute Publice</h3>
          <Table
            headers={["Rută", "Pagină", "Funcție"]}
            rows={[
              ["/", "Landing Page", "Marketing, pipeline vizual, testimoniale publice, CTA"],
              ["/auth", "Autentificare", "Login/signup cu verificare email"],
              ["/reset-password", "Reset Parolă", "Flux de resetare parolă"],
              ["/architecture", "Documentație", "Această pagină de arhitectură"],
              ["/links", "Links", "Director resurse externe, social proof, stats live"],
              ["/u/:username", "Profil Public", "Pagină publică cu neuronii publici ai utilizatorului"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Rute Protejate (autentificare necesară)</h3>
          <Table
            headers={["Rută", "Pagină", "Funcție"]}
            rows={[
              ["/home", "Cockpit", "Dashboard principal: stats, acțiuni rapide, neuroni/jobs recenți, pipeline hint"],
              ["/neurons", "Lista Neuroni", "Navigare, căutare, filtrare neuroni"],
              ["/n/new", "Editor Neuron", "Creare neuron nou (3-panel layout)"],
              ["/n/:number", "Editor Neuron", "Editare neuron existent cu preview, AI tools, versioning"],
              ["/extractor", "Extractor", "Ingestie episoade, management transcripții, extracție AI"],
              ["/services", "Catalog Servicii", "Navigare servicii AI pe clase (A/B/C)"],
              ["/run/:serviceKey", "Run Service", "Execuție serviciu cu inputs, SSE streaming, credit tracking"],
              ["/jobs", "Jobs", "Istoric execuții cu status, durată, rezultate expandabile, realtime"],
              ["/credits", "Credits", "Balanță, ledger tranzacții, consum per serviciu, top-up"],
              ["/intelligence", "Intelligence", "Statistici agregate: neuroni, episoade, categorii, activitate"],
              ["/prompt-forge", "Prompt Forge", "Generator și tester de prompts"],
              ["/profile-extractor", "Profile Extractor", "Extracție profil din conținut"],
              ["/profile", "Profil & Setări", "Editare profil + preferințe notificări + quiet hours"],
              ["/notifications", "Notificări", "Pagină dedicată: filtrare tip, mark all read, clear all"],
              ["/feedback", "Feedback", "Formular inline integrat + istoric feedback propriu"],
              ["/dashboard", "Dashboard", "Overview analitic"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Rute Admin</h3>
          <Table
            headers={["Rută", "Pagină", "Funcție"]}
            rows={[
              ["/admin", "Admin Dashboard", "Overview, Utilizatori, Neuroni, Jobs, Servicii, Feedback — tabs"],
            ]}
          />

          <h3 className="text-base font-serif mt-6 text-foreground">Navigație Globală (SiteHeader)</h3>
          <p>Pipeline-ul cognitiv al utilizatorului reflectat în navigație:</p>
          <CodeBlock title="Navigation Flow">{`Home (Cockpit) → Extractor (Ingestie) → Neuroni (Gestiune)
→ Servicii (Execuție) → Jobs (Monitorizare) → Credits (Balanță)

Header includes:
  - Badge balanță NEURONS (real-time via DB subscription)
  - NotificationBell (unread count, dropdown preview)
  - Link Feedback
  - ThemeToggle (light/dark)`}</CodeBlock>

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

        {/* ─── 17. SCALABILITY ─── */}
        <Section icon={Search} title="17. Scalability & Indexing (100K+)">
          <Table
            headers={["Strategie", "Implementare", "Beneficiu"]}
            rows={[
              ["GIN FTS Index", "to_tsvector pe title + content", "Full-text search sub 100ms"],
              ["Composite Indexes", "author+status, neuron+position", "Query-uri filtrate rapide"],
              ["Materialized Views", "neuron_stats view per author", "Dashboard loads < 50ms"],
              ["Range Partitioning", "neuron_number_ranges table", "Scrieri paralele AI fără coliziune"],
              ["Connection Pooling", "PgBouncer built-in", "1000+ utilizatori concurenți"],
              ["Edge Caching", "CDN pentru neuroni publici", "Citiri globale <200ms"],
              ["Realtime Channels", "Supabase channels per user/table", "Notificări instant fără polling"],
            ]}
          />
        </Section>

        {/* ─── 18. API ─── */}
        <Section icon={Server} title="18. Edge Functions & API">
          <p>Logica backend rulează ca Edge Functions pe Lovable Cloud. Toate endpoint-urile folosesc CORS headers și autentificare service role.</p>

          <Table
            headers={["Function", "Purpose", "Auth"]}
            rows={[
              ["neuron-api", "CRUD pentru neuroni, blocuri, linkuri, versiuni, căutare", "JWT"],
              ["run-service", "Job runner: credit reserve → AI execute → audit → save", "Anon key"],
              ["extract-neurons", "Episode transcript → AI extraction → 3-8 neuroni", "Anon key"],
              ["neuron-chat", "Chat AI contextual în editorul de neuroni", "JWT"],
              ["extract-insights", "Extracție insight-uri din blocuri (legacy)", "JWT"],
            ]}
          />

          <CodeBlock title="AI Gateway Integration">{`Endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
Auth: Bearer LOVABLE_API_KEY (auto-provisioned)
Models: google/gemini-3-flash-preview (default)
         google/gemini-2.5-flash (backup)
Mode: Streaming (SSE) or non-streaming
Rate limits: per-workspace, 429 on exceed, 402 on credits exhausted`}</CodeBlock>

          <h3 className="text-base font-serif mt-6 text-foreground">Secrets Configurate</h3>
          <Table
            headers={["Secret", "Scop"]}
            rows={[
              ["SUPABASE_URL", "URL-ul proiectului Supabase"],
              ["SUPABASE_ANON_KEY", "Cheie publică pentru client-side"],
              ["SUPABASE_SERVICE_ROLE_KEY", "Cheie server-side pentru Edge Functions"],
              ["SUPABASE_DB_URL", "Conexiune directă la PostgreSQL"],
              ["LOVABLE_API_KEY", "Acces la AI Gateway (auto-provisioned)"],
            ]}
          />
        </Section>

        {/* Footer */}
        <div className="border-t border-border pt-8 mt-16 text-center">
          <p className="text-xs text-muted-foreground">AI-IDEI · Knowledge Operating System v1.1</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Architecture Document — 18 secțiuni · {new Date().toLocaleDateString("ro-RO")}
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
