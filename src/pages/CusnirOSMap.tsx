/**
 * CusnirOSMap — Interactive system map for the Cusnir_OS ecosystem.
 * Accessible only after 11 consecutive months of subscription.
 * Pan + Zoom canvas with 7 layers, 30+ nodes, 35+ connections.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useCusnirOS } from "@/hooks/useCusnirOS";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { useRef, useEffect, useCallback, useState } from "react";

// ─── DATA ───────────────────────────────────────────────

const CW = 5000;
const CH = 4200;
const CX = CW / 2;
const CY = CH / 2;

type Layer = "core" | "cognitive" | "production" | "platform" | "economic" | "branding" | "channels";

interface MapNode {
  id: string;
  label: string;
  sublabel?: string;
  layer: Layer;
  layerName: string;
  x: number;
  y: number;
  desc: string;
  details: string[];
}

interface Connection {
  from: string;
  to: string;
  type: string;
  label?: string;
}

const nodes: MapNode[] = [
  // CORE
  { id: "cusnir_os", label: "CUSNIR OS", sublabel: "RAV.OS CORE v1.0", layer: "core", layerName: "NUCLEU CENTRAL", x: CX, y: CY, desc: "Sistemul de operare cognitiv central — nucleul din care emană toate subsistemele.", details: ["Cognitive Operating System complet autonom", "Gând → Pattern → Modul → YAML → SOP → Agent → OS", "Identitate persistentă + Memorie structurată", "Viziune finală: 10.000 agenți AI coordonați strategic", "Kernel: Custom Instructions v5 (vFinal)"] },
  { id: "identitate", label: "IDENTITATE", sublabel: "Meta-Patterns + Human Design", layer: "core", layerName: "NUCLEU CENTRAL", x: CX - 280, y: CY - 100, desc: "Stratul identitar — meta-patterns, Human Design (Manifestor 1/4), harta natală.", details: ["Profil 1/4 Manifestor — Inițiere / Autonomie", "3 Axe: Control × Structură × Limbaj", "Cod ontologic: 1 frază + 3 propoziții + 11 principii"] },
  { id: "cognitive_compiler", label: "COGNITIVE COMPILER", sublabel: "COC — Thought → OS", layer: "core", layerName: "NUCLEU CENTRAL", x: CX + 280, y: CY - 100, desc: "Compilatorul cognitiv — transformă pattern-uri de gândire în specificații executabile.", details: ["Thought → Pattern → Module → Spec → Agent → OS", "157+ SOP-uri YAML generate", "Pattern Registry + Clustering Engine", "Licensing gândirii ca sistem comercial"] },

  // COGNITIVE
  { id: "openclaw", label: "OPENCLAW", sublabel: "Runtime Cognitiv", layer: "cognitive", layerName: "STRAT 2 — SISTEME COGNITIVE", x: CX - 600, y: CY - 400, desc: "Runtime-ul de execuție cognitiv — orchestrează agenți, memorie, decizii.", details: ["Multi-agent orchestration engine", "Memory-bound execution", "Telegram Control Layer", "Fail-closed protocol"] },
  { id: "meta_cognitive", label: "META COGNITIVE ARCH", sublabel: "157 SOP-uri YAML", layer: "cognitive", layerName: "STRAT 2 — SISTEME COGNITIVE", x: CX - 200, y: CY - 480, desc: "Arhitectura meta-cognitivă — biblioteca completă de 157+ SOP-uri YAML.", details: ["11 faze de implementare", "8 tabele core non-negociabile", "Feedback Intelligence loop automat"] },
  { id: "idea_generator", label: "IDEA GENERATOR", sublabel: "Dreamer → Realist → Critic", layer: "cognitive", layerName: "STRAT 2 — SISTEME COGNITIVE", x: CX + 200, y: CY - 480, desc: "Motorul de generare idei — pipeline tripartit Walt Disney Strategy.", details: ["3 faze: Divergent → Convergent → Validare", "Scoring: acuratețe × utilitate × impact economic"] },
  { id: "custom_instructions", label: "CUSTOM INSTRUCTIONS", sublabel: "v1 → v5 Kernel Evolution", layer: "cognitive", layerName: "STRAT 2 — SISTEME COGNITIVE", x: CX + 600, y: CY - 400, desc: "Evoluția kernel-ului de instrucțiuni — de la v1 la v5 (vFinal).", details: ["v5 = kernel complet 10/10", "Anti-minciună: High/Medium admis, Low interzis", "Perspectivă 24-36 luni obligatorie"] },
  { id: "rav_os_core", label: "RAV.OS CORE", sublabel: "Agent YouTube Comments v1.0", layer: "cognitive", layerName: "STRAT 2 — SISTEME COGNITIVE", x: CX + 450, y: CY - 280, desc: "RAV — agentul care răspunde la comentarii YouTube în numele lui Vadim.", details: ["9 tipuri comentarii", "Risk scoring: psychological × reputational × legal", "Stil: persoana II, imperativ, max 4 fraze"] },

  // PRODUCTION
  { id: "agent_factory", label: "AGENT FACTORY", sublabel: "Producție Industrială Agenți", layer: "production", layerName: "STRAT 3 — SISTEME DE PRODUCȚIE", x: CX - 650, y: CY + 120, desc: "Sistemul de producție industrială pentru agenți AI.", details: ["Meta Input → Factory Pipeline → Agent complet", "12 stages de producție", "Scalare: 10 → 100 → 1000 → 10.000 agenți"] },
  { id: "agent_router", label: "AGENT ROUTER", sublabel: "Decision Engine Central", layer: "production", layerName: "STRAT 3 — SISTEME DE PRODUCȚIE", x: CX - 220, y: CY + 200, desc: "Creierul economic — selectează agentul optim pe baza intenției.", details: ["6 stages de decizie", "Multi-agent mode: sequential, parallel, committee", "Router-ul decide fluxul banilor"] },
  { id: "agent_product_spec", label: "AGENT PRODUCT SPEC", sublabel: "Standardizare Output", layer: "production", layerName: "STRAT 3 — SISTEME DE PRODUCȚIE", x: CX + 220, y: CY + 200, desc: "Specificația standard pentru fiecare agent-produs.", details: ["Input/Output contracts obligatorii", "Pricing per complexity tier", "Naming standard CUSNIR.*"] },
  { id: "podcast_extractor", label: "PODCAST INTELLIGENCE", sublabel: "Content → Assets", layer: "production", layerName: "STRAT 3 — SISTEME DE PRODUCȚIE", x: CX + 650, y: CY + 120, desc: "Pipeline de extracție inteligentă din podcast-uri.", details: ["YouTube → Transcription → Analysis", "Content Analysis Agent", "Social Media Agent: distribuție multi-canal"] },
  { id: "naming_standard", label: "NAMING STANDARD", sublabel: "CUSNIR.LAYER.DOMAIN.*", layer: "production", layerName: "STRAT 3 — SISTEME DE PRODUCȚIE", x: CX, y: CY + 100, desc: "Standardul de naming canonic.", details: ["6 Layers: OS, MEDIA, SALES, FUN, AUTO, GOV", "Lipsă segment → EXECUȚIE BLOCATĂ"] },

  // PLATFORMS
  { id: "ai_idei", label: "AI-IDEI", sublabel: "Knowledge Extraction OS — 65 Edge Fn", layer: "platform", layerName: "STRAT 4 — PLATFORME & PRODUSE", x: CX - 520, y: CY + 520, desc: "Platforma principală — Knowledge Extraction Operating System.", details: ["React 19 + TypeScript + Vite 8 + Tailwind", "135+ tabele + RLS strict", "65 Edge Functions", "NEURONS economy", "25+ AI Services + Knowledge Graph"] },
  { id: "vadim_blog", label: "VADIMCUSNIR.MD", sublabel: "Blog AI + Essay Generator", layer: "platform", layerName: "STRAT 4 — PLATFORME & PRODUSE", x: CX - 170, y: CY + 580, desc: "Blogul personal AI — eseuri și Essay Generator.", details: ["Essay system + Essay Generator", "SEO asset long-term", "Stil RFA (Retorică Fără Anestezie)"] },
  { id: "nota_doi", label: "NOTADOI.COM", sublabel: "Anti Scoala - Dezvoltare Personala", layer: "platform", layerName: "STRAT 4 - PLATFORME & PRODUSE", x: CX + 170, y: CY + 580, desc: "Platforma Nota Doi - Anti Scoala pentru dezvoltare personala.", details: ["Podcast Nota Doi cu invitati", "Codul mAInd - curs AI gratuit", "Pay What You Want model"] },
  { id: "in_omenire", label: "ÎN-OMENIRE", sublabel: "Serie 5 Volume — Q3 2026", layer: "platform", layerName: "STRAT 4 — PLATFORME & PRODUSE", x: CX + 520, y: CY + 520, desc: "Serie de 5 volume — lansare Q3 2026.", details: ["5 volume planificate", "EN digital → funnel global", "RO fizic → branding local"] },

  // ECONOMIC
  { id: "aer_sys_1", label: "AER SYS 1", sublabel: "YouTube → Live Weekly", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC (AER)", x: CX - 700, y: CY + 850, desc: "Sistemul de monetizare centrală — YouTube → Live Weekly System.", details: ["Live Weekly = nucleu economic recurent", "Tier 1: 15€ | Tier 2: 50€ | Tier 3: 100€+", "Quiz segmentare → Diagnostic → Offer Bridge"] },
  { id: "aer_sys_2", label: "AER SYS 2", sublabel: "Visual Identity — Rune System", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC (AER)", x: CX - 350, y: CY + 920, desc: "Sistemul de identitate vizuală economică — Rune System.", details: ["Rune System — semiotică proprietară", "Iconografie fractală", "Brand Kit Generator v1"] },
  { id: "aer_sys_3", label: "AER SYS 3", sublabel: "Execution Infrastructure", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC (AER)", x: CX, y: CY + 950, desc: "Infrastructura de execuție + motorul economic.", details: ["14 core events", "9 core agents", "Unit Economics: CAC, LTV, ARPU, churn"] },
  { id: "aer_sys_4", label: "AER SYS 4", sublabel: "Phase 0→1→2 Lansare", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC (AER)", x: CX + 350, y: CY + 920, desc: "Fazele de lansare.", details: ["Phase 0: validare, 50-100 abonamente", "Phase 1: optimizare, 200-500 membri", "Phase 2: AI OS, scalare internațional"] },
  { id: "aer_sys_5", label: "AER SYS 5", sublabel: "Content Pipeline (YT → Assets)", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC (AER)", x: CX + 700, y: CY + 850, desc: "Pipeline-ul de conținut — video → asset economic.", details: ["YouTube → Transcript → Insights → Assets", "Automat: zero intervenție manuală"] },
  { id: "content_pipeline", label: "CONTENT PIPELINE", sublabel: "Make + Supabase", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC", x: CX - 350, y: CY + 740, desc: "Pipeline-ul de procesare conținut.", details: ["Make scenarios automatizate", "Supabase storage + metadata", "Input agnostic: audio, video, text, PDF"] },
  { id: "aer_sys_6", label: "AER SYS 6", sublabel: "State Sync Layer", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC", x: CX, y: CY + 800, desc: "Stratul de sincronizare stări.", details: ["Sync între toate subsistemele economice", "Event-driven state management"] },
  { id: "neurons", label: "NEURONS", sublabel: "Sistem de Credite Interne", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC", x: CX + 350, y: CY + 740, desc: "Sistemul de credite interne NEURONS.", details: ["Onboarding: 500 NEURONS gratuite", "Tiers: Core 2000/mo, Pro 10000/mo, VIP 30000/mo"] },
  { id: "live_system", label: "LIVE WEEKLY SYSTEM", sublabel: "Nucleu Economic Recurent", layer: "economic", layerName: "STRAT 5 — SISTEM ECONOMIC", x: CX - 700, y: CY + 1060, desc: "Sistemul Live Weekly — 90-120 min săptămânal.", details: ["4 blocuri: Reality Decode, AI/Bani, Execution, Q&A", "Revenue share cu prezentatori"] },

  // BRANDING
  { id: "visual_style", label: "VISUAL STYLE LOCK v1.0", sublabel: "Decisional Brutalist Cinematic", layer: "branding", layerName: "STRAT 6 — BRANDING & COMUNICARE", x: CX - 750, y: CY - 150, desc: "Protocolul vizual v1.0 — Decisional Brutalist Cinematic.", details: ["Diagonal Split 30°-45°", "Palette: Black #0B0B0B, Gold, Red, White", "Tension·Contrast, Single Focal Point, Asymmetry·Energy"] },
  { id: "visual_style_2", label: "VISUAL STYLE LOCK v2.0", sublabel: "Cognitive Visual Protocol", layer: "branding", layerName: "STRAT 6 — BRANDING & COMUNICARE", x: CX - 750, y: CY + 10, desc: "Protocolul vizual v2.0 — Grid System, Geometry Engine.", details: ["Format 7:12, 70×120mm, vertical", "Geometry Engine: circle, triangle, line, spiral", "Determinism: HIGH, Scalability: GLOBAL"] },
  { id: "rfa", label: "RETORICĂ FĂRĂ ANESTEZIE", sublabel: "Stil de Scriere + Ton", layer: "branding", layerName: "STRAT 6 — BRANDING & COMUNICARE", x: CX + 750, y: CY - 150, desc: "Retorica Fără Anestezie — stilul de comunicare Cusnir.", details: ["Persoana II singular, imperativ", "Max 16-18 cuvinte / propoziție", "Fără emoji, fără promisiuni magice"] },
  { id: "brand_map", label: "HARTA BRAND CUSNIRIAN", sublabel: "12 Categorii × 78 Subcategorii", layer: "branding", layerName: "STRAT 6 — BRANDING & COMUNICARE", x: CX + 750, y: CY + 10, desc: "Arhitectura completă a brandului Cusnir.", details: ["12 Categorii, 78 subcategorii, 240+ elemente", "Self-updating brand memory cu embeddings"] },
  { id: "top_100", label: "TOP 100 CUVINTE", sublabel: "Lexicon Cusnirian", layer: "branding", layerName: "STRAT 6 — BRANDING & COMUNICARE", x: CX + 750, y: CY + 170, desc: "Lexiconul oficial — top 100 cuvinte Vadim.", details: ["Termeni: sistem, proces, decizie, risc, cadru", "Anti-termeni: incredibil, magical, super tare"] },

  // CHANNELS
  { id: "youtube", label: "YOUTUBE", sublabel: "7 Show-uri — 50K+", layer: "channels", layerName: "STRAT 7 — CANALE & DISTRIBUȚIE", x: CX - 450, y: CY - 750, desc: "Canalul principal YouTube — 7 show-uri, 3 clustere.", details: ["50.1K subscribers, 1007+ videos", "YouTube = infrastructură de captură, NU business"] },
  { id: "telegram", label: "TELEGRAM", sublabel: "OpenClaw Interface", layer: "channels", layerName: "STRAT 7 — CANALE & DISTRIBUȚIE", x: CX, y: CY - 780, desc: "Interfața Telegram — control layer pentru OpenClaw.", details: ["Daily Briefing automat", "Task Execution Pipeline"] },
  { id: "social_media_culise", label: "SOCIAL MEDIA ÎN CULISE", sublabel: "18.000+ Membri", layer: "channels", layerName: "STRAT 7 — CANALE & DISTRIBUȚIE", x: CX + 450, y: CY - 750, desc: "Comunitatea Social Media în Culise — 18.000+ membri.", details: ["Blog pe socialmediainculise.md", "Entry point pentru freelanceri SM"] },
  { id: "podcast_nota_doi", label: "PODCAST NOTA DOI", sublabel: "Anti Scoala", layer: "channels", layerName: "STRAT 7 - CANALE & DISTRIBUTIE", x: CX - 200, y: CY - 680, desc: "Podcastul Nota Doi - format de interviu.", details: ["Anti Scoala - intrebari care distrug conventii", "Lead generation - Codul mAInd"] },
  { id: "unu_noaptea", label: "UNU NOAPTEA", sublabel: "Canal YouTube Secundar", layer: "channels", layerName: "STRAT 7 — CANALE & DISTRIBUȚIE", x: CX + 200, y: CY - 680, desc: "Canal YouTube secundar — format experimental.", details: ["Conținut de noapte", "Branding alternativ"] },
];

const connections: Connection[] = [
  { from: "youtube", to: "content_pipeline", type: "flow", label: "Content Ingestion" },
  { from: "content_pipeline", to: "ai_idei", type: "flow", label: "Asset Processing" },
  { from: "ai_idei", to: "neurons", type: "flow", label: "Credit Economy" },
  { from: "identitate", to: "custom_instructions", type: "identity", label: "Identity → Kernel" },
  { from: "custom_instructions", to: "openclaw", type: "identity", label: "Kernel → Runtime" },
  { from: "openclaw", to: "rav_os_core", type: "identity", label: "Runtime → Output" },
  { from: "agent_factory", to: "agent_router", type: "production", label: "Produce → Route" },
  { from: "agent_router", to: "ai_idei", type: "production", label: "Route → Service" },
  { from: "ai_idei", to: "aer_sys_3", type: "economic", label: "Service → Revenue" },
  { from: "aer_sys_3", to: "live_system", type: "economic", label: "Engine → Live" },
  { from: "live_system", to: "aer_sys_1", type: "economic", label: "Live → Subscription" },
  { from: "aer_sys_1", to: "cusnir_os", type: "vision", label: "Upsell → OS" },
  { from: "cusnir_os", to: "agent_factory", type: "vision", label: "OS → 10.000 Agenți" },
  { from: "cusnir_os", to: "identitate", type: "identity" },
  { from: "cusnir_os", to: "cognitive_compiler", type: "identity" },
  { from: "cognitive_compiler", to: "meta_cognitive", type: "cognitive" },
  { from: "cognitive_compiler", to: "agent_factory", type: "production" },
  { from: "meta_cognitive", to: "openclaw", type: "cognitive" },
  { from: "idea_generator", to: "agent_factory", type: "production" },
  { from: "youtube", to: "aer_sys_1", type: "flow" },
  { from: "youtube", to: "aer_sys_5", type: "flow" },
  { from: "aer_sys_5", to: "ai_idei", type: "flow" },
  { from: "aer_sys_5", to: "content_pipeline", type: "flow" },
  { from: "visual_style", to: "visual_style_2", type: "branding" },
  { from: "visual_style", to: "aer_sys_2", type: "branding" },
  { from: "rfa", to: "custom_instructions", type: "branding" },
  { from: "brand_map", to: "cusnir_os", type: "branding" },
  { from: "social_media_culise", to: "aer_sys_1", type: "flow" },
  { from: "telegram", to: "openclaw", type: "cognitive" },
  { from: "nota_doi", to: "youtube", type: "flow" },
  { from: "podcast_nota_doi", to: "podcast_extractor", type: "production" },
  { from: "aer_sys_3", to: "aer_sys_6", type: "economic" },
  { from: "aer_sys_6", to: "ai_idei", type: "economic" },
  { from: "neurons", to: "aer_sys_3", type: "economic" },
  { from: "naming_standard", to: "agent_factory", type: "production" },
  { from: "aer_sys_4", to: "aer_sys_1", type: "economic" },
  { from: "in_omenire", to: "content_pipeline", type: "flow" },
  { from: "idea_generator", to: "ai_idei", type: "production" },
  { from: "meta_cognitive", to: "agent_factory", type: "cognitive" },
  { from: "agent_product_spec", to: "agent_router", type: "production" },
  { from: "podcast_extractor", to: "ai_idei", type: "production" },
  { from: "vadim_blog", to: "content_pipeline", type: "flow" },
];

const typeColors: Record<string, string> = {
  flow: "#44aaaa",
  identity: "#FFD700",
  cognitive: "#6666ff",
  production: "#FF4444",
  economic: "#C9A000",
  branding: "#cc66cc",
  vision: "#FFD700",
};

const layerColors: Record<Layer, string> = {
  core: "#FFD700",
  cognitive: "#4a4aff",
  production: "#CC2222",
  platform: "#00aa44",
  economic: "#C9A000",
  branding: "#aa44aa",
  channels: "#44aaaa",
};

const layerBgs: Record<Layer, string> = {
  core: "linear-gradient(135deg,#1a1500,#2a2000,#1a1500)",
  cognitive: "linear-gradient(135deg,#0a0a18,#12122a)",
  production: "linear-gradient(135deg,#180808,#2a1010)",
  platform: "linear-gradient(135deg,#081808,#102a10)",
  economic: "linear-gradient(135deg,#181508,#2a2210)",
  branding: "linear-gradient(135deg,#180818,#2a102a)",
  channels: "linear-gradient(135deg,#081818,#102a2a)",
};

// ─── NODE MAP ───────────────────────────────────────────
const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

// ─── COMPONENT ──────────────────────────────────────────

function SystemMapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Pan & zoom state
  const stateRef = useRef({ scale: 0.4, panX: 0, panY: 0, isDragging: false, startX: 0, startY: 0, panStartX: 0, panStartY: 0 });

  const updateTransform = useCallback(() => {
    const s = stateRef.current;
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${s.panX}px,${s.panY}px) scale(${s.scale})`;
    }
  }, []);

  const centerView = useCallback(() => {
    if (!containerRef.current) return;
    const s = stateRef.current;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    s.scale = Math.min(cw / CW, ch / CH) * 0.88;
    s.panX = (cw - CW * s.scale) / 2;
    s.panY = (ch - CH * s.scale) / 2;
    updateTransform();
  }, [updateTransform]);

  useEffect(() => {
    centerView();
    const handler = () => centerView();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [centerView]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newScale = Math.max(0.12, Math.min(3, s.scale * delta));
      s.panX = mx - (mx - s.panX) * (newScale / s.scale);
      s.panY = my - (my - s.panY) * (newScale / s.scale);
      s.scale = newScale;
      updateTransform();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [updateTransform]);

  // Mouse drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    const s = stateRef.current;
    s.isDragging = true;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.panStartX = s.panX;
    s.panStartY = s.panY;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      s.panX = s.panStartX + (e.clientX - s.startX);
      s.panY = s.panStartY + (e.clientY - s.startY);
      updateTransform();
    };
    const onUp = () => { stateRef.current.isDragging = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [updateTransform]);

  // Build connections as SVG paths
  const connPaths = connections.map((conn, i) => {
    const from = nodeMap[conn.from];
    const to = nodeMap[conn.to];
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const off = 60;
    const x1 = from.x + Math.cos(angle) * off;
    const y1 = from.y + Math.sin(angle) * off;
    const x2 = to.x - Math.cos(angle) * off;
    const y2 = to.y - Math.sin(angle) * off;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const curv = dist * 0.15;
    const cx1 = mx + Math.cos(angle + Math.PI / 2) * curv;
    const cy1 = my + Math.sin(angle + Math.PI / 2) * curv;
    const color = typeColors[conn.type] || "#555";
    const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to;
    return (
      <path
        key={i}
        d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
        stroke={color}
        fill="none"
        strokeWidth={isHighlighted ? 2.5 : 1.2}
        strokeDasharray="8 5"
        opacity={isHighlighted ? 0.85 : 0.25}
        style={{ transition: "opacity 0.3s, stroke-width 0.3s", filter: isHighlighted ? `drop-shadow(0 0 4px ${color})` : undefined }}
      />
    );
  });

  // Connected node IDs for dimming
  const connectedIds = new Set<string>();
  if (hoveredNode) {
    connections.forEach(c => {
      if (c.from === hoveredNode) connectedIds.add(c.to);
      if (c.to === hoveredNode) connectedIds.add(c.from);
    });
    connectedIds.add(hoveredNode);
  }

  const searchLower = search.toLowerCase().trim();

  return (
    <div className="relative w-full h-full" style={{ background: "radial-gradient(ellipse at center, #0f0f0f 0%, #0B0B0B 60%, #050505 100%)" }}>
      {/* Header overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 px-5 pt-4 pb-8 pointer-events-none" style={{ background: "linear-gradient(180deg,rgba(11,11,11,0.98) 0%,rgba(11,11,11,0.85) 60%,transparent 100%)" }}>
        <div className="pointer-events-auto flex items-center gap-3">
          <Link to="/cusnir-os" className="text-[hsl(var(--gold-oxide))] hover:text-[hsl(var(--gold-bright))] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-bold text-lg sm:text-xl tracking-[6px] uppercase" style={{ background: "linear-gradient(135deg, #C9A000 0%, #FFD700 40%, #FFF5CC 60%, #FFD700 80%, #C9A000 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CUSNIR OS — HARTA SISTEMULUI
            </h1>
            <p className="text-dense text-muted-foreground/50 italic tracking-wider mt-0.5 font-serif">
              Arhitectura cognitivă, economică și de branding — 7 Layers / 30+ Nodes / 35+ Connections
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="fixed top-20 left-5 z-50">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search node..."
          className="bg-[rgba(11,11,11,0.92)] border border-[rgba(201,160,0,0.2)] rounded-sm px-3 py-2 text-dense text-white font-mono w-[200px] outline-none focus:border-[#C9A000] focus:shadow-[0_0_12px_rgba(201,160,0,0.1)] placeholder:text-[#555] placeholder:italic"
        />
      </div>

      {/* Legend */}
      <div className="fixed bottom-5 left-5 z-50 bg-[rgba(11,11,11,0.94)] border border-[rgba(201,160,0,0.2)] rounded-sm p-3.5 text-dense max-w-[280px] backdrop-blur-xl">
        <div className="font-bold text-xs tracking-[3px] uppercase text-[#FFD700] mb-2">LEGENDĂ STRATURI</div>
        {([
          ["#FFD700", "NUCLEU — Cusnir OS"],
          ["#4a4aff", "STRAT 2 — Sisteme Cognitive"],
          ["#CC2222", "STRAT 3 — Sisteme de Producție"],
          ["#00aa44", "STRAT 4 — Platforme & Produse"],
          ["#C9A000", "STRAT 5 — Sistem Economic (AER)"],
          ["#aa44aa", "STRAT 6 — Branding & Comunicare"],
          ["#44aaaa", "STRAT 7 — Canale & Distribuție"],
        ] as const).map(([color, label]) => (
          <div key={label} className="flex items-center gap-2.5 my-1 text-muted-foreground">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span>{label}</span>
          </div>
        ))}
        <hr className="border-t border-white/5 my-2.5" />
        <div className="text-micro text-[#555] font-mono">CLICK → detalii · SCROLL → zoom · DRAG → pan</div>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-1">
        {[
          { label: "+", action: () => { const s = stateRef.current; const r = containerRef.current!.getBoundingClientRect(); const cx = r.width / 2; const cy = r.height / 2; const ns = Math.min(3, s.scale * 1.25); s.panX = cx - (cx - s.panX) * (ns / s.scale); s.panY = cy - (cy - s.panY) * (ns / s.scale); s.scale = ns; updateTransform(); } },
          { label: "−", action: () => { const s = stateRef.current; const r = containerRef.current!.getBoundingClientRect(); const cx = r.width / 2; const cy = r.height / 2; const ns = Math.max(0.12, s.scale * 0.75); s.panX = cx - (cx - s.panX) * (ns / s.scale); s.panY = cy - (cy - s.panY) * (ns / s.scale); s.scale = ns; updateTransform(); } },
          { label: "⌂", action: centerView },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="w-10 h-10 bg-[rgba(11,11,11,0.92)] border border-[rgba(201,160,0,0.25)] rounded-sm text-[#FFD700] text-lg flex items-center justify-center hover:border-[#C9A000] hover:bg-[rgba(201,160,0,0.08)] transition-all"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={onMouseDown}>
        <div ref={canvasRef} className="absolute origin-top-left will-change-transform" style={{ width: CW, height: CH }}>
          {/* SVG connections */}
          <svg ref={svgRef} className="absolute top-0 left-0 pointer-events-none z-[1]" width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`}>
            {connPaths}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const color = layerColors[node.layer];
            const bg = layerBgs[node.layer];
            const isCore = node.layer === "core";
            const matchSearch = !searchLower || node.label.toLowerCase().includes(searchLower) || (node.sublabel?.toLowerCase().includes(searchLower)) || node.desc.toLowerCase().includes(searchLower);
            const dimmed = hoveredNode ? !connectedIds.has(node.id) : !matchSearch;

            return (
              <div
                key={node.id}
                data-node={node.id}
                className="absolute cursor-pointer rounded-sm select-none z-10 transition-all duration-200"
                style={{
                  left: node.x,
                  top: node.y,
                  transform: "translate(-50%,-50%)",
                  opacity: dimmed ? 0.15 : 1,
                  zIndex: isCore ? 50 : hoveredNode === node.id ? 100 : 10,
                  pointerEvents: dimmed && searchLower ? "none" : "auto",
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
              >
                <div
                  className="px-4 py-3 rounded-sm relative overflow-hidden min-w-[100px]"
                  style={{
                    background: bg,
                    border: `${isCore ? 2 : 1}px solid ${color}80`,
                    boxShadow: isCore
                      ? `0 0 30px ${color}40, 0 0 60px ${color}14, inset 0 0 20px ${color}0d`
                      : `0 0 16px ${color}1f, inset 0 0 12px ${color}0a`,
                    animation: isCore ? "pulse 4s ease-in-out infinite" : undefined,
                  }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: isCore ? 0.8 : 0.5 }} />
                  <div className={`font-bold tracking-[2px] uppercase text-center whitespace-nowrap ${isCore ? "text-sm text-[#FFD700]" : "text-xs text-white"}`} style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)", letterSpacing: isCore ? "3px" : "2px" }}>
                    {node.label}
                  </div>
                  {node.sublabel && (
                    <div className="text-center text-nano text-white/50 font-mono mt-0.5 tracking-[0.5px]">{node.sublabel}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="fixed top-0 right-0 w-[420px] max-w-[92vw] h-screen z-[1500] bg-[rgba(11,11,11,0.98)] border-l-2 border-[#8B7500] overflow-y-auto backdrop-blur-2xl shadow-[-12px_0_60px_rgba(0,0,0,0.6)]" style={{ paddingTop: 70 }}>
          <button onClick={() => setSelectedNode(null)} className="absolute top-5 right-5 w-8 h-8 border border-[#2A2A2A] rounded-sm text-[#FFD700] flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-colors text-lg">✕</button>
          <div className="px-7 pb-7">
            <div className="text-micro font-mono tracking-[2px] uppercase text-[#8B7500] mb-1.5">{selectedNode.layerName}</div>
            <div className="font-bold text-2xl tracking-[4px] uppercase mb-3.5" style={{ background: "linear-gradient(135deg, #C9A000, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {selectedNode.label}
            </div>
            <div className="text-sm text-[#BBBBBB] italic border-l-2 border-[#8B7500] pl-3.5 mb-5 leading-[1.8] font-serif">
              {selectedNode.desc}
            </div>

            {selectedNode.details.length > 0 && (
              <>
                <div className="font-bold text-compact tracking-[2px] uppercase text-[#C9A000] my-5 pb-1.5 border-b border-[rgba(201,160,0,0.15)]">COMPONENTE & DETALII</div>
                <ul className="space-y-1">
                  {selectedNode.details.map((d, i) => (
                    <li key={i} className="text-xs text-[#BBBBBB] pl-4 relative leading-[1.5]">
                      <span className="absolute left-0 text-[#8B7500] text-micro">▸</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Related connections */}
            {(() => {
              const related = connections.filter(c => c.from === selectedNode.id || c.to === selectedNode.id);
              if (!related.length) return null;
              return (
                <>
                  <div className="font-bold text-compact tracking-[2px] uppercase text-[#C9A000] my-5 pb-1.5 border-b border-[rgba(201,160,0,0.15)]">CONEXIUNI ACTIVE</div>
                  <div className="space-y-1">
                    {related.map((c, i) => {
                      const other = c.from === selectedNode.id ? nodeMap[c.to] : nodeMap[c.from];
                      const dir = c.from === selectedNode.id ? "→" : "←";
                      if (!other) return null;
                      const color = typeColors[c.type] || "#555";
                      return (
                        <div
                          key={i}
                          className="text-dense text-[#AAAAAA] font-mono py-1.5 pl-2.5 border-l-2 border-[#2A2A2A] hover:border-[#C9A000] transition-colors cursor-pointer"
                          onClick={() => setSelectedNode(other)}
                        >
                          <span style={{ color }}>{dir}</span> {other.label} <span style={{ color }} className="text-nano">[{c.type.toUpperCase()}]</span>
                          {c.label && <span className="text-[#666]"> — {c.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Grain + Vignette overlays */}
      <div className="fixed inset-0 z-[999] pointer-events-none opacity-[0.035]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="fixed inset-0 z-[998] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────

export default function CusnirOSMap() {
  const { user, loading: authLoading } = useAuth();
  const { eligible, loading: cusnirLoading } = useCusnirOS();
  const navigate = useNavigate();
  const loading = authLoading || cusnirLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0B0B0B]">
        <Loader2 className="h-5 w-5 animate-spin text-[#C9A000]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 min-h-screen bg-[#0B0B0B]">
        <Lock className="h-8 w-8 text-[#C9A000]/30" />
        <p className="text-sm text-muted-foreground">Autentifică-te pentru a accesa Cusnir_OS.</p>
        <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-20 min-h-screen bg-[#0B0B0B]">
        <Lock className="h-10 w-10 text-[#C9A000]/20" />
        <div className="text-center max-w-md space-y-2">
          <p className="text-[#FFD700] font-bold tracking-[3px] uppercase text-sm">ACCES RESTRICȚIONAT</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Harta Sistemului este accesibilă exclusiv operatorilor Cusnir_OS cu 11 luni consecutive de activitate.
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-[#C9A000]/30 text-[#C9A000] hover:bg-[#C9A000]/10" onClick={() => navigate("/cusnir-os")}>
          Vezi Progresia
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Cusnir_OS — Harta Sistemului"
        description="Cognitive Command Map: 7 layers, 30+ nodes, 35+ connections. System-level architecture overview."
      />
      <div className="fixed inset-0 z-0">
        <SystemMapCanvas />
      </div>
    </>
  );
}
