import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import {
  Coins, ArrowRight, ArrowUp, Search, FileText, Share2, BarChart3, Sparkles,
  Zap, Brain, Target, Plus, Paperclip, X, PanelLeftOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { cn } from "@/lib/utils";
import { SuggestionTabs } from "@/components/command-center/SuggestionTabs";
import { InputAttachMenu } from "@/components/command-center/InputAttachMenu";
import { ChatHistorySidebar } from "@/components/command-center/ChatHistorySidebar";
import { useChatHistory } from "@/hooks/useChatHistory";

const CommandCenter = lazy(() =>
  import("@/components/command-center/CommandCenter").then(m => ({ default: m.CommandCenter }))
);

const QUICK_INTENTS = [
  { label: "Landing Page", icon: FileText, search: "landing", intentCategory: "sell", color: "text-blue-500" },
  { label: "Social Media", icon: Share2, search: "social", intentCategory: "attract", color: "text-emerald-500" },
  { label: "Market Research", icon: BarChart3, search: "research", intentCategory: "convert", color: "text-amber-500" },
  { label: "Generează Curs", icon: Sparkles, search: "course", intentCategory: "educate", color: "text-purple-500" },
];

const STATS = [
  { label: "Servicii AI", value: "3000+", icon: Zap },
  { label: "Tipuri Output", value: "50+", icon: Brain },
  { label: "Timp Mediu", value: "<60s", icon: Target },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const [intent, setIntent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [commandMode, setCommandMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessionId, sessions,
    loadSession, deleteSession, newSession,
  } = useChatHistory();

  useOnboardingRedirect();

  if (authLoading) return <HomeSkeleton />;

  const handleSubmit = (text?: string) => {
    const q = (text || intent).trim();
    if (!q) return;
    setCommandMode(true);
  };

  const handleQuickIntent = (search: string, _intentCategory: string) => {
    setIntent(search);
    setCommandMode(true);
  };

  const handleAttachAction = (action: string) => {
    const actionMap: Record<string, string> = {
      web_search: "/search ",
      deep_research: "/research ",
      generate_image: "/generate ",
      analyze_url: "/analyze ",
      voice_input: "/voice ",
    };
    if (actionMap[action]) {
      setIntent(actionMap[action]);
      textareaRef.current?.focus();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSuggestionCommand = (prompt: string) => {
    setIntent(prompt);
    setCommandMode(true);
  };

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Noapte bună" : hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <PageTransition>
      <WelcomeModal />
      <SEOHead title={`${t("home.cockpit")} — AI-IDEI`} description={t("home.cockpit_desc")} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar
          sessions={sessions}
          currentSessionId={sessionId}
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onNewSession={() => { newSession(); setShowHistory(false); }}
          onLoadSession={async (sid) => {
            await loadSession(sid);
            setShowHistory(false);
            setCommandMode(true);
          }}
          onDeleteSession={async (sid) => {
            await deleteSession(sid);
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.02] blur-[100px]" />
          </div>

          <AnimatePresence mode="wait">
            {!commandMode ? (
              /* ═══ HERO STATE — Claude-style intent landing ═══ */
              <motion.div
                key="hero"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                className="flex-1 overflow-auto relative"
              >
                {/* Top bar with history toggle + balance */}
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
                    onClick={() => setShowHistory(!showHistory)}
                    title="Istoric conversații"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>

                  <motion.button
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    onClick={() => navigate("/credits")}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2 rounded-full",
                      "border border-border/50 bg-card/70 backdrop-blur-md",
                      "hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5",
                      "transition-all duration-300 group"
                    )}
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Coins className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">{balance?.toLocaleString() ?? "—"}</span>
                    <span className="text-[11px] font-medium text-muted-foreground tracking-wide">NEURONS</span>
                  </motion.button>
                </div>

                {/* Hero — Claude-style centered greeting + input */}
                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[52vh] pt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full text-center space-y-8"
                  >
                    {/* Greeting — Claude style */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      className="space-y-2"
                    >
                      <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-[-0.03em] leading-[1.15]">
                        {greeting},{" "}
                        <span className="bg-gradient-to-r from-primary via-primary/85 to-primary/70 bg-clip-text text-transparent">
                          {userName}
                        </span>
                      </h1>
                      <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Ce vrei să construim astăzi?
                      </p>
                    </motion.div>

                    {/* Premium input — Claude-style with + menu */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="relative w-full"
                    >
                      <input
                        ref={fileInputRef as any}
                        type="file"
                        multiple
                        accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      {/* File chips */}
                      <AnimatePresence>
                        {files.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 flex-wrap pb-2 overflow-hidden"
                          >
                            {files.map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-card border border-border/40 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
                                <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                <span className="truncate max-w-[140px] text-foreground">{f.name}</span>
                                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground transition-colors">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        className={cn(
                          "relative flex items-end rounded-2xl border bg-card transition-all duration-300",
                          isFocused
                            ? "border-primary/50 shadow-xl shadow-primary/[0.08] ring-1 ring-primary/20"
                            : "border-border/60 shadow-lg shadow-black/[0.03] hover:border-border hover:shadow-xl hover:shadow-black/[0.05]"
                        )}
                      >
                        {/* + attach menu */}
                        <div className="ml-1.5 mb-1.5">
                          <InputAttachMenu
                            onFileClick={() => (fileInputRef.current as HTMLInputElement | null)?.click()}
                            onAction={handleAttachAction}
                          />
                        </div>

                        {/* Textarea */}
                        <textarea
                          ref={textareaRef}
                          value={intent}
                          onChange={(e) => setIntent(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                          placeholder="Descrie ce ai nevoie..."
                          className="flex-1 bg-transparent py-4 px-2 text-[15px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none resize-none min-h-[52px] max-h-[200px]"
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = Math.min(target.scrollHeight, 200) + "px";
                          }}
                        />

                        {/* Send button */}
                        <Button
                          onClick={() => handleSubmit()}
                          disabled={!intent.trim() && files.length === 0}
                          size="sm"
                          className={cn(
                            "h-9 w-9 p-0 shrink-0 rounded-xl mr-1.5 mb-1.5 transition-all duration-200",
                            (intent.trim() || files.length > 0)
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:shadow-md"
                              : "bg-muted text-muted-foreground/30"
                          )}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Keyboard hint */}
                      <p className="text-[10px] text-muted-foreground/30 text-center mt-2 select-none">
                        <kbd className="font-mono">Enter</kbd> trimite · <kbd className="font-mono">Shift+Enter</kbd> linie nouă · <kbd className="font-mono">+</kbd> atașează
                      </p>
                    </motion.div>

                    {/* Quick intents — Claude-style chips */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="flex flex-wrap justify-center gap-2"
                    >
                      {QUICK_INTENTS.map((qi, i) => (
                        <motion.button
                          key={qi.label}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.06, duration: 0.35 }}
                          onClick={() => handleQuickIntent(qi.search, qi.intentCategory)}
                          className={cn(
                            "group flex items-center gap-2 px-3.5 py-2 rounded-xl",
                            "border border-border/40 bg-card/50 backdrop-blur-sm",
                            "text-[13px] font-medium text-muted-foreground",
                            "hover:border-primary/30 hover:text-foreground hover:bg-card hover:shadow-sm",
                            "transition-all duration-200"
                          )}
                        >
                          <qi.icon className={cn("h-3.5 w-3.5 transition-colors", qi.color, "opacity-60 group-hover:opacity-100")} />
                          {qi.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>

                {/* Suggestion Tabs — Claude "Learn" style */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="max-w-3xl mx-auto pb-6"
                >
                  <SuggestionTabs onCommand={handleSuggestionCommand} />
                </motion.div>

                {/* Bottom stats strip */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="max-w-xl mx-auto px-4 sm:px-6 pb-12"
                >
                  <div className="flex items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-border/30">
                    {STATS.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2.5 text-center">
                        <stat.icon className="h-4 w-4 text-muted-foreground/40" />
                        <div>
                          <p className="text-sm font-bold tabular-nums text-foreground">{stat.value}</p>
                          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* ═══ COMMAND MODE — Full Command Center ═══ */
              <motion.div
                key="command"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col min-h-0"
              >
                <Suspense fallback={
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground text-sm">Loading Command Center...</div>
                  </div>
                }>
                  <CommandCenter initialInput={intent} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
