/**
 * CusnirOSCopy — Full governance-layer copy for /cusnir-os.
 * Pure presentation. No hooks, no data dependencies.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Shield, Cpu, Network, Zap, Brain,
  ChevronRight, Lock, Crown, Map, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SuperlayerModules } from "./SuperlayerModules";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
      {children}
    </p>
  );
}

function CopyBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-compact leading-[1.8] text-muted-foreground/70 space-y-3", className)}>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-compact text-muted-foreground/70">
          <ChevronRight className="h-3 w-3 mt-1 text-primary/40 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <div className="border-t border-border/10 my-8" />;
}

const PERMISSIONS = [
  {
    title: "Execution Control",
    icon: Zap,
    items: [
      "priority access to AI execution pipelines",
      "batch processing beyond standard limits",
      "ability to bypass queue constraints",
    ],
  },
  {
    title: "System Override",
    icon: Cpu,
    items: [
      "modify execution parameters",
      "influence cost structures",
      "adjust operational constraints",
    ],
  },
  {
    title: "Module Access",
    icon: Brain,
    items: [
      "unlock non-public system modules",
      "interact with experimental capabilities",
      "operate internal mechanisms unavailable elsewhere",
    ],
  },
  {
    title: "Economic Influence",
    icon: Network,
    items: [
      "control over resource allocation logic",
      "visibility into credit flow and system behavior",
      "ability to operate at different efficiency levels than standard users",
    ],
  },
  {
    title: "Orchestration Layer",
    icon: Shield,
    items: [
      "coordinate multi-step processes across services",
      "manage complex execution chains",
      "operate as a system-level agent rather than a single user",
    ],
  },
];

interface CusnirOSCopyProps {
  monthProgress: number;
  eligible: boolean;
  onNavigateCredits: () => void;
}

export function CusnirOSCopy({ monthProgress, eligible, onNavigateCredits }: CusnirOSCopyProps) {
  const monthPercent = (Math.min(monthProgress, 11) / 11) * 100;

  return (
    <div className="space-y-10">
      {/* HERO */}
      <motion.div {...fade(0)} className="text-center space-y-5 pt-4">
        <div className="h-14 w-14 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mx-auto">
          <Crown className="h-7 w-7 text-foreground/60" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Cusnir_OS</h1>
          <p className="text-compact text-muted-foreground/60 leading-relaxed max-w-md mx-auto">
            You are not accessing a feature.<br />
            You are entering a control layer.
          </p>
        </div>
      </motion.div>

      {/* PRIMARY STATEMENT */}
      <motion.div {...fade(0.05)}>
        <Section>
          <CopyBlock>
            <p>Most users interact with AI.</p>
            <p>A small fraction learns to direct it.</p>
            <p>Almost none gain the right to control the system itself.</p>
            <p className="text-foreground/80 font-medium">Cusnir_OS exists for that final category.</p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* POSITIONING */}
      <motion.div {...fade(0.1)}>
        <Section>
          <SectionLabel>Positioning</SectionLabel>
          <CopyBlock>
            <p>Cusnir_OS is not a tool.<br />
            It is not a dashboard.<br />
            It is not a premium plan.</p>
            <p className="text-foreground/80 font-medium">It is a governance layer.</p>
            <p>A system-level interface that allows you to:</p>
          </CopyBlock>
          <BulletList items={[
            "influence execution logic",
            "control resource flow",
            "override default constraints",
            "operate beyond standard user limitations",
          ]} />
          <CopyBlock className="pt-2">
            <p className="text-xs italic text-muted-foreground/40">
              If you are looking for productivity — you are in the wrong place.<br />
              If you are looking for leverage — continue.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* ANTI-ONBOARDING */}
      <motion.div {...fade(0.15)}>
        <Section>
          <SectionLabel>Anti-Onboarding</SectionLabel>
          <CopyBlock>
            <p>There is no onboarding. There is no guided tutorial. There is no "getting started."</p>
            <p>You are expected to:</p>
          </CopyBlock>
          <BulletList items={[
            "understand system behavior",
            "infer logic from interaction",
            "operate without instruction",
          ]} />
          <CopyBlock className="pt-2">
            <p className="text-xs italic text-muted-foreground/40">
              If this creates friction, you are not the intended user.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* PERMISSIONS */}
      <motion.div {...fade(0.2)}>
        <Section>
          <SectionLabel>What You Actually Receive</SectionLabel>
          <CopyBlock>
            <p>Cusnir_OS does not provide features. It provides <span className="text-foreground/80 font-medium">permissions</span>.</p>
          </CopyBlock>

          <div className="grid gap-3 pt-2">
            {PERMISSIONS.map((perm) => (
              <div
                key={perm.title}
                className="rounded-xl border border-border/15 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-muted/20 flex items-center justify-center">
                    <perm.icon className="h-3.5 w-3.5 text-foreground/50" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{perm.title}</p>
                </div>
                <BulletList items={perm.items} />
              </div>
            ))}
          </div>

          <CopyBlock className="pt-2">
            <p className="text-foreground/80 font-medium">
              You do not receive tools.<br />
              You receive the authority to define how tools behave.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* ACCESS MODEL */}
      <motion.div {...fade(0.25)}>
        <Section>
          <SectionLabel>Access Model</SectionLabel>
          <CopyBlock>
            <p>Access cannot be requested. It cannot be negotiated.</p>
            <p className="text-foreground/80 font-medium">It is earned through measurable consistency.</p>
          </CopyBlock>

          <div className="rounded-xl border border-border/15 p-4 space-y-3 mt-2">
            <p className="text-xs font-semibold text-foreground">Requirements</p>
            <BulletList items={[
              "11 consecutive months of sustained activity",
              "continuous economic participation",
              "maintained system discipline",
              "no critical violations",
            ]} />
            <p className="text-xs text-muted-foreground/40 italic pt-1">
              Any break resets progression. There are no exceptions.
            </p>
          </div>

          <div className="rounded-xl border border-border/15 p-4 space-y-3 mt-2">
            <p className="text-xs font-semibold text-foreground">Loss Conditions</p>
            <CopyBlock>
              <p>Access is not permanent. It is continuously validated.</p>
              <p>Loss is triggered by:</p>
            </CopyBlock>
            <BulletList items={[
              "inconsistency",
              "economic threshold failure",
              "behavioral violations",
            ]} />
            <p className="text-xs text-muted-foreground/40 italic pt-1">
              When lost, access is revoked immediately. Re-entry requires restarting the full cycle or paying a reinstatement cost.
            </p>
          </div>
        </Section>
      </motion.div>

      <Divider />

      {/* SCARCITY */}
      <motion.div {...fade(0.3)}>
        <Section>
          <SectionLabel>Scarcity Structure</SectionLabel>
          <CopyBlock>
            <p>Access is not limited by supply. It is limited by behavior.</p>
            <p>Less than 1% of users maintain the required consistency window.</p>
            <p>Most fail within the first 90 days.</p>
            <p className="text-xs italic text-muted-foreground/40">
              Not due to lack of capability — but due to inability to sustain discipline.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* PSYCHOLOGICAL FRAME */}
      <motion.div {...fade(0.32)}>
        <Section>
          <SectionLabel>Psychological Frame</SectionLabel>
          <CopyBlock>
            <p>Cusnir_OS does not reward intelligence.</p>
            <p>It rewards:</p>
          </CopyBlock>
          <BulletList items={[
            "persistence",
            "repetition",
            "economic commitment",
            "operational stability",
          ]} />
          <CopyBlock className="pt-2">
            <p className="text-foreground/80 font-medium">
              This is not a test of knowledge. It is a test of continuity.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* ECONOMIC REFRAME */}
      <motion.div {...fade(0.34)}>
        <Section>
          <SectionLabel>Economic Reframe</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/15 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground/50">Standard</p>
              <BulletList items={["run tasks", "consume credits", "receive outputs"]} />
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Cusnir_OS</p>
              <BulletList items={["define task structure", "influence cost dynamics", "control execution pathways"]} />
            </div>
          </div>
        </Section>
      </motion.div>

      <Divider />

      {/* IDENTITY SHIFT */}
      <motion.div {...fade(0.36)}>
        <Section>
          <SectionLabel>Identity Shift</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/15 p-4 text-center">
              <p className="text-micro uppercase tracking-wider text-muted-foreground/40 mb-1">Before</p>
              <p className="text-compact text-muted-foreground/60">You use the platform.</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4 text-center">
              <p className="text-micro uppercase tracking-wider text-primary/50 mb-1">After</p>
              <p className="text-compact text-foreground/80 font-medium">You operate the platform.</p>
            </div>
          </div>
        </Section>
      </motion.div>

      <Divider />

      {/* ACCELERATED PATH */}
      <motion.div {...fade(0.38)}>
        <Section>
          <SectionLabel>Optional Access Path</SectionLabel>
          <CopyBlock>
            <p>There is an accelerated path. It is not recommended.</p>
            <p>It does not remove the need for discipline.</p>
            <p>Immediate access can be acquired through a one-time payment.</p>
            <p className="text-foreground/80 font-medium">
              The value is not the entry. The value is maintaining control after entry.
            </p>
            <p className="text-xs italic text-muted-foreground/40">
              Without discipline, access is lost regardless of how it was obtained.
            </p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* HIDDEN PROGRESSION */}
      <motion.div {...fade(0.4)}>
        <Section>
          <SectionLabel>Hidden Progression</SectionLabel>
          <CopyBlock>
            <p>Your progression is tracked. It is not fully visible.</p>
            <p>Signals exist. Patterns emerge.</p>
            <p className="text-foreground/80 font-medium">You will know when you are close.</p>
          </CopyBlock>

          {/* Minimal progress hint */}
          {!eligible && monthProgress > 0 && (
            <div className="rounded-xl border border-border/15 p-4 space-y-2 mt-2">
              <div className="flex items-center justify-between text-micro text-muted-foreground/40">
                <span>Signal detected</span>
                <span className="tabular-nums">{Math.min(monthProgress, 11)}/11</span>
              </div>
              <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/40 transition-all duration-700"
                  style={{ width: `${monthPercent}%` }}
                />
              </div>
            </div>
          )}
        </Section>
      </motion.div>

      <Divider />

      {/* FINAL FILTER */}
      <motion.div {...fade(0.42)}>
        <Section>
          <SectionLabel>Final Filter</SectionLabel>
          <CopyBlock>
            <p>If you are looking for:</p>
          </CopyBlock>
          <BulletList items={["ease", "clarity", "step-by-step guidance", "guaranteed outcomes"]} />
          <CopyBlock className="pt-2">
            <p className="text-foreground/80 font-medium">This system will reject you.</p>
          </CopyBlock>

          <CopyBlock className="pt-4">
            <p>If you are willing to:</p>
          </CopyBlock>
          <BulletList items={[
            "operate without instruction",
            "maintain long-term consistency",
            "accept loss as part of progression",
            "optimize for control instead of comfort",
          ]} />
          <CopyBlock className="pt-2">
            <p className="text-foreground/80 font-medium">You may proceed.</p>
          </CopyBlock>
        </Section>
      </motion.div>

      <Divider />

      {/* SUPERLAYER MODULES */}
      <motion.div {...fade(0.44)}>
        <SuperlayerModules eligible={eligible} />
      </motion.div>

      <Divider />

      {/* CTA */}
      <motion.div {...fade(0.48)} className="text-center space-y-4 pb-6">
        <CopyBlock className="!text-center">
          <p className="text-foreground/80 font-medium">
            Remain active.<br />
            Maintain discipline.<br />
            Return daily.
          </p>
          <p className="text-xs italic text-muted-foreground/30 pt-2">
            The system observes.
          </p>
        </CopyBlock>

        {eligible && (
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <Button asChild size="sm" className="h-8 text-xs gap-1.5">
              <Link to="/cusnir-os/map">
                <Map className="h-3 w-3" />
                System Map
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              <Link to="/cusnir-os/architecture">
                <FileText className="h-3 w-3" />
                Architecture Spec
              </Link>
            </Button>
          </div>
        )}

        {!eligible && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onNavigateCredits}
            >
              <Lock className="h-3 w-3" />
              Unlock — $9,992
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
