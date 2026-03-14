import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { CookieConsent } from "@/components/global/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import NeuronEditor from "./pages/NeuronEditor";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import Architecture from "./pages/Architecture";
import Links from "./pages/Links";
import Extractor from "./pages/Extractor";
import Services from "./pages/Services";
import Jobs from "./pages/Jobs";
import RunService from "./pages/RunService";
import Credits from "./pages/Credits";
import Intelligence from "./pages/Intelligence";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import PromptForge from "./pages/PromptForge";
import ProfileExtractor from "./pages/ProfileExtractor";
import Notifications from "./pages/Notifications";
import Feedback from "./pages/Feedback";
import Index from "./pages/Index";
import Changelog from "./pages/Changelog";
import Library from "./pages/Library";
import ArtifactDetail from "./pages/ArtifactDetail";
import GuestPages from "./pages/GuestPages";
import GuestProfile from "./pages/GuestProfile";
import BatchRunner from "./pages/BatchRunner";
import Onboarding from "./pages/Onboarding";
import Docs from "./pages/Docs";
import EntityListing from "./pages/EntityListing";
import EntityDetail from "./pages/EntityDetail";
import TopicListing from "./pages/TopicListing";
import TopicDetail from "./pages/TopicDetail";
import MediaProfiles from "./pages/MediaProfiles";
import PipelineOverview from "./pages/PipelineOverview";
import TopicDiscovery from "./pages/TopicDiscovery";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataPrivacy from "./pages/DataPrivacy";
import PublicUserProfile from "./pages/PublicUserProfile";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="/media/profiles" element={<AppLayout><MediaProfiles /></AppLayout>} />
              <Route path="/pipeline" element={<AppLayout><PipelineOverview /></AppLayout>} />
              <Route path="/terms" element={<AppLayout><TermsOfService /></AppLayout>} />
              <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />

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

              {/* Admin route */}
              <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
