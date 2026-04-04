import { Quote, Handshake, Star, TrendingUp, Brain } from "lucide-react";

const TESTIMONIALS = [
  { quote: "AI-IDEI a transformat modul în care îmi structurez cunoștințele.", author: "Early Adopter", role: "Knowledge Creator" },
  { quote: "Cel mai intuitiv knowledge OS pe care l-am folosit.", author: "Beta Tester", role: "AI Researcher" },
  { quote: "Formulele din Codul Cușnir aplicate cu AI — rezultate extraordinare.", author: "Copywriter", role: "Content Strategist" },
];

const STATS = [
  { label: "Neuroni creați", value: "2.500+", icon: Brain },
  { label: "Utilizatori activi", value: "150+", icon: TrendingUp },
  { label: "Templates disponibile", value: "17+", icon: Star },
];

const PARTNERS = ["Lovable", "Google AI", "OpenAI"];

export function SocialProofBlock() {
  return (
    <div className="mb-8">
      <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
        Social Proof
      </h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {STATS.map(stat => (
          <div
            key={stat.label}
            className="px-3 py-3 rounded-xl border border-border bg-card text-center"
          >
            <stat.icon className="h-3.5 w-3.5 text-primary mx-auto mb-1.5" />
            <p className="text-base font-bold text-foreground">{stat.value}</p>
            <p className="text-nano text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="px-4 py-3.5 rounded-xl border border-border bg-card">
            <div className="flex gap-2 items-start">
              <Quote className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground italic leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <p className="text-dense text-muted-foreground font-medium">— {t.author}</p>
                  <span className="text-nano text-muted-foreground/50">· {t.role}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Partners */}
      {PARTNERS.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <Handshake className="h-3.5 w-3.5 text-muted-foreground/50" />
          {PARTNERS.map(p => (
            <span key={p} className="text-micro text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
