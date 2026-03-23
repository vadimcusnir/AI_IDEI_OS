import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function WelcomeModal() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(`welcome_seen_${user.id}`);
    if (!seen) setOpen(true);
  }, [user]);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  const handleClose = () => {
    if (user) localStorage.setItem(`welcome_seen_${user.id}`, "true");
    setOpen(false);
  };

  const steps = [
    t("welcome_step_1"),
    t("welcome_step_2"),
    t("welcome_step_3"),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/5 p-4 pb-2">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-background/80 border border-border shadow-lg">
              <video
                ref={videoRef}
                src="/videos/ai-idei-explanation-01.mp4"
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            </div>
          </motion.div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <DialogHeader className="text-left mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t("welcome")}</span>
            </div>
            <DialogTitle className="text-lg">
              {t("welcome_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              {t("welcome_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mb-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClose} className="flex-1 gap-2 text-xs">
              {t("start_now")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
              {t("later")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
