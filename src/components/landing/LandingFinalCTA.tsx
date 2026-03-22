/**
 * Final CTA — compact, tensioned, clear.
 */
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  ctaAction: () => void;
}

export function LandingFinalCTA({ ctaAction }: Props) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[hsl(var(--gold-oxide)/0.05)] rounded-full blur-[180px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
        <h2 className="heading-2 mb-5">
          Stop collecting ideas.
          <br />
          <span className="text-[hsl(var(--gold-oxide))]">Start turning them into assets.</span>
        </h2>
        <p className="text-base text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed text-flow">
          Use AI-IDEI to write faster, market better, and turn rough thinking into persuasive output.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
          <Button size="lg" onClick={ctaAction} className="gap-2 px-10 h-12 sm:h-14 min-h-[44px] bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-dim))] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] w-full sm:w-auto">
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 h-12 sm:h-14 min-h-[44px] w-full sm:w-auto border-border text-muted-foreground hover:bg-accent/10">
            <Eye className="h-4 w-4" />
            See What's Inside
          </Button>
        </div>
        <p className="text-xs sm:text-sm font-mono tracking-[0.12em] text-muted-foreground">
          LESS FRICTION · BETTER COPY · STRONGER EXECUTION
        </p>
      </div>
    </section>
  );
}
