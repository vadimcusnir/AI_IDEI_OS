import { Navigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Loader2, ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading, user } = useAdminCheck();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <ShieldAlert className="h-12 w-12 text-destructive/40" />
        <h1 className="text-lg font-semibold">Acces interzis</h1>
        <p className="text-sm text-muted-foreground">Nu ai permisiuni de administrator.</p>
      </div>
    );
  }

  return <>{children}</>;
}
