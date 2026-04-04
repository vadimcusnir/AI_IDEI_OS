import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download, Trash2, Loader2, AlertTriangle, ShieldCheck, ArrowRight,
  Fingerprint, Eye, FileEdit, FileOutput, Ban, XCircle,
} from "lucide-react";
import { ConsentPreferencesPanel } from "@/components/consent/ConsentPreferencesPanel";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function DataPrivacy() {
  const { user, session, signOut } = useAuth();
  const { t } = useTranslation("pages");
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
      toast.success(t("data_privacy.export_success"));
    } catch (err: any) {
      toast.error(t("data_privacy.export_failed") + ": " + (err.message || "Unknown error"));
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
      toast.success(t("data_privacy.delete_success"));
      await signOut();
    } catch (err: any) {
      toast.error(t("data_privacy.delete_failed") + ": " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const rights = [
    { icon: <Eye className="h-4 w-4" />, label: t("data_privacy.right_access") },
    { icon: <FileEdit className="h-4 w-4" />, label: t("data_privacy.right_rectify") },
    { icon: <XCircle className="h-4 w-4" />, label: t("data_privacy.right_erase") },
    { icon: <FileOutput className="h-4 w-4" />, label: t("data_privacy.right_port") },
    { icon: <Ban className="h-4 w-4" />, label: t("data_privacy.right_restrict") },
    { icon: <Fingerprint className="h-4 w-4" />, label: t("data_privacy.right_object") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEOHead
        title="Data & Privacy — AI-IDEI"
        description="Exercise your GDPR rights: access, export, or delete your personal data from AI-IDEI."
        canonical="https://ai-idei.com/data-privacy"
      />

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-micro font-mono uppercase tracking-widest text-muted-foreground">
            {t("data_privacy.legal_doc")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{t("data_privacy.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{t("data_privacy.description")}</p>
      </motion.div>

      {/* GDPR Rights Grid */}
      <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <h2 className="text-sm font-semibold mb-3">{t("data_privacy.your_rights_title")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {rights.map((r, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-xs text-muted-foreground">
              <span className="text-primary">{r.icon}</span>
              {r.label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Consent */}
      <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <ConsentPreferencesPanel />
      </motion.div>

      <div className="mt-4 space-y-4">
        {/* Export */}
        <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="rounded-xl border border-border bg-card/60 p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Download className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold mb-1">{t("data_privacy.export_title")}</h2>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t("data_privacy.export_desc")}</p>
              <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="gap-1.5 text-xs">
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {exporting ? t("data_privacy.exporting") : t("data_privacy.download")}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Delete */}
        <motion.div custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-destructive mb-1">{t("data_privacy.delete_title")}</h2>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t("data_privacy.delete_desc")}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("data_privacy.delete_button")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("data_privacy.delete_confirm_title")}</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>{t("data_privacy.delete_confirm_desc")}</p>
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1.5">
                          {t("data_privacy.delete_confirm_label")}
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder={t("data_privacy.delete_keyword")}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-destructive/20"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText("")}>{t("data_privacy.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmText !== "DELETE" || deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      {t("data_privacy.delete_everything")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cross-links */}
      <motion.div custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="mt-6 flex items-center gap-4 text-xs text-muted-foreground"
      >
        <Link to="/terms" className="inline-flex items-center gap-1 text-primary hover:underline">
          {t("data_privacy.see_terms")} <ArrowRight className="h-3 w-3" />
        </Link>
        <Link to="/privacy" className="inline-flex items-center gap-1 text-primary hover:underline">
          {t("data_privacy.see_privacy")} <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>
    </div>
  );
}
