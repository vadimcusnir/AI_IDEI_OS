/**
 * AdminGovernance — Central governance dashboard for the 4 critical control blocks.
 */
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2, Shield, Box, ScrollText, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntitlementsPanel } from "@/components/governance/EntitlementsPanel";
import { ModuleRegistryPanel } from "@/components/governance/ModuleRegistryPanel";
import { CusnirOSLedger } from "@/components/governance/CusnirOSLedger";
import { TierProgressionPanel } from "@/components/governance/TierProgressionPanel";

export default function AdminGovernance() {
  const { loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Admin — Governance" description="System control plane: entitlements, module registry, ledger, tier progression." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Governance & Control</h1>
          <p className="text-sm text-muted-foreground">Entitlements → Module Registry → Ledger → Tier Progression</p>
        </div>

        <Tabs defaultValue="entitlements" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="entitlements" className="text-xs gap-1"><Shield className="h-3 w-3" /> Entitlements</TabsTrigger>
            <TabsTrigger value="registry" className="text-xs gap-1"><Box className="h-3 w-3" /> Registry</TabsTrigger>
            <TabsTrigger value="ledger" className="text-xs gap-1"><ScrollText className="h-3 w-3" /> Ledger</TabsTrigger>
            <TabsTrigger value="tiers" className="text-xs gap-1"><TrendingUp className="h-3 w-3" /> Tiers</TabsTrigger>
          </TabsList>

          <div className="bg-card border border-border rounded-lg p-5">
            <TabsContent value="entitlements"><EntitlementsPanel /></TabsContent>
            <TabsContent value="registry"><ModuleRegistryPanel /></TabsContent>
            <TabsContent value="ledger"><CusnirOSLedger /></TabsContent>
            <TabsContent value="tiers"><TierProgressionPanel /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
