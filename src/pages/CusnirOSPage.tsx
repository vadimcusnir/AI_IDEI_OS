/**
 * CusnirOSPage — VIP-facing Cusnir_OS governance layer.
 * Real access enforcement via useEntitlements (compute_entitlements RPC).
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield } from "lucide-react";
import { CusnirOSCopy } from "@/components/cusnir-os/CusnirOSCopy";

export default function CusnirOSPage() {
  const { user, loading: authLoading } = useAuth();
  const { cusnirOs, level, vipMonth, loading: entLoading } = useEntitlements();
  const navigate = useNavigate();

  const loading = authLoading || entLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <Lock className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Autentifică-te pentru a vedea Cusnir_OS.</p>
        <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  if (!cusnirOs && level !== "L4") {
    return (
      <PageTransition>
        <div className="flex-1 overflow-y-auto">
          <SEOHead title="Cusnir_OS — Locked" description="Earn access through consistency." />
          <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
            <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto" />
            <h2 className="text-lg font-bold">Cusnir_OS — Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              Requires Level L4: VIP subscription, 11 months loyalty, 100+ NOTA2 tokens.
            </p>
            <p className="text-xs text-muted-foreground/50">
              Current: {level} · VIP Month: {vipMonth}/11
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
              View Plans
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead
          title="Cusnir_OS — Governance Layer"
          description="System-level control interface. Earned through consistency, not purchased through convenience."
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <CusnirOSCopy
            monthProgress={vipMonth}
            eligible={cusnirOs}
            onNavigateCredits={() => navigate("/credits")}
          />
        </div>
      </div>
    </PageTransition>
  );
}
