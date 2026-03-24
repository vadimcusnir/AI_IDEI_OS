/**
 * CusnirOSPage — VIP-facing Cusnir_OS governance layer.
 * Autonomous: uses useCusnirOS + useAuth.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useCusnirOS } from "@/hooks/useCusnirOS";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { CusnirOSCopy } from "@/components/cusnir-os/CusnirOSCopy";

export default function CusnirOSPage() {
  const { user, loading: authLoading } = useAuth();
  const { eligible, currentMonth, loading: cusnirLoading } = useCusnirOS();
  const navigate = useNavigate();

  const loading = authLoading || cusnirLoading;

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

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead
          title="Cusnir_OS — Governance Layer"
          description="System-level control interface. Earned through consistency, not purchased through convenience."
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <CusnirOSCopy
            monthProgress={currentMonth}
            eligible={eligible}
            onNavigateCredits={() => navigate("/credits")}
          />
        </div>
      </div>
    </PageTransition>
  );
}
