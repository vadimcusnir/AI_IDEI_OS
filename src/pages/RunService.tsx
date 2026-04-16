import { SEOHead } from "@/components/SEOHead";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRunService } from "@/hooks/useRunService";
import { RunServiceHeader } from "@/components/services/RunServiceHeader";
import { RunServicePipeline } from "@/components/services/RunServicePipeline";
import { RunServiceResults } from "@/components/services/RunServiceResults";
import { ContentSourcePicker } from "@/components/services/ContentSourcePicker";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { ROICalculator } from "@/components/credits/ROICalculator";
import { PremiumPaywall } from "@/components/premium/PremiumPaywall";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play, AlertCircle, Coins, Lock, Shield,
  FileText, CheckCircle2, Crown, Zap,
} from "lucide-react";

export default function RunService() {
  const rs = useRunService();
  const { service, loading, authLoading, t, navigate } = rs;

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) return null;

  const PIPELINE_STEPS = [
    { label: t("run_service.step_creating"), key: "creating" },
    { label: t("run_service.step_reserving"), key: "reserving" },
    { label: t("run_service.step_running"), key: "running" },
    { label: t("run_service.step_auditing"), key: "auditing" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <SEOHead title={`${service.name} — AI-IDEI`} description={service.description || "Run AI-powered knowledge service."} />
      <ServiceJsonLd service={service} />
      <BreadcrumbJsonLd items={[
        { name: "Services", url: "https://ai-idei.com/services" },
        { name: service.name, url: `https://ai-idei.com/services/${service.service_key}` },
      ]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RunServiceHeader
          service={service}
          deliverables={rs.deliverables}
          onBack={() => navigate("/services")}
          t={t}
        />

        {/* Input form */}
        <AnimatePresence mode="wait">
          {rs.canRun && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: 0.1 }}
            >
              {/* Content Source Picker */}
              <div className="mb-6">
                <ContentSourcePicker
                  selectedId={rs.selectedSourceId}
                  onSelect={(content, source) => {
                    rs.setSelectedSourceId(source.id);
                    if (rs.inputFields.length > 0) {
                      const firstTextarea = rs.inputFields.find((f: any) => f.type === "textarea");
                      const targetField = firstTextarea || rs.inputFields[0];
                      const key = targetField.name || "field_0";
                      rs.setInputs(prev => ({ ...prev, [key]: content }));
                    } else {
                      rs.setInputs({ context: content });
                    }
                  }}
                />
              </div>

              {/* Input fields */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> {t("run_service.define_context")}
                </h2>
                <div className="space-y-3">
                  {rs.inputFields.length > 0 ? rs.inputFields.map((field: any, i: number) => (
                    <div key={i} className="group">
                      <label className="text-dense font-semibold text-muted-foreground mb-1.5 block">
                        {field.label || field.name || `Field ${i + 1}`}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={rs.inputs[field.name || `field_${i}`] || ""}
                          onChange={e => rs.setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                          placeholder={field.placeholder || ""}
                          rows={4}
                          className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                      ) : (
                        <input
                          value={rs.inputs[field.name || `field_${i}`] || ""}
                          onChange={e => rs.setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                          placeholder={field.placeholder || ""}
                          className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      )}
                      {field.description && (
                        <p className="text-micro text-muted-foreground/60 mt-1.5 pl-1">{field.description}</p>
                      )}
                    </div>
                  )) : (
                    <textarea
                      value={rs.inputs.context || ""}
                      onChange={e => rs.setInputs({ context: e.target.value })}
                      placeholder={t("run_service.context_placeholder")}
                      rows={5}
                      className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Deliverables preview */}
              {rs.deliverables.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> {t("run_service.deliverables_title")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rs.deliverables.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-validated shrink-0" />
                        <span className="text-xs">{d.name || d.label || d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost + Access panel */}
              <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                    <Coins className="h-3 w-3" /> {t("run_service.cost_preview")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.service_cost")}</p>
                      <p className="text-2xl font-bold font-mono">{service.credits_cost}</p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.your_balance")}</p>
                      <p className="text-2xl font-bold font-mono">{rs.creditBalance}</p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.after_run")}</p>
                      <p className={cn("text-2xl font-bold font-mono", rs.hasEnoughCredits ? "text-status-validated" : "text-destructive")}>
                        {rs.creditBalance - service.credits_cost}
                      </p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                  </div>
                </div>

                {rs.accessVerdict?.verdict === "PAYWALL" && (
                  <div className="p-4 bg-destructive/5 border-t border-destructive/10">
                    <InlineTopUp needed={service.credits_cost} balance={rs.creditBalance} compact />
                  </div>
                )}
                {rs.accessVerdict?.verdict === "ALLOW" && (
                  <div className="flex items-center gap-3 p-4 bg-status-validated/5 border-t border-status-validated/10">
                    <Shield className="h-5 w-5 text-status-validated shrink-0" />
                    <p className="text-xs text-status-validated font-medium">{t("run_service.access_verified")}</p>
                  </div>
                )}
              </div>

              {/* ROI Calculator */}
              {rs.deliverables.length > 0 && (
                <div className="mb-6">
                  <ROICalculator creditsCost={service.credits_cost} deliverablesCount={rs.deliverables.length} serviceName={service.name} />
                </div>
              )}

              {/* Tier gate */}
              {!rs.hasTierAccess && (
                <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("run_service.subscription_required")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("run_service.subscription_desc", { tier: service.access_tier === "vip" ? "VIP" : "Pro" })}
                    </p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 shrink-0" onClick={() => rs.setPaywallOpen(true)}>
                    <Zap className="h-3 w-3" /> {t("run_service.upgrade")}
                  </Button>
                </div>
              )}

              {/* Run button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={rs.hasTierAccess ? rs.handleRun : () => rs.setPaywallOpen(true)}
                  disabled={rs.hasTierAccess && (!rs.hasEnoughCredits || rs.accessVerdict?.verdict === "DENY")}
                  className={cn(
                    "gap-2 h-12 text-sm font-semibold rounded-xl shadow-lg transition-shadow",
                    rs.hasTierAccess ? "shadow-primary/20 hover:shadow-primary/30" : "shadow-amber-500/20"
                  )}
                  variant={rs.hasTierAccess ? "default" : "secondary"}
                  size="lg"
                >
                  {rs.hasTierAccess
                    ? (rs.hasEnoughCredits ? <Play className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />)
                    : <Lock className="h-4 w-4" />}
                  {rs.hasTierAccess
                    ? (rs.hasEnoughCredits
                        ? t("run_service.run_button", { cost: service.credits_cost })
                        : "NEURONS Insuficienți")
                    : t("run_service.unlock_pro")}
                </Button>
                {rs.hasTierAccess && !rs.hasEnoughCredits && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span>
                      Ai nevoie de <span className="font-mono font-bold">{service.credits_cost}</span> NEURONS.
                      Sold actual: <span className="font-mono font-bold">{rs.creditBalance}</span>.
                    </span>
                    <Button variant="destructive" size="sm" className="h-6 text-micro ml-auto shrink-0" onClick={() => navigate("/credits")}>
                      Cumpără NEURONS
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <RunServicePipeline jobStatus={rs.jobStatus} steps={PIPELINE_STEPS} t={t} />

        <RunServiceResults
          jobStatus={rs.jobStatus}
          jobResult={rs.jobResult}
          service={service}
          creditBalance={rs.creditBalance}
          inputs={rs.inputs}
          onReset={rs.resetJob}
          onNavigate={navigate}
          t={t}
        />
      </div>

      <PremiumPaywall
        open={rs.paywallOpen}
        onOpenChange={rs.setPaywallOpen}
        requiredTier={service.access_tier}
        serviceName={service.name}
      />
    </div>
  );
}
