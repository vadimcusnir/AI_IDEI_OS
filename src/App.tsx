import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { CookieConsent } from "@/components/global/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Loader2 } from "lucide-react";

/** Retry dynamic imports once on failure (handles stale chunk hashes after deploys) */
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      // Force a full page reload to pick up the new manifest
      window.location.reload();
      // Return a never-resolving promise so React doesn't render stale UI
      return new Promise(() => {});
    })
  );
}

// ── Lazy-loaded pages ──
const Landing = lazyRetry(() => import("./pages/Landing"));
const Auth = lazyRetry(() => import("./pages/Auth"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword"));
const Home = lazyRetry(() => import("./pages/Home"));
const NeuronEditor = lazyRetry(() => import("./pages/NeuronEditor"));
const ProfilePage = lazyRetry(() => import("./pages/ProfilePage"));
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"));
const Architecture = lazyRetry(() => import("./pages/Architecture"));
const Links = lazyRetry(() => import("./pages/Links"));
const Extractor = lazyRetry(() => import("./pages/Extractor"));
const Services = lazyRetry(() => import("./pages/Services"));
const Jobs = lazyRetry(() => import("./pages/Jobs"));
const RunService = lazyRetry(() => import("./pages/RunService"));
const Credits = lazyRetry(() => import("./pages/Credits"));
const Intelligence = lazyRetry(() => import("./pages/Intelligence"));
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const PublicProfile = lazyRetry(() => import("./pages/PublicProfile"));
const PromptForge = lazyRetry(() => import("./pages/PromptForge"));

const Notifications = lazyRetry(() => import("./pages/Notifications"));
const Feedback = lazyRetry(() => import("./pages/Feedback"));
const Index = lazyRetry(() => import("./pages/Index"));
const Changelog = lazyRetry(() => import("./pages/Changelog"));
const Library = lazyRetry(() => import("./pages/Library"));
const ArtifactDetail = lazyRetry(() => import("./pages/ArtifactDetail"));
const GuestPages = lazyRetry(() => import("./pages/GuestPages"));
const GuestProfile = lazyRetry(() => import("./pages/GuestProfile"));
const BatchRunner = lazyRetry(() => import("./pages/BatchRunner"));
const Onboarding = lazyRetry(() => import("./pages/Onboarding"));
const Docs = lazyRetry(() => import("./pages/Docs"));
const MediaProfiles = lazyRetry(() => import("./pages/MediaProfiles"));
const MediaProfilePublic = lazyRetry(() => import("./pages/MediaProfilePublic"));
const AdminMediaProfiles = lazyRetry(() => import("./pages/AdminMediaProfiles"));
const AdminAuditLog = lazyRetry(() => import("./pages/AdminAuditLog"));
const AdminKernel = lazyRetry(() => import("./pages/AdminKernel"));
const AdminDomination = lazyRetry(() => import("./pages/AdminDomination"));
const AdminInevitability = lazyRetry(() => import("./pages/AdminInevitability"));
const AdminFinancialization = lazyRetry(() => import("./pages/AdminFinancialization"));
const PipelineOverview = lazyRetry(() => import("./pages/PipelineOverview"));

const Marketplace = lazyRetry(() => import("./pages/Marketplace"));
const MarketplaceDetail = lazyRetry(() => import("./pages/MarketplaceDetail"));
const MarketplaceDrafts = lazyRetry(() => import("./pages/MarketplaceDrafts"));
const MarketplaceEarnings = lazyRetry(() => import("./pages/MarketplaceEarnings"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const PaymentResult = lazyRetry(() => import("./pages/PaymentResult"));
const TermsOfService = lazyRetry(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazyRetry(() => import("./pages/PrivacyPolicy"));
const DataPrivacy = lazyRetry(() => import("./pages/DataPrivacy"));
const PublicUserProfile = lazyRetry(() => import("./pages/PublicUserProfile"));

const ApiDocs = lazyRetry(() => import("./pages/ApiDocs"));
const WorkspaceSettings = lazyRetry(() => import("./pages/WorkspaceSettings"));
const Community = lazyRetry(() => import("./pages/Community"));
const CommunityThread = lazyRetry(() => import("./pages/CommunityThread"));

const VIPDashboard = lazyRetry(() => import("./pages/VIPDashboard"));
const DataPipeline = lazyRetry(() => import("./pages/DataPipeline"));
const RuntimeDashboard = lazyRetry(() => import("./pages/RuntimeDashboard"));
const CusnirOSOperator = lazyRetry(() => import("./pages/CusnirOSOperator"));
const CusnirOSPage = lazyRetry(() => import("./pages/CusnirOSPage"));
const SecurityDocs = lazyRetry(() => import("./pages/SecurityDocs"));
const DatabaseRelations = lazyRetry(() => import("./pages/DatabaseRelations"));
const WalletPage = lazyRetry(() => import("./pages/WalletPage"));
const SecuritySettings = lazyRetry(() => import("./pages/SecuritySettings"));
const GamificationPage = lazyRetry(() => import("./pages/GamificationPage"));
const AnalyticsDashboard = lazyRetry(() => import("./pages/AnalyticsDashboard"));

const Integrations = lazyRetry(() => import("./pages/Integrations"));
const CognitiveUnits = lazyRetry(() => import("./pages/CognitiveUnits"));
const CollectionRuns = lazyRetry(() => import("./pages/CollectionRuns"));
const Pricing = lazyRetry(() => import("./pages/Pricing"));

const ServiceResults = lazyRetry(() => import("./pages/ServiceResults"));
const ProductSurfacePage = lazyRetry(() => import("./pages/ProductSurfacePage"));
const NotebookWorkspace = lazyRetry(() => import("./pages/NotebookWorkspace"));
const NotebookDetail = lazyRetry(() => import("./pages/NotebookDetail"));
const CapitalizationEngine = lazyRetry(() => import("./pages/CapitalizationEngine"));
const HeadlineGenerator = lazyRetry(() => import("./pages/HeadlineGenerator"));
const ServicesCatalog = lazyRetry(() => import("./pages/ServicesCatalog"));
const JobDetail = lazyRetry(() => import("./pages/JobDetail"));
const MasterAgent = lazyRetry(() => import("./pages/MasterAgent"));

const PublicEntityPage = lazyRetry(() => import("./pages/PublicEntityPage"));
const PublicInsightPage = lazyRetry(() => import("./pages/PublicInsightPage"));
const PublicProfileEntityPage = lazyRetry(() => import("./pages/PublicProfileEntityPage"));
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,     // 2 min — lists stay fresh
      gcTime: 10 * 60 * 1000,       // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <MotionConfig reducedMotion="user">
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <ScrollToTop />
              <Routes>
                {/* Public routes — accessible without login */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/links" element={<AppLayout><ErrorBoundary fallbackTitle="Links failed to load"><Links /></ErrorBoundary></AppLayout>} />
                <Route path="/architecture" element={<AppLayout><ErrorBoundary fallbackTitle="Architecture failed to load"><Architecture /></ErrorBoundary></AppLayout>} />
                <Route path="/u/:username" element={<PublicUserProfile />} />
                <Route path="/guest/:slug" element={<GuestProfile />} />

                {/* Public knowledge infrastructure — with global layout */}
                <Route path="/docs" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
                <Route path="/docs/:section/:topic" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
                <Route path="/changelog" element={<AppLayout><ErrorBoundary fallbackTitle="Changelog failed to load"><Changelog /></ErrorBoundary></AppLayout>} />
                {/* ═══ Public SEO-indexable entity pages (lightweight, no Auth providers) ═══ */}
                <Route path="/knowledge/:slug" element={<PublicEntityPage />} />
                <Route path="/insights/:slug" element={<PublicInsightPage />} />
                <Route path="/profiles/:slug" element={<PublicProfileEntityPage />} />
                <Route path="/patterns/:slug" element={<PublicEntityPage />} />
                <Route path="/formulas/:slug" element={<PublicEntityPage />} />
                <Route path="/contradictions/:slug" element={<PublicEntityPage />} />
                <Route path="/applications/:slug" element={<PublicEntityPage />} />
                <Route path="/topics/:slug" element={<PublicEntityPage />} />
                {/* Index pages → library for authenticated users */}
                <Route path="/insights" element={<Navigate to="/library" replace />} />
                <Route path="/patterns" element={<Navigate to="/library" replace />} />
                <Route path="/formulas" element={<Navigate to="/library" replace />} />
                <Route path="/contradictions" element={<Navigate to="/library" replace />} />
                <Route path="/applications" element={<Navigate to="/library" replace />} />
                <Route path="/profiles" element={<Navigate to="/library" replace />} />
                <Route path="/topics" element={<Navigate to="/library" replace />} />
                <Route path="/topics/discovery" element={<Navigate to="/library" replace />} />
                <Route path="/marketplace" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace failed to load"><Marketplace /></ErrorBoundary></AppLayout>} />
                <Route path="/marketplace/drafts" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Drafts failed to load"><MarketplaceDrafts /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/marketplace/earnings" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Earnings failed to load"><MarketplaceEarnings /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/marketplace/:id" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace detail failed"><MarketplaceDetail /></ErrorBoundary></AppLayout>} />
                <Route path="/media/profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Media profiles failed to load"><MediaProfiles /></ErrorBoundary></AppLayout>} />
                <Route path="/media/profiles/:slug" element={<MediaProfilePublic />} />
                <Route path="/admin/media-profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Admin media failed"><AdminMediaProfiles /></ErrorBoundary></AppLayout>} />
                <Route path="/admin/audit-log" element={<AppLayout><AdminRoute><AdminAuditLog /></AdminRoute></AppLayout>} />
                <Route path="/pipeline" element={<AppLayout><ErrorBoundary fallbackTitle="Pipeline failed to load"><PipelineOverview /></ErrorBoundary></AppLayout>} />
                <Route path="/transcribe" element={<Navigate to="/extractor" replace />} />
                {/* /knowledge/:slug is handled above as public route */}
                <Route path="/products/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Product failed to load"><ProductSurfacePage /></ErrorBoundary></AppLayout>} />
                <Route path="/terms" element={<AppLayout><ErrorBoundary fallbackTitle="Terms failed to load"><TermsOfService /></ErrorBoundary></AppLayout>} />
                <Route path="/pricing" element={<AppLayout><ErrorBoundary fallbackTitle="Pricing failed to load"><Pricing /></ErrorBoundary></AppLayout>} />
                <Route path="/payment/result" element={<AppLayout><ErrorBoundary fallbackTitle="Payment failed to load"><PaymentResult /></ErrorBoundary></AppLayout>} />
                <Route path="/privacy" element={<AppLayout><ErrorBoundary fallbackTitle="Privacy failed to load"><PrivacyPolicy /></ErrorBoundary></AppLayout>} />
                <Route path="/community" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
                <Route path="/community/:category" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
                <Route path="/community/:category/thread/:threadId" element={<AppLayout><ErrorBoundary fallbackTitle="Thread failed to load"><CommunityThread /></ErrorBoundary></AppLayout>} />

                {/* Protected routes — require authentication */}
                <Route path="/home" element={<ProtectedRoute><AppLayout fullHeight><Home /></AppLayout></ProtectedRoute>} />
                <Route path="/neurons" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Neurons failed to load"><Index /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/n/new" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/n/:number" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                <Route path="/extractor" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Extractor failed to load"><Extractor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/services" element={<AppLayout><ErrorBoundary fallbackTitle="Services failed to load"><Services /></ErrorBoundary></AppLayout>} />
                <Route path="/run/:serviceKey" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Service runner failed"><RunService /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Jobs failed to load"><Jobs /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/jobs/:id" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Job detail failed"><JobDetail /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/batch/:neuronId" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Batch runner failed"><BatchRunner /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/service-results" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Results failed to load"><ServiceResults /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Credits failed to load"><Credits /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Library failed to load"><Library /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/library/:id" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Artifact failed to load"><ArtifactDetail /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/intelligence" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Intelligence failed to load"><Intelligence /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/prompt-forge" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Prompt Forge failed to load"><PromptForge /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/profile-extractor" element={<Navigate to="/extractor" replace />} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Profile failed to load"><ProfilePage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Notifications failed to load"><Notifications /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Feedback failed to load"><Feedback /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Guest pages failed to load"><GuestPages /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/chat" element={<Navigate to="/home" replace />} />
                <Route path="/onboarding" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Onboarding failed to load"><Onboarding /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/data-privacy" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Data privacy failed to load"><DataPrivacy /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/security-settings" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Security settings failed to load"><SecuritySettings /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/api" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="API docs failed to load"><ApiDocs /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/workspace" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Workspace failed to load"><WorkspaceSettings /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/kb/:category" element={<Navigate to="/library" replace />} />
                <Route path="/vip" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="VIP failed to load"><VIPDashboard /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/cusnir-os" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="CusnirOS failed to load"><CusnirOSPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Wallet failed to load"><WalletPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/gamification" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Gamification failed to load"><GamificationPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/data-pipeline" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Pipeline failed to load"><DataPipeline /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/integrations" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Integrations failed to load"><Integrations /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/cognitive-units" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Cognitive units failed to load"><CognitiveUnits /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/collection-runs" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Collection runs failed to load"><CollectionRuns /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/notebooks" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Notebooks failed to load"><NotebookWorkspace /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/notebook/:id" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Notebook failed to load"><NotebookDetail /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/capitalization" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Engine failed to load"><CapitalizationEngine /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/headline-generator" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Generator failed to load"><HeadlineGenerator /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/services-catalog" element={<AppLayout><ErrorBoundary fallbackTitle="Catalog failed to load"><ServicesCatalog /></ErrorBoundary></AppLayout>} />
                <Route path="/master-agent" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Master Agent failed"><MasterAgent /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                {/* Admin routes */}
                <Route path="/runtime" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Runtime failed to load"><RuntimeDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/cusnir-os/operator" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Operator failed to load"><CusnirOSOperator /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/analytics" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Analytics failed to load"><AnalyticsDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/security" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Security failed to load"><SecurityDocs /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/db-schema" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="DB Schema failed to load"><DatabaseRelations /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/admin" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Admin failed to load"><AdminDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/admin/kernel" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Kernel failed to load"><AdminKernel /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/admin/domination" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Domination failed to load"><AdminDomination /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/admin/inevitability" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Inevitability failed to load"><AdminInevitability /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/admin/financialization" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Financialization failed to load"><AdminFinancialization /></ErrorBoundary></AppLayout></AdminRoute>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
              </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </MotionConfig>
);

export default App;
