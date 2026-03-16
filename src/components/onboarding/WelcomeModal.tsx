import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Play, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function WelcomeModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(`welcome_seen_${user.id}`);
    if (!seen) setOpen(true);
  }, [user]);

  const handleClose = () => {
    if (user) localStorage.setItem(`welcome_seen_${user.id}`, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-primary/20">
        {/* Video area */}
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/5 p-6 pb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-background/80 border border-border shadow-lg flex items-center justify-center">
              {/* Placeholder video thumbnail — replace src with real video */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary ml-0.5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Tutorial · 2 min</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <DialogHeader className="text-left mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Bine ai venit</span>
            </div>
            <DialogTitle className="text-lg font-serif">
              Transformă expertiza în active digitale
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Încarcă un podcast, un interviu sau un text. AI-IDEI extrage automat cunoștințe, pattern-uri și framework-uri — și le transformă în zeci de deliverable-uri profesionale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mb-4">
            {[
              "Încarcă conținut → transcriere automată",
              "Extrage neuroni → cunoștințe atomice reutilizabile",
              "Rulează servicii AI → 50+ deliverable-uri",
            ].map((step, i) => (
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
              Începe acum
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
              Mai târziu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
