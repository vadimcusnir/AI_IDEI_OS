/**
 * SuggestionTabs — Perplexity-style categorized suggestions below input.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Briefcase, Code2, ListChecks, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionTabsProps {
  onCommand: (prompt: string) => void;
}

const TABS = [
  { id: "for_you", label: "Pentru tine", icon: Sparkles },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "create", label: "Creează", icon: Code2 },
  { id: "organize", label: "Organizează", icon: ListChecks },
];

const SUGGESTIONS: Record<string, Array<{ text: string; prompt: string }>> = {
  for_you: [
    { text: "Extrage neuroni din ultimul episod", prompt: "Extract neurons from my latest episode" },
    { text: "Analizează competitorii mei principali", prompt: "Analyze my main competitors and their strategy" },
    { text: "Generează articole din neuronii existenți", prompt: "Generate articles from existing neurons about marketing" },
    { text: "Arată-mi un raport de performanță", prompt: "Show me a performance report of my knowledge assets" },
    { text: "Creează un funnel de vânzare complet", prompt: "Create a complete sales funnel from my best frameworks" },
  ],
  business: [
    { text: "Construiește un model financiar", prompt: "Build a financial model for my startup" },
    { text: "Creează un pitch deck complet", prompt: "Create a complete pitch deck presentation" },
    { text: "Găsește primii clienți și redactează outreach", prompt: "Find my first customers and draft cold outreach messages" },
    { text: "Cercetează piața și dimensiunea oportunității", prompt: "Research my market and size the opportunity" },
    { text: "Scrie o propunere pentru investitori", prompt: "Write a one-page investor proposal" },
  ],
  create: [
    { text: "Generează un curs complet din conținut", prompt: "Generate a complete course from my content about expertise" },
    { text: "Creează o serie de postări LinkedIn", prompt: "Create a LinkedIn post series from my top frameworks" },
    { text: "Scrie un articol de 2000 de cuvinte", prompt: "Write a 2000-word article about knowledge capitalization" },
    { text: "Generează 10 hook-uri de copywriting", prompt: "Generate 10 copywriting hooks from my neuron patterns" },
    { text: "Construiește un email sequence complet", prompt: "Build a complete email sequence for lead nurturing" },
  ],
  organize: [
    { text: "Analizează și categorizează neuronii", prompt: "Analyze and categorize all my neurons by topic" },
    { text: "Identifică duplicatele din librărie", prompt: "Identify duplicate patterns in my knowledge library" },
    { text: "Creează o taxonomie de cunoștințe", prompt: "Create a knowledge taxonomy from my content" },
    { text: "Generează un raport de calitate", prompt: "Generate a quality report for my knowledge assets" },
    { text: "Planifică producția pentru luna următoare", prompt: "Plan content production for next month" },
  ],
};

export function SuggestionTabs({ onCommand }: SuggestionTabsProps) {
  const [activeTab, setActiveTab] = useState("for_you");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="w-full max-w-3xl mx-auto px-4 sm:px-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/60 font-medium">Sugestii rapide</span>
      </div>

      {/* Tab pills */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
              "border shrink-0",
              activeTab === tab.id
                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "border-border/40 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Suggestions list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl overflow-hidden"
        >
          {SUGGESTIONS[activeTab]?.map((s, i) => (
            <button
              key={i}
              onClick={() => onCommand(s.prompt)}
              className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-b border-border/20 last:border-b-0"
            >
              {s.text}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
