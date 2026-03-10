import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NeuronEditor from "./pages/NeuronEditor";
import AdminDashboard from "./pages/AdminDashboard";
import Architecture from "./pages/Architecture";
import Links from "./pages/Links";
import Extractor from "./pages/Extractor";
import Services from "./pages/Services";
import Jobs from "./pages/Jobs";
import RunService from "./pages/RunService";
import Credits from "./pages/Credits";
import Intelligence from "./pages/Intelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/n/new" element={<NeuronEditor />} />
            <Route path="/n/:number" element={<NeuronEditor />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/links" element={<Links />} />
            <Route path="/extractor" element={<Extractor />} />
            <Route path="/services" element={<Services />} />
            <Route path="/run/:serviceKey" element={<RunService />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/credits" element={<Credits />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
