import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download, Trash2, Loader2, AlertTriangle, ShieldCheck,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DataPrivacy() {
  const { user, session, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleExport = async () => {
    if (!session) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("gdpr", {
        body: { action: "export" },
      });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-idei-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!session || confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("gdpr", {
        body: { action: "delete" },
      });
      if (error) throw error;
      toast.success("Account and all data deleted.");
      await signOut();
    } catch (err: any) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SEOHead
        title="Data & Privacy — AI-IDEI"
        description="Export or delete your personal data from AI-IDEI."
      />

      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">Data & Privacy</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        You have full control over your data. Export everything we store about you,
        or permanently delete your account and all associated data.
      </p>

      {/* Export Section */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-1">Export Your Data</h2>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Download a JSON file containing all your data: profile, neurons,
              episodes, artifacts, credits, feedback, and more. This file is
              portable and can be imported into other systems.
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exporting ? "Exporting..." : "Download My Data"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Section */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-destructive mb-1">
              Delete Account & Data
            </h2>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Permanently delete your account and all associated data including
              neurons, episodes, artifacts, credits, and feedback. This action
              is <strong>irreversible</strong>.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This will permanently delete your account and all data.
                      This action cannot be undone.
                    </p>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        Type <strong>DELETE</strong> to confirm:
                      </label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-destructive/20"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmText !== "DELETE" || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : null}
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
