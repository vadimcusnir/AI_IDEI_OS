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
import NotFound from "./pages/NotFound";

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
              <Route path="/links" element={<Links />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/u/:username" element={<PublicProfile />} />

              {/* Protected routes — require authentication */}
              <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
              <Route path="/neurons" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
              <Route path="/n/new" element={<ProtectedRoute><NeuronEditor /></ProtectedRoute>} />
              <Route path="/n/:number" element={<ProtectedRoute><NeuronEditor /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/extractor" element={<ProtectedRoute><AppLayout><Extractor /></AppLayout></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><AppLayout><Services /></AppLayout></ProtectedRoute>} />
              <Route path="/run/:serviceKey" element={<ProtectedRoute><AppLayout><RunService /></AppLayout></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><AppLayout><Jobs /></AppLayout></ProtectedRoute>} />
              <Route path="/credits" element={<ProtectedRoute><AppLayout><Credits /></AppLayout></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><AppLayout><Library /></AppLayout></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute><AppLayout><Intelligence /></AppLayout></ProtectedRoute>} />
              <Route path="/prompt-forge" element={<ProtectedRoute><AppLayout><PromptForge /></AppLayout></ProtectedRoute>} />
              <Route path="/profile-extractor" element={<ProtectedRoute><AppLayout><ProfileExtractor /></AppLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><AppLayout><Feedback /></AppLayout></ProtectedRoute>} />

              {/* Admin route — requires authentication + admin role */}
              <Route path="/admin" element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
