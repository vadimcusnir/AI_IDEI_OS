import { useEffect, useState, useCallback, lazy, Suspense, useMemo } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Brain, Briefcase, Coins, Activity, RefreshCw, ScrollText, MessageCircle, Network, BarChart3, AlertTriangle, Wallet, DollarSign, AlertCircle, TrendingUp, Loader2, ShieldAlert, Layers, Settings, Bot, FileText, Server, Gauge, ShieldCheck, Compass, Bell, HeartPulse } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSkeleton } from "@/components/skeletons/AdminSkeleton";
import { KPI } from "@/components/admin/AdminSubComponents";
import { PageTransition } from "@/components/motion/PageTransition";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ── Lazy-loaded admin tabs ──
const AdminOverviewTab = lazy(() => import("@/components/admin/AdminOverviewTab").then(m => ({ default: m.AdminOverviewTab })));
const AdminUserManagement = lazy(() => import("@/components/admin/AdminUserManagement").then(m => ({ default: m.AdminUserManagement })));
const AdminNeuronsTab = lazy(() => import("@/components/admin/AdminNeuronsTab").then(m => ({ default: m.AdminNeuronsTab })));
const AdminJobsTab = lazy(() => import("@/components/admin/AdminJobsTab").then(m => ({ default: m.AdminJobsTab })));
const AdminServicesTab = lazy(() => import("@/components/admin/AdminServicesTab").then(m => ({ default: m.AdminServicesTab })));
const AdminLogsTab = lazy(() => import("@/components/admin/AdminLogsTab").then(m => ({ default: m.AdminLogsTab })));
const AdminFeedbackTab = lazy(() => import("@/components/feedback/AdminFeedbackTab").then(m => ({ default: m.AdminFeedbackTab })));
const AdminChangelogTab = lazy(() => import("@/components/admin/AdminChangelogTab").then(m => ({ default: m.AdminChangelogTab })));
const AdminKnowledgeGraphTab = lazy(() => import("@/components/admin/AdminKnowledgeGraphTab").then(m => ({ default: m.AdminKnowledgeGraphTab })));
const AdminAnalyticsTab = lazy(() => import("@/components/admin/AdminAnalyticsTab").then(m => ({ default: m.AdminAnalyticsTab })));
const AccessSimulator = lazy(() => import("@/components/admin/AccessSimulator").then(m => ({ default: m.AccessSimulator })));
const DecisionLedgerTab = lazy(() => import("@/components/admin/DecisionLedgerTab").then(m => ({ default: m.DecisionLedgerTab })));
const AbuseDetectionTab = lazy(() => import("@/components/admin/AbuseDetectionTab").then(m => ({ default: m.AbuseDetectionTab })));
const WalletManagementTab = lazy(() => import("@/components/admin/WalletManagementTab").then(m => ({ default: m.WalletManagementTab })));
const ReconciliationTab = lazy(() => import("@/components/admin/ReconciliationTab").then(m => ({ default: m.ReconciliationTab })));
const IncidentManagementTab = lazy(() => import("@/components/admin/IncidentManagementTab").then(m => ({ default: m.IncidentManagementTab })));
const EntropyMonitoringTab = lazy(() => import("@/components/admin/EntropyMonitoringTab").then(m => ({ default: m.EntropyMonitoringTab })));
const AdminContributionsTab = lazy(() => import("@/components/admin/AdminContributionsTab").then(m => ({ default: m.AdminContributionsTab })));
const EmergencyControlsTab = lazy(() => import("@/components/admin/EmergencyControlsTab").then(m => ({ default: m.EmergencyControlsTab })));
const ComplianceLogTab = lazy(() => import("@/components/admin/ComplianceLogTab").then(m => ({ default: m.ComplianceLogTab })));
const FeatureFlagsTab = lazy(() => import("@/components/admin/FeatureFlagsTab").then(m => ({ default: m.FeatureFlagsTab })));
const ForumModerationTab = lazy(() => import("@/components/admin/ForumModerationTab").then(m => ({ default: m.ForumModerationTab })));
const ControlLayerTab = lazy(() => import("@/components/admin/ControlLayerTab").then(m => ({ default: m.ControlLayerTab })));
const ServiceManifestTab = lazy(() => import("@/components/admin/ServiceManifestTab").then(m => ({ default: m.ServiceManifestTab })));
const AdminAdvancedTab = lazy(() => import("@/components/admin/AdminAdvancedTab").then(m => ({ default: m.AdminAdvancedTab })));
const Root2PricingTab = lazy(() => import("@/components/admin/Root2PricingTab").then(m => ({ default: m.Root2PricingTab })));
const LLMIndexationTab = lazy(() => import("@/components/admin/LLMIndexationTab").then(m => ({ default: m.LLMIndexationTab })));
const AdminBlogTab = lazy(() => import("@/components/admin/AdminBlogTab").then(m => ({ default: m.AdminBlogTab })));
const AdminKernelTab = lazy(() => import("@/components/admin/AdminKernelTab").then(m => ({ default: m.AdminKernelTab })));
const AdminRuntimeTab = lazy(() => import("@/components/admin/AdminRuntimeTab").then(m => ({ default: m.AdminRuntimeTab })));
const AdminComplianceTab = lazy(() => import("@/components/admin/AdminComplianceTab").then(m => ({ default: m.AdminComplianceTab })));
const AdminCommandTab = lazy(() => import("@/components/admin/AdminCommandTab").then(m => ({ default: m.AdminCommandTab })));
const AdminAnalyticsExtendedTab = lazy(() => import("@/components/admin/AdminAnalyticsExtendedTab").then(m => ({ default: m.AdminAnalyticsExtendedTab })));
const ProviderHealthTab = lazy(() => import("@/components/admin/ProviderHealthTab").then(m => ({ default: m.ProviderHealthTab })));
const AlertCenterTab = lazy(() => import("@/components/admin/AlertCenterTab").then(m => ({ default: m.AlertCenterTab })));
const FinOpsTab = lazy(() => import("@/components/admin/FinOpsTab").then(m => ({ default: m.FinOpsTab })));

function TabLoader() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

interface PlatformStats {
  totalNeurons: number; publishedNeurons: number; draftNeurons: number;
  totalEpisodes: number; totalJobs: number; completedJobs: number; failedJobs: number;
  totalUsers: number; totalCreditsCirculating: number; totalCreditsSpent: number;
  activeServices: number;
}

// ── Tab groups ──
const TAB_GROUPS = [
  {
    group: "Core",
    icon: Activity,
    tabs: [
      { value: "overview", label: "Overview", icon: Activity },
      { value: "users", label: "Users", icon: Users },
      { value: "neurons", label: "Neurons", icon: Brain },
      { value: "jobs", label: "Jobs", icon: Briefcase },
      { value: "services", label: "Services", icon: Coins },
      { value: "logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    group: "Kernel",
    icon: Server,
    tabs: [
      { value: "kernel", label: "Contracts", icon: Server },
      { value: "runtime", label: "Runtime", icon: Gauge },
      { value: "command", label: "Command", icon: Compass },
    ],
  },
  {
    group: "Economy",
    icon: DollarSign,
    tabs: [
      { value: "wallets", label: "Wallets", icon: Wallet },
      { value: "reconciliation", label: "Reconciliation", icon: DollarSign },
      { value: "root2", label: "Pricing", icon: DollarSign },
    ],
  },
  {
    group: "FinOps",
    icon: HeartPulse,
    tabs: [
      { value: "provider-health", label: "Providers", icon: HeartPulse },
      { value: "alerts", label: "Alerts", icon: Bell },
      { value: "finops", label: "Costs & Unit Econ", icon: BarChart3 },
    ],
  },
  {
    group: "Content",
    icon: Brain,
    tabs: [
      { value: "feedback", label: "Feedback", icon: MessageCircle },
      { value: "changelog", label: "Changelog", icon: ScrollText },
      { value: "knowledge-graph", label: "Graph", icon: Network },
      { value: "analytics", label: "Analytics", icon: BarChart3 },
      { value: "analytics-ext", label: "Extended", icon: TrendingUp },
      { value: "contributions", label: "Contributions", icon: Brain },
      { value: "moderation", label: "Moderation", icon: MessageCircle },
      { value: "llm-index", label: "LLM Index", icon: Bot },
      { value: "blog", label: "Blog", icon: FileText },
    ],
  },
  {
    group: "Security",
    icon: Shield,
    tabs: [
      { value: "access-sim", label: "Access Sim", icon: Shield },
      { value: "ledger", label: "Ledger", icon: ScrollText },
      { value: "abuse", label: "Abuse", icon: AlertTriangle },
      { value: "compliance", label: "Compliance", icon: ScrollText },
      { value: "compliance-audit", label: "Audit", icon: ShieldCheck },
      { value: "incidents", label: "Incidents", icon: AlertCircle },
      { value: "emergency", label: "Emergency", icon: ShieldAlert },
    ],
  },
  {
    group: "System",
    icon: Settings,
    tabs: [
      { value: "entropy", label: "Entropy", icon: TrendingUp },
      { value: "flags", label: "Flags", icon: Activity },
      { value: "control-layer", label: "Control", icon: Layers },
      { value: "manifests", label: "Manifests", icon: Settings },
      { value: "advanced", label: "Advanced", icon: TrendingUp },
    ],
  },
];

// Flat lookup for finding which group a tab belongs to
const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

export default function AdminDashboard() {
  const { t } = useTranslation("pages");
  const { isAdmin, loading, user } = useAdminCheck();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Derive active group from active tab
  const activeGroup = useMemo(() => {
    return TAB_GROUPS.find(g => g.tabs.some(t => t.value === activeTab))?.group || "Core";
  }, [activeTab]);

  const activeGroupTabs = useMemo(() => {
    return TAB_GROUPS.find(g => g.group === activeGroup)?.tabs || [];
  }, [activeGroup]);

  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent).detail);
    window.addEventListener("admin-tab-change", handler);
    return () => window.removeEventListener("admin-tab-change", handler);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingData(true);
    const [neuronsAll, neuronsPub, neuronsDraft, episodes, jobsAll, jobsDone, jobsFailed, credits, servicesActive] = await Promise.all([
      supabase.from("neurons").select("id", { count: "exact", head: true }),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("episodes").select("id", { count: "exact", head: true }),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("user_credits").select("balance, total_spent"),
      supabase.from("service_catalog").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    const creditsData = credits.data || [];
    setStats({
      totalNeurons: neuronsAll.count ?? 0,
      publishedNeurons: neuronsPub.count ?? 0,
      draftNeurons: neuronsDraft.count ?? 0,
      totalEpisodes: episodes.count ?? 0,
      totalJobs: jobsAll.count ?? 0,
      completedJobs: jobsDone.count ?? 0,
      failedJobs: jobsFailed.count ?? 0,
      totalUsers: creditsData.length,
      totalCreditsCirculating: creditsData.reduce((s, c: any) => s + (c.balance || 0), 0),
      totalCreditsSpent: creditsData.reduce((s, c: any) => s + (c.total_spent || 0), 0),
      activeServices: servicesActive.count ?? 0,
    });
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    loadStats();
  }, [isAdmin, loading, user, loadStats]);

  if (loading || loadingData) return <AdminSkeleton />;
  if (!stats) return null;

  return (
    <PageTransition>
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Control Panel</h1>
                <p className="text-xs text-muted-foreground">{t("admin.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setActiveTab("emergency");
                }}
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Kill Switch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setActiveTab("alerts")}
              >
                <Bell className="h-3.5 w-3.5" /> Alerts
              </Button>
              <Button variant="outline" size="sm" onClick={loadStats} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <KPI label={t("admin.users")} value={stats.totalUsers} icon={Users} index={0} />
            <KPI label={t("admin.neurons")} value={stats.totalNeurons} icon={Brain} index={1} />
            <KPI label={t("admin.published")} value={stats.publishedNeurons} icon={Brain} color="text-primary" index={2} />
            <KPI label={t("admin.draft")} value={stats.draftNeurons} icon={Brain} index={3} />
            <KPI label={t("admin.episodes")} value={stats.totalEpisodes} icon={Activity} index={4} />
            <KPI label={t("admin.jobs")} value={stats.totalJobs} icon={Briefcase} index={5} />
            <KPI label={t("admin.credits_circulating")} value={stats.totalCreditsCirculating} icon={Coins} color="text-primary" index={6} />
            <KPI label={t("admin.credits_spent")} value={stats.totalCreditsSpent} icon={Coins} color="text-destructive" index={7} />
          </div>

          {/* Two-level navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Level 1: Group selector */}
            <div className="flex gap-1 mb-2 flex-wrap">
              {TAB_GROUPS.map(g => (
                <button
                  key={g.group}
                  onClick={() => setActiveTab(g.tabs[0].value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    activeGroup === g.group
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <g.icon className="h-3 w-3" />
                  {g.group}
                </button>
              ))}
            </div>

            {/* Level 2: Sub-tabs within group */}
            <ScrollArea className="w-full mb-4">
              <TabsList className="inline-flex w-max min-w-full h-auto flex-nowrap gap-0.5 p-1">
                {activeGroupTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1 shrink-0 whitespace-nowrap px-3 py-1.5">
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>

            {/* All tab content panels (hidden unless active) */}
            <TabsContent value="overview"><Suspense fallback={<TabLoader />}><AdminOverviewTab stats={stats} /></Suspense></TabsContent>
            <TabsContent value="users"><Suspense fallback={<TabLoader />}><AdminUserManagement /></Suspense></TabsContent>
            <TabsContent value="neurons"><Suspense fallback={<TabLoader />}><AdminNeuronsTab /></Suspense></TabsContent>
            <TabsContent value="jobs"><Suspense fallback={<TabLoader />}><AdminJobsTab /></Suspense></TabsContent>
            <TabsContent value="services"><Suspense fallback={<TabLoader />}><AdminServicesTab /></Suspense></TabsContent>
            <TabsContent value="logs"><Suspense fallback={<TabLoader />}><AdminLogsTab /></Suspense></TabsContent>
            <TabsContent value="feedback"><Suspense fallback={<TabLoader />}><AdminFeedbackTab /></Suspense></TabsContent>
            <TabsContent value="changelog"><Suspense fallback={<TabLoader />}><AdminChangelogTab /></Suspense></TabsContent>
            <TabsContent value="knowledge-graph"><Suspense fallback={<TabLoader />}><AdminKnowledgeGraphTab /></Suspense></TabsContent>
            <TabsContent value="analytics"><Suspense fallback={<TabLoader />}><AdminAnalyticsTab /></Suspense></TabsContent>
            <TabsContent value="access-sim"><Suspense fallback={<TabLoader />}><div className="bg-card border border-border rounded-xl p-5"><AccessSimulator /></div></Suspense></TabsContent>
            <TabsContent value="ledger"><Suspense fallback={<TabLoader />}><DecisionLedgerTab /></Suspense></TabsContent>
            <TabsContent value="abuse"><Suspense fallback={<TabLoader />}><AbuseDetectionTab /></Suspense></TabsContent>
            <TabsContent value="wallets"><Suspense fallback={<TabLoader />}><WalletManagementTab /></Suspense></TabsContent>
            <TabsContent value="reconciliation"><Suspense fallback={<TabLoader />}><ReconciliationTab /></Suspense></TabsContent>
            <TabsContent value="incidents"><Suspense fallback={<TabLoader />}><IncidentManagementTab /></Suspense></TabsContent>
            <TabsContent value="entropy"><Suspense fallback={<TabLoader />}><EntropyMonitoringTab /></Suspense></TabsContent>
            <TabsContent value="contributions"><Suspense fallback={<TabLoader />}><AdminContributionsTab /></Suspense></TabsContent>
            <TabsContent value="emergency"><Suspense fallback={<TabLoader />}><EmergencyControlsTab /></Suspense></TabsContent>
            <TabsContent value="compliance"><Suspense fallback={<TabLoader />}><ComplianceLogTab /></Suspense></TabsContent>
            <TabsContent value="flags"><Suspense fallback={<TabLoader />}><FeatureFlagsTab /></Suspense></TabsContent>
            <TabsContent value="moderation"><Suspense fallback={<TabLoader />}><ForumModerationTab /></Suspense></TabsContent>
            <TabsContent value="control-layer"><Suspense fallback={<TabLoader />}><ControlLayerTab /></Suspense></TabsContent>
            <TabsContent value="manifests"><Suspense fallback={<TabLoader />}><ServiceManifestTab /></Suspense></TabsContent>
            <TabsContent value="advanced"><Suspense fallback={<TabLoader />}><AdminAdvancedTab /></Suspense></TabsContent>
            <TabsContent value="root2"><Suspense fallback={<TabLoader />}><Root2PricingTab /></Suspense></TabsContent>
            <TabsContent value="llm-index"><Suspense fallback={<TabLoader />}><LLMIndexationTab /></Suspense></TabsContent>
            <TabsContent value="blog"><Suspense fallback={<TabLoader />}><AdminBlogTab /></Suspense></TabsContent>
            <TabsContent value="kernel"><Suspense fallback={<TabLoader />}><AdminKernelTab /></Suspense></TabsContent>
            <TabsContent value="runtime"><Suspense fallback={<TabLoader />}><AdminRuntimeTab /></Suspense></TabsContent>
            <TabsContent value="compliance-audit"><Suspense fallback={<TabLoader />}><AdminComplianceTab /></Suspense></TabsContent>
            <TabsContent value="command"><Suspense fallback={<TabLoader />}><AdminCommandTab /></Suspense></TabsContent>
            <TabsContent value="analytics-ext"><Suspense fallback={<TabLoader />}><AdminAnalyticsExtendedTab /></Suspense></TabsContent>
            <TabsContent value="provider-health"><Suspense fallback={<TabLoader />}><ProviderHealthTab /></Suspense></TabsContent>
            <TabsContent value="alerts"><Suspense fallback={<TabLoader />}><AlertCenterTab /></Suspense></TabsContent>
            <TabsContent value="finops"><Suspense fallback={<TabLoader />}><FinOpsTab /></Suspense></TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}