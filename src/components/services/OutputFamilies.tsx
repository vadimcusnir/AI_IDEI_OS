/**
 * OutputFamilies — Shows 12 output families with counts.
 * Each family represents a deliverable category.
 */
import { motion } from "framer-motion";
import {
  FileText, Megaphone, Mail, Video, BookOpen,
  BarChart3, Target, Brain, Presentation, Users,
  Newspaper, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OutputFamily {
  key: string;
  label: string;
  icon: React.ElementType;
  count: string;
  examples: string[];
}

const FAMILIES: OutputFamily[] = [
  { key: "articles", label: "Articole", icon: FileText, count: "5-15", examples: ["Blog posts", "Pillar articles", "Guest posts"] },
  { key: "social", label: "Social Media", icon: Megaphone, count: "15-30", examples: ["LinkedIn", "Twitter threads", "Instagram captions"] },
  { key: "email", label: "Email Marketing", icon: Mail, count: "5-10", examples: ["Sequences", "Newsletters", "Cold outreach"] },
  { key: "video", label: "Video & Script", icon: Video, count: "3-5", examples: ["YouTube scripts", "Reels scripts", "Webinar outlines"] },
  { key: "courses", label: "Cursuri", icon: BookOpen, count: "1-3", examples: ["Module content", "Quiz-uri", "Assignments"] },
  { key: "analytics", label: "Analiză", icon: BarChart3, count: "3-5", examples: ["Market research", "Competitor maps", "Data reports"] },
  { key: "strategy", label: "Strategie", icon: Target, count: "2-5", examples: ["GTM plans", "Positioning", "Pricing models"] },
  { key: "frameworks", label: "Frameworks", icon: Brain, count: "5-15", examples: ["Decision trees", "Mental models", "Metodologii"] },
  { key: "presentations", label: "Prezentări", icon: Presentation, count: "1-3", examples: ["Pitch decks", "Slide scripts", "Keynote briefs"] },
  { key: "personas", label: "Profiluri", icon: Users, count: "1-5", examples: ["ICP analysis", "Avatar33", "JTBD maps"] },
  { key: "copy", label: "Copywriting", icon: Newspaper, count: "10-25", examples: ["Headlines", "CTAs", "Landing page copy"] },
  { key: "automation", label: "Automatizări", icon: Zap, count: "2-5", examples: ["Funnel flows", "Email automations", "Trigger sequences"] },
];

interface OutputFamiliesProps {
  compact?: boolean;
}

export function OutputFamilies({ compact }: OutputFamiliesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">12 Familii de Output</h2>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">50+ deliverables per run</span>
      </div>

      <div className={cn(
        "grid gap-2",
        compact ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      )}>
        {FAMILIES.map((fam, i) => {
          const Icon = fam.icon;
          return (
            <motion.div
              key={fam.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "group rounded-xl border border-border/30 bg-card/50 p-3",
                "hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-200",
                compact && "p-2"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-lg font-mono font-bold text-foreground">{fam.count}</span>
              </div>
              <h3 className="text-xs font-semibold mb-1">{fam.label}</h3>
              {!compact && (
                <div className="space-y-0.5">
                  {fam.examples.map((ex, ei) => (
                    <p key={ei} className="text-[9px] text-muted-foreground/60">{ex}</p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-center gap-3 py-2 text-xs text-muted-foreground">
        <span>Total per execuție sistem:</span>
        <span className="font-mono font-bold text-primary text-sm">50+</span>
        <span>deliverables profesionale</span>
      </div>
    </div>
  );
}
