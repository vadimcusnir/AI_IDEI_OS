/**
 * StickyCtaBar — Persistent activation bar appearing after 30% scroll.
 * Dismissible per-session. Hides near footer to avoid overlap.
 */
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  ctaAction: () => void;
}

const DISMISS_KEY = "landing-sticky-cta-dismissed";

export function StickyCtaBar({ ctaAction }: Props) {
  const { t } = useTranslation("landing");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrolled / Math.max(docHeight, 1);
      // Show between 30% and 92% scroll (hide before reaching footer)
      setVisible(pct > 0.3 && pct < 0.92);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "fixed z-40",
            "bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6",
            "max-w-md sm:max-w-sm mx-auto sm:mx-0"
          )}
          role="region"
          aria-label="Activation"
        >
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-obsidian/40 px-4 py-3">
            <p className="text-sm font-medium text-foreground flex-1 hidden sm:block">
              {t("sticky_cta.label")}
            </p>
            <Button
              size="sm"
              onClick={ctaAction}
              className="gap-1.5 h-9 bg-gold hover:bg-gold-dim text-obsidian font-semibold flex-1 sm:flex-initial"
            >
              {t("sticky_cta.cta")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={handleDismiss}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors shrink-0"
              aria-label={t("sticky_cta.dismiss")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
