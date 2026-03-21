import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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

// ── Lazy-loaded pages ──
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Home = lazy(() => import("./pages/Home"));
const NeuronEditor = lazy(() => import("./pages/NeuronEditor"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Links = lazy(() => import("./pages/Links"));
const Extractor = lazy(() => import("./pages/Extractor"));
const Services = lazy(() => import("./pages/Services"));
const Jobs = lazy(() => import("./pages/Jobs"));
const RunService = lazy(() => import("./pages/RunService"));
const Credits = lazy(() => import("./pages/Credits"));
const Intelligence = lazy(() => import("./pages/Intelligence"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PromptForge = lazy(() => import("./pages/PromptForge"));
const ProfileExtractor = lazy(() => import("./pages/ProfileExtractor"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Index = lazy(() => import("./pages/Index"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Library = lazy(() => import("./pages/Library"));
const ArtifactDetail = lazy(() => import("./pages/ArtifactDetail"));
const GuestPages = lazy(() => import("./pages/GuestPages"));
const GuestProfile = lazy(() => import("./pages/GuestProfile"));
const BatchRunner = lazy(() => import("./pages/BatchRunner"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Docs = lazy(() => import("./pages/Docs"));
const EntityListing = lazy(() => import("./pages/EntityListing"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const TopicListing = lazy(() => import("./pages/TopicListing"));
const TopicDetail = lazy(() => import("./pages/TopicDetail"));
const MediaProfiles = lazy(() => import("./pages/MediaProfiles"));
const PipelineOverview = lazy(() => import("./pages/PipelineOverview"));
const TopicDiscovery = lazy(() => import("./pages/TopicDiscovery"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceDetail = lazy(() => import("./pages/MarketplaceDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataPrivacy = lazy(() => import("./pages/DataPrivacy"));
const PublicUserProfile = lazy(() => import("./pages/PublicUserProfile"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const WorkspaceSettings = lazy(() => import("./pages/WorkspaceSettings"));
const Community = lazy(() => import("./pages/Community"));
const CommunityThread = lazy(() => import("./pages/CommunityThread"));
const KnowledgeDashboard = lazy(() => import("./pages/KnowledgeDashboard"));
const VIPDashboard = lazy(() => import("./pages/VIPDashboard"));
const DataPipeline = lazy(() => import("./pages/DataPipeline"));
const RuntimeDashboard = lazy(() => import("./pages/RuntimeDashboard"));
const SecurityDocs = lazy(() => import("./pages/SecurityDocs"));
const DatabaseRelations = lazy(() => import("./pages/DatabaseRelations"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const GamificationPage = lazy(() => import("./pages/GamificationPage"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const Transcribe = lazy(() => import("./pages/Transcribe"));

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
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
              <ScrollToTop />
              <Routes>
                {/* Public routes — accessible without login */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/links" element={<AppLayout><Links /></AppLayout>} />
                <Route path="/architecture" element={<AppLayout><Architecture /></AppLayout>} />
                <Route path="/u/:username" element={<PublicUserProfile />} />
                <Route path="/guest/:slug" element={<GuestProfile />} />

                {/* Public knowledge infrastructure — with global layout */}
                <Route path="/docs" element={<AppLayout><Docs /></AppLayout>} />
                <Route path="/docs/:section/:topic" element={<AppLayout><Docs /></AppLayout>} />
                <Route path="/changelog" element={<AppLayout><Changelog /></AppLayout>} />
                <Route path="/insights" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/insights/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/patterns" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/patterns/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/formulas" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/formulas/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/contradictions" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/contradictions/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/applications" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/applications/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/profiles" element={<AppLayout><EntityListing /></AppLayout>} />
                <Route path="/profiles/:slug" element={<AppLayout><EntityDetail /></AppLayout>} />
                <Route path="/topics" element={<AppLayout><TopicListing /></AppLayout>} />
                <Route path="/topics/discovery" element={<AppLayout><TopicDiscovery /></AppLayout>} />
                <Route path="/topics/:slug" element={<AppLayout><TopicDetail /></AppLayout>} />
                <Route path="/marketplace" element={<AppLayout><Marketplace /></AppLayout>} />
                <Route path="/marketplace/:id" element={<AppLayout><MarketplaceDetail /></AppLayout>} />
                <Route path="/media/profiles" element={<AppLayout><MediaProfiles /></AppLayout>} />
                <Route path="/pipeline" element={<AppLayout><PipelineOverview /></AppLayout>} />
                <Route path="/terms" element={<AppLayout><TermsOfService /></AppLayout>} />
                <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
                <Route path="/community" element={<AppLayout><Community /></AppLayout>} />
                <Route path="/community/:category" element={<AppLayout><Community /></AppLayout>} />
                <Route path="/community/:category/thread/:threadId" element={<AppLayout><CommunityThread /></AppLayout>} />

                {/* Protected routes — require authentication */}
                <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
                <Route path="/neurons" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Neurons failed to load"><Index /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/n/new" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/n/:number" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/extractor" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Extractor failed to load"><Extractor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute><AppLayout><Services /></AppLayout></ProtectedRoute>} />
                <Route path="/run/:serviceKey" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Service runner failed"><RunService /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute><AppLayout><Jobs /></AppLayout></ProtectedRoute>} />
                <Route path="/batch/:neuronId" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Batch runner failed"><BatchRunner /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><AppLayout><Credits /></AppLayout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><AppLayout><Library /></AppLayout></ProtectedRoute>} />
                <Route path="/library/:id" element={<ProtectedRoute><AppLayout><ArtifactDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/intelligence" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Intelligence failed to load"><Intelligence /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/prompt-forge" element={<ProtectedRoute><AppLayout><PromptForge /></AppLayout></ProtectedRoute>} />
                <Route path="/profile-extractor" element={<ProtectedRoute><AppLayout><ProfileExtractor /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><AppLayout><Feedback /></AppLayout></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute><AppLayout><GuestPages /></AppLayout></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><AppLayout fullHeight><ChatPage /></AppLayout></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><AppLayout><Onboarding /></AppLayout></ProtectedRoute>} />
                <Route path="/data-privacy" element={<ProtectedRoute><AppLayout><DataPrivacy /></AppLayout></ProtectedRoute>} />
                <Route path="/api" element={<ProtectedRoute><AppLayout><ApiDocs /></AppLayout></ProtectedRoute>} />
                <Route path="/workspace" element={<ProtectedRoute><AppLayout><WorkspaceSettings /></AppLayout></ProtectedRoute>} />
                <Route path="/knowledge" element={<ProtectedRoute><AppLayout><KnowledgeDashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/kb/:category" element={<ProtectedRoute><AppLayout><KnowledgeDashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/vip" element={<ProtectedRoute><AppLayout><VIPDashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><AppLayout><WalletPage /></AppLayout></ProtectedRoute>} />
                <Route path="/gamification" element={<ProtectedRoute><AppLayout><GamificationPage /></AppLayout></ProtectedRoute>} />
                <Route path="/data-pipeline" element={<ProtectedRoute><AppLayout><DataPipeline /></AppLayout></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/runtime" element={<AdminRoute><AppLayout><RuntimeDashboard /></AppLayout></AdminRoute>} />
                <Route path="/analytics" element={<AdminRoute><AppLayout><AnalyticsDashboard /></AppLayout></AdminRoute>} />
                <Route path="/security" element={<AdminRoute><AppLayout><SecurityDocs /></AppLayout></AdminRoute>} />
                <Route path="/db-schema" element={<AdminRoute><AppLayout><DatabaseRelations /></AppLayout></AdminRoute>} />
                <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
