/**
 * ServicesHero — Conversion-first hero for /services.
 * "Turn any input into 50+ outputs" with quick action.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ServicesHeroProps {
  isLoggedIn: boolean;
  serviceCount: number;
}

export function ServicesHero({ isLoggedIn, serviceCount }: ServicesHeroProps) {
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState("");

  const handleGenerate = () => {
    if (!isLoggedIn) {
      navigate("/auth?redirect=/services");
      return;
    }
    navigate("/home", { state: { prefill: quickInput } });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-6 sm:p-8"
    >
      <div className="max-w-2xl">
        {/* Headline */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Transformă orice input în{" "}
          <span className="text-primary">50+ deliverables</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-5 max-w-lg">
          Alege rezultatul, nu unealta. {serviceCount}+ sisteme AI produc articole, strategii, 
          scripturi și active digitale — automat.
        </p>

        {/* Quick input */}
        <div className="flex gap-2 mb-5">
          <Input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Lipește text, link YouTube sau descrie ce vrei..."
            className="h-11 text-sm bg-card flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <Button onClick={handleGenerate} className="h-11 gap-2 px-5 shrink-0">
            <Zap className="h-4 w-4" />
            Generează
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-primary/60" />
            Sub 2 minute execuție
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary/60" />
            50+ outputs per run
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary/60" />
            Cost mediu: $0.14/output
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary/60" />
            {serviceCount}+ sisteme disponibile
          </span>
        </div>
      </div>
    </motion.section>
  );
}
