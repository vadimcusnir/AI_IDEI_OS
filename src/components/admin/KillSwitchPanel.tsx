/**
 * KillSwitchPanel — Emergency execution halt control for admin dashboard.
 */
import { useState } from "react";
import { useKillSwitch } from "@/hooks/useKillSwitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Power, PowerOff, Shield, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function KillSwitchPanel() {
  const { active, reason, activatedAt, loading, activate, deactivate } = useKillSwitch();
  const [killReason, setKillReason] = useState("");
  const [acting, setActing] = useState(false);

  const handleActivate = async () => {
    if (!killReason.trim()) return;
    setActing(true);
    await activate(killReason.trim());
    setKillReason("");
    setActing(false);
  };

  const handleDeactivate = async () => {
    setActing(true);
    await deactivate();
    setActing(false);
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all",
      active ? "border-destructive bg-destructive/5" : "border-border"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className={cn("h-4 w-4", active ? "text-destructive" : "text-muted-foreground")} />
          Kill Switch
          {active && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded animate-pulse">
              ACTIVE
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {active ? (
          <>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive">All executions are halted</p>
                {reason && <p className="text-[11px] text-muted-foreground">Reason: {reason}</p>}
                {activatedAt && (
                  <p className="text-[10px] text-muted-foreground/60">
                    Activated {formatDistanceToNow(new Date(activatedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-1.5" disabled={acting}>
                  {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                  Resume Executions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resume all executions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will re-enable all AI service executions across the platform.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate}>Resume</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">
              Emergency halt for all AI executions. Use when provider costs spike or critical errors occur.
            </p>
            <Input
              placeholder="Reason (required)"
              value={killReason}
              onChange={(e) => setKillReason(e.target.value)}
              className="text-xs h-8"
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-1.5"
                  disabled={!killReason.trim() || acting}
                >
                  {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
                  Activate Kill Switch
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">⚠️ Activate Kill Switch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately halt ALL AI executions across the entire platform. 
                    No jobs will be processed until manually resumed.
                    <br /><br />
                    <strong>Reason:</strong> {killReason}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleActivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Halt All Executions
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
