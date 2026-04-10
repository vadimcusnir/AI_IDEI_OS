/**
 * SecurityDocs — Admin security dashboard with live monitoring.
 * Static docs + real-time security events, login attempts, abuse tracking.
 */
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Lock, Key, AlertTriangle, CheckCircle2, Eye,
  Network, FileWarning, ShieldCheck, Bug, Layers, Server,
  Activity, Clock, Users, XCircle, Loader2,
} from "lucide-react";

// ── Static data ──

interface Finding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  status: "fixed" | "open" | "manual";
}

const FINDINGS: Finding[] = [
  { id: "SEC-001", severity: "high", category: "Auth", title: "Edge functions trust client-provided user_id", status: "fixed" },
  { id: "SEC-002", severity: "high", category: "Auth", title: "extract-neurons uses anon key instead of JWT", status: "fixed" },
  { id: "SEC-003", severity: "medium", category: "Auth", title: "chunk-transcript uses anon key for auth header", status: "fixed" },
  { id: "SEC-004", severity: "medium", category: "Config", title: "Leaked password protection disabled", status: "manual" },
  { id: "SEC-005", severity: "low", category: "RLS", title: "push_config table has no RLS policies", status: "fixed" },
  { id: "SEC-006", severity: "low", category: "CORS", title: "Edge functions use Access-Control-Allow-Origin: *", status: "fixed" },
  { id: "SEC-007", severity: "info", category: "Auth", title: "No rate limiting on auth endpoints", status: "fixed" },
  { id: "SEC-008", severity: "info", category: "Input", title: "Limited input validation on edge function payloads", status: "fixed" },
  { id: "SEC-009", severity: "low", category: "Headers", title: "Missing HSTS and CSP headers on edge functions", status: "fixed" },
  { id: "SEC-010", severity: "medium", category: "Data", title: "Push subscription keys readable by owning user", status: "fixed" },
];

const THREAT_MODEL = [
  { threat: "Token Replay", vector: "Stolen JWT reuse", mitigation: "Short TTL (1h), refresh rotation, secure cookie storage", icon: Key },
  { threat: "Privilege Escalation", vector: "Client-side role manipulation", mitigation: "Server-side has_role() SECURITY DEFINER, RLS on all tables", icon: Shield },
  { threat: "SQL Injection", vector: "Malicious input in RPC calls", mitigation: "Parameterized queries, Zod validation on edge functions", icon: Bug },
  { threat: "CORS Abuse", vector: "Cross-origin request forgery", mitigation: "Origin allowlist in _shared/cors.ts, no wildcard", icon: Network },
  { threat: "Data Exfiltration", vector: "Bulk data scraping via API", mitigation: "Rate limiting, API key daily limits, RLS row filtering", icon: Eye },
  { threat: "Abuse Farming", vector: "Automated credit/XP exploitation", mitigation: "Abuse detection triggers, daily XP caps, circuit breakers", icon: AlertTriangle },
];

const HARDENING = [
  { title: "Row-Level Security", description: "All 40+ tables have RLS enabled with authenticated-only policies", icon: Lock },
  { title: "JWT Auth on Edge Functions", description: "All edge functions derive user_id from JWT, never from request body", icon: Key },
  { title: "Append-Only Audit Logs", description: "Decision ledger and compliance log prevent UPDATE/DELETE via triggers", icon: FileWarning },
  { title: "SECURITY DEFINER Functions", description: "has_role(), check_access_safe(), has_admin_permission() bypass RLS safely", icon: ShieldCheck },
  { title: "Input Validation", description: "Zod schemas on all edge function payloads with strict types", icon: Layers },
  { title: "Emergency Controls", description: "5 emergency kill switches (maintenance, job freeze, registration lock, credit freeze, API lockdown)", icon: Server },
  { title: "Security Headers", description: "HSTS, CSP, X-Frame-Options, Permissions-Policy on all responses", icon: Shield },
  { title: "Safe Views", description: "webhook_endpoints_safe, user_integrations_safe, push_subscriptions_safe mask secrets", icon: Eye },
];

const SEV_COLORS: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<string, string> = {
  fixed: "text-status-validated",
  open: "text-destructive",
  manual: "text-primary",
};

// ── Live data hooks ──

function useSecurityEvents() {
  return useQuery({
    queryKey: ["security-events-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_events")
        .select("id, event_type, severity, ip_hint, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 30_000,
  });
}

function useLoginAttempts() {
  return useQuery({
    queryKey: ["login-attempts-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("login_attempts")
        .select("id, email, ip_hint, success, failure_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 30_000,
  });
}

function useAbuseEvents() {
  return useQuery({
    queryKey: ["abuse-events-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("abuse_events")
        .select("id, abuse_type, severity, action_taken, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 30_000,
  });
}

// ── Components ──

function LiveSecurityEvents() {
  const { data, isLoading } = useSecurityEvents();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState label="No security events recorded" />;

  return (
    <div className="space-y-1.5">
      {data.map(ev => (
        <div key={ev.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
          <Badge variant="outline" className={cn("text-nano px-1.5 py-0 h-4 shrink-0",
            ev.severity === "critical" || ev.severity === "high" ? SEV_COLORS.high :
            ev.severity === "medium" ? SEV_COLORS.medium : SEV_COLORS.low
          )}>
            {ev.severity?.toUpperCase() || "INFO"}
          </Badge>
          <span className="text-xs flex-1 min-w-0 truncate font-mono">{ev.event_type}</span>
          <span className="text-micro text-muted-foreground shrink-0">{ev.ip_hint || "—"}</span>
          <span className="text-micro text-muted-foreground shrink-0">{formatTime(ev.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

function LiveLoginAttempts() {
  const { data, isLoading } = useLoginAttempts();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState label="No login attempts recorded" />;

  const failedCount = data.filter(a => !a.success).length;
  const successCount = data.filter(a => a.success).length;

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <StatCard icon={CheckCircle2} label="Successful" value={successCount} color="text-status-validated" />
        <StatCard icon={XCircle} label="Failed" value={failedCount} color="text-destructive" />
        <StatCard icon={Users} label="Total" value={data.length} color="text-primary" />
      </div>
      <div className="space-y-1.5">
        {data.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
            {a.success
              ? <CheckCircle2 className="h-3.5 w-3.5 text-status-validated shrink-0" />
              : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            }
            <span className="text-xs flex-1 min-w-0 truncate font-mono">
              {a.email ? maskEmail(a.email) : "—"}
            </span>
            {!a.success && a.failure_reason && (
              <span className="text-micro text-destructive/70 truncate max-w-[150px]">{a.failure_reason}</span>
            )}
            <span className="text-micro text-muted-foreground shrink-0">{a.ip_hint || "—"}</span>
            <span className="text-micro text-muted-foreground shrink-0">{formatTime(a.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveAbuseEvents() {
  const { data, isLoading } = useAbuseEvents();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState label="No abuse events detected" />;

  return (
    <div className="space-y-1.5">
      {data.map(ev => (
        <div key={ev.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
          <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0",
            ev.severity === "critical" ? "text-destructive" :
            ev.severity === "high" ? "text-destructive/70" : "text-primary"
          )} />
          <span className="text-xs flex-1 min-w-0 truncate font-mono">{ev.abuse_type}</span>
          {ev.action_taken && (
            <Badge variant="outline" className="text-nano px-1.5 py-0 h-4 shrink-0">{ev.action_taken}</Badge>
          )}
          <span className="text-micro text-muted-foreground shrink-0">{formatTime(ev.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-micro text-muted-foreground">{label}</p>
    </div>
  );
}

function LoadingState() {
  return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ── Helpers ──

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "now";
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h`;
  return d.toLocaleDateString("ro-RO", { month: "short", day: "numeric" });
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}

// ── Main ──

export default function SecurityDocs() {
  const { t } = useTranslation("pages");
  const fixedCount = FINDINGS.filter(f => f.status === "fixed").length;
  const [tab, setTab] = useState("overview");

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title={`${t("security_docs.title")} — AI-IDEI`} description={t("security_docs.subtitle")} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("security_docs.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("security_docs.subtitle")}</p>
            </div>
            <Badge className="ml-auto text-micro bg-status-validated/10 text-status-validated border-0">
              {t("security_docs.fixed_count", { fixed: fixedCount, total: FINDINGS.length })}
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList className="h-9">
              <TabsTrigger value="overview" className="text-xs gap-1"><Shield className="h-3 w-3" /> Overview</TabsTrigger>
              <TabsTrigger value="events" className="text-xs gap-1"><Activity className="h-3 w-3" /> Events</TabsTrigger>
              <TabsTrigger value="logins" className="text-xs gap-1"><Users className="h-3 w-3" /> Logins</TabsTrigger>
              <TabsTrigger value="abuse" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Abuse</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              {/* Risk Matrix */}
              <section className="mb-8">
                <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> {t("security_docs.findings_title")}
                </h2>
                <div className="space-y-1.5">
                  {FINDINGS.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                      <Badge variant="outline" className={cn("text-nano px-1.5 py-0 h-4 shrink-0", SEV_COLORS[f.severity])}>
                        {f.severity.toUpperCase()}
                      </Badge>
                      <span className="text-micro font-mono text-muted-foreground w-16 shrink-0">{f.id}</span>
                      <span className="text-xs flex-1 min-w-0 truncate">{f.title}</span>
                      <Badge variant="outline" className="text-nano px-1.5 py-0 h-4 shrink-0">{f.category}</Badge>
                      <span className={cn("text-micro font-semibold shrink-0", STATUS_COLORS[f.status])}>
                        {f.status === "fixed" ? "✓ Fixed" : f.status === "manual" ? "⚙ Manual" : "⚠ Open"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Threat Model */}
              <section className="mb-8">
                <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Bug className="h-3 w-3" /> {t("security_docs.threat_model_title")}
                </h2>
                <div className="grid gap-3">
                  {THREAT_MODEL.map(tm => {
                    const Icon = tm.icon;
                    return (
                      <div key={tm.threat} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-xs font-semibold">{tm.threat}</p>
                        </div>
                        <div className="ml-9 space-y-1">
                          <p className="text-micro text-muted-foreground"><span className="font-medium text-foreground">{t("security_docs.vector")}:</span> {tm.vector}</p>
                          <p className="text-micro text-muted-foreground"><span className="font-medium text-foreground">{t("security_docs.mitigation")}:</span> {tm.mitigation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Hardening */}
              <section>
                <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> {t("security_docs.hardening_title")}
                </h2>
                <div className="grid gap-2">
                  {HARDENING.map(h => {
                    const Icon = h.icon;
                    return (
                      <div key={h.title} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
                        <div className="h-8 w-8 rounded-lg bg-status-validated/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-status-validated" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{h.title}</p>
                          <p className="text-micro text-muted-foreground">{h.description}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-status-validated/40 shrink-0 ml-auto" />
                      </div>
                    );
                  })}
                </div>
              </section>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4">
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Recent Security Events
              </h2>
              <LiveSecurityEvents />
            </TabsContent>

            {/* Logins Tab */}
            <TabsContent value="logins" className="mt-4">
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Login Attempts (Last 50)
              </h2>
              <LiveLoginAttempts />
            </TabsContent>

            {/* Abuse Tab */}
            <TabsContent value="abuse" className="mt-4">
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Abuse Detection
              </h2>
              <LiveAbuseEvents />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
