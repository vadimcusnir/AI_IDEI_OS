import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runSSOTAudit, type SSOTReport, type SSOTViolation } from "@/lib/ssotValidator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", badge: "secondary" as const },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", badge: "outline" as const },
};

const DOMAIN_LABELS: Record<string, string> = {
  product: "Product Doctrine",
  data_access: "Data / Access",
  economy: "Economy / Gating",
  service: "Service Taxonomy",
  presentation: "Presentation / i18n",
};

export function SSOTGuardianTab() {
  const [report, setReport] = useState<SSOTReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      // Fetch services for taxonomy validation
      const { data: services } = await supabase
        .from("services_level_3")
        .select("service_name, internal_credit_cost")
        .limit(500);

      const mappedServices = (services || []).map((s: any) => ({
        service_name: s.service_name,
        output_type: undefined,
        credit_cost: s.internal_credit_cost ?? undefined,
      }));

      // i18n key count estimation (from site_content)
      const { count: enCount } = await supabase.from("site_content").select("*", { count: "exact", head: true }).eq("locale", "en");
      const { count: roCount } = await supabase.from("site_content").select("*", { count: "exact", head: true }).eq("locale", "ro");
      const { count: ruCount } = await supabase.from("site_content").select("*", { count: "exact", head: true }).eq("locale", "ru");

      const result = runSSOTAudit({
        services: mappedServices,
        translationKeys: { en: enCount || 0, ro: roCount || 0, ru: ruCount || 0 },
      });

      setReport(result);
      toast.success(`Audit complet — Scor: ${result.score}%`);
    } catch (err) {
      toast.error("Audit failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAudit(); }, []);

  const scoreColor = !report ? "text-muted-foreground"
    : report.score >= 90 ? "text-emerald-500"
    : report.score >= 70 ? "text-yellow-500"
    : "text-destructive";

  const groupedViolations = report?.violations.reduce<Record<string, SSOTViolation[]>>((acc, v) => {
    (acc[v.domain] ??= []).push(v);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SSOT Guardian — Audit
            </div>
            <Button onClick={runAudit} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Re-audit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report && (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor}`}>{report.score}%</div>
                  <div className="text-xs text-muted-foreground">Conformitate</div>
                </div>
                <div className="flex-1 space-y-2">
                  <Progress value={report.score} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {report.passed} passed
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-destructive" /> {report.failed} violations
                    </span>
                  </div>
                </div>
              </div>

              {/* Domain status */}
              <div className="grid grid-cols-5 gap-2">
                {["product", "data_access", "economy", "service", "presentation"].map(domain => {
                  const count = groupedViolations[domain]?.length ?? 0;
                  const hasCritical = groupedViolations[domain]?.some(v => v.severity === "critical");
                  return (
                    <div key={domain} className="text-center p-2 rounded-lg border border-border/50 bg-muted/30">
                      {count === 0 ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : hasCritical ? (
                        <ShieldAlert className="h-5 w-5 text-destructive mx-auto" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                      )}
                      <div className="text-[10px] mt-1 text-muted-foreground leading-tight">{DOMAIN_LABELS[domain]}</div>
                      {count > 0 && <Badge variant="outline" className="mt-1 text-micro">{count}</Badge>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations by domain */}
      {Object.entries(groupedViolations).map(([domain, violations]) => (
        <Card key={domain}>
          <CardHeader>
            <CardTitle className="text-base">{DOMAIN_LABELS[domain]} — {violations.length} violation(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {violations.map((v, i) => {
              const cfg = SEVERITY_CONFIG[v.severity];
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{v.rule}</div>
                    <div className="text-xs text-muted-foreground">{v.details}</div>
                  </div>
                  <Badge variant={cfg.badge} className="text-micro shrink-0">{v.severity}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {report && report.violations.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
            <div>
              <div className="font-semibold">All SSOT checks passed</div>
              <div className="text-sm text-muted-foreground">Sistemul respectă toate cele 5 centre de autoritate</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
