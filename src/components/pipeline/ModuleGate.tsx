/**
 * ModuleGate — Fail-closed component gate.
 * Wraps any feature that requires a module to be active in the registry.
 * If the module doesn't exist or isn't active → blocked.
 */
import { useModuleRegistry } from "@/hooks/useModuleRegistry";
import { ShieldOff, Loader2 } from "lucide-react";

interface ModuleGateProps {
  /** The module_key that must be active */
  moduleKey: string;
  children: React.ReactNode;
  /** Optional fallback when blocked */
  fallback?: React.ReactNode;
}

export function ModuleGate({ moduleKey, children, fallback }: ModuleGateProps) {
  const { isExecutable, loading } = useModuleRegistry();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isExecutable(moduleKey)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <ShieldOff className="h-8 w-8 opacity-40" />
        <p className="text-sm max-w-xs text-center">
          Module <code className="text-xs bg-muted px-1 py-0.5 rounded">{moduleKey}</code> is not available.
        </p>
        <span className="text-xs opacity-50">Contact your administrator to enable this module.</span>
      </div>
    );
  }

  return <>{children}</>;
}
