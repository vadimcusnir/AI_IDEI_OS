import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const Home = lazyRetry(() => import("@/pages/Home"));
const NeuronEditor = lazyRetry(() => import("@/pages/NeuronEditor"));
const ProfilePage = lazyRetry(() => import("@/pages/ProfilePage"));
const Extractor = lazyRetry(() => import("@/pages/Extractor"));
const Jobs = lazyRetry(() => import("@/pages/Jobs"));
const RunService = lazyRetry(() => import("@/pages/RunService"));
const Credits = lazyRetry(() => import("@/pages/Credits"));
const Intelligence = lazyRetry(() => import("@/pages/Intelligence"));
const Index = lazyRetry(() => import("@/pages/Index"));
const Library = lazyRetry(() => import("@/pages/Library"));
const ArtifactDetail = lazyRetry(() => import("@/pages/ArtifactDetail"));
const GuestPages = lazyRetry(() => import("@/pages/GuestPages"));
const BatchRunner = lazyRetry(() => import("@/pages/BatchRunner"));
const Onboarding = lazyRetry(() => import("@/pages/Onboarding"));
const Notifications = lazyRetry(() => import("@/pages/Notifications"));
const Feedback = lazyRetry(() => import("@/pages/Feedback"));
const PromptForge = lazyRetry(() => import("@/pages/PromptForge"));
const DataPrivacy = lazyRetry(() => import("@/pages/DataPrivacy"));
const SecuritySettings = lazyRetry(() => import("@/pages/SecuritySettings"));
const ApiDocs = lazyRetry(() => import("@/pages/ApiDocs"));
const WorkspaceSettings = lazyRetry(() => import("@/pages/WorkspaceSettings"));
const VIPDashboard = lazyRetry(() => import("@/pages/VIPDashboard"));
const GamificationPage = lazyRetry(() => import("@/pages/GamificationPage"));
const Integrations = lazyRetry(() => import("@/pages/Integrations"));
const CognitiveUnits = lazyRetry(() => import("@/pages/CognitiveUnits"));
const CollectionRuns = lazyRetry(() => import("@/pages/CollectionRuns"));
const ServiceResults = lazyRetry(() => import("@/pages/ServiceResults"));
const JobDetail = lazyRetry(() => import("@/pages/JobDetail"));
const MasterAgent = lazyRetry(() => import("@/pages/MasterAgent"));
const AutomationTemplates = lazyRetry(() => import("@/pages/AutomationTemplates"));
const MarketplaceDrafts = lazyRetry(() => import("@/pages/MarketplaceDrafts"));
const MarketplaceEarnings = lazyRetry(() => import("@/pages/MarketplaceEarnings"));
const Pipeline = lazyRetry(() => import("@/pages/Pipeline"));

export function protectedRoutes() {
  return (
    <>
      <Route path="/home" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Command Center failed"><Home /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/neurons" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Neurons failed to load"><Index /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/n/new" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/n/:number" element={<ProtectedRoute><AppLayout fullHeight><ErrorBoundary fallbackTitle="Editor failed to load"><NeuronEditor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/extractor" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Extractor failed to load"><Extractor /></ErrorBoundary></AppLayout></ProtectedRoute>} />
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
      <Route path="/cusnir-os" element={<Navigate to="/home" replace />} />
      <Route path="/cusnir-os/map" element={<Navigate to="/home" replace />} />
      <Route path="/cusnir-os/architecture" element={<Navigate to="/home" replace />} />
      <Route path="/wallet" element={<Navigate to="/credits" replace />} />
      <Route path="/gamification" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Gamification failed to load"><GamificationPage /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/data-pipeline" element={<Navigate to="/pipeline" replace />} />
      <Route path="/pipeline" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Pipeline failed to load"><Pipeline /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Integrations failed to load"><Integrations /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/cognitive-units" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Cognitive units failed to load"><CognitiveUnits /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/collection-runs" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Collection runs failed to load"><CollectionRuns /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/notebooks" element={<Navigate to="/library" replace />} />
      <Route path="/notebook/:id" element={<Navigate to="/library" replace />} />
      <Route path="/capitalization" element={<Navigate to="/marketplace" replace />} />
      <Route path="/headline-generator" element={<Navigate to="/home" replace />} />
      <Route path="/master-agent" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Master Agent failed"><MasterAgent /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/automations" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Automations failed"><AutomationTemplates /></ErrorBoundary></AppLayout></ProtectedRoute>} />

      {/* Protected marketplace routes */}
      <Route path="/marketplace/drafts" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Drafts failed to load"><MarketplaceDrafts /></ErrorBoundary></AppLayout></ProtectedRoute>} />
      <Route path="/marketplace/earnings" element={<ProtectedRoute><AppLayout><ErrorBoundary fallbackTitle="Earnings failed to load"><MarketplaceEarnings /></ErrorBoundary></AppLayout></ProtectedRoute>} />
    </>
  );
}
