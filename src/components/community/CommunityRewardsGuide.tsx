import { Award, TrendingUp, CheckCircle2, MessageCircle, Coins, Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const KARMA_TIERS = [
  { min: 0, label: "Newcomer", color: "text-muted-foreground" },
  { min: 10, label: "Contributor", color: "text-info" },
  { min: 50, label: "Active Member", color: "text-primary" },
  { min: 150, label: "Expert", color: "text-status-validated" },
  { min: 500, label: "Legend", color: "text-graph-highlight" },
];

const REWARD_ACTIONS = [
  { action: "Create a thread", karma: "+1", neurons: "—", icon: MessageCircle },
  { action: "Post a reply", karma: "+1", neurons: "—", icon: MessageCircle },
  { action: "Receive an upvote", karma: "+1", neurons: "—", icon: TrendingUp },
  { action: "Your answer marked as Solution", karma: "+10", neurons: "+5 NEURONS", icon: CheckCircle2 },
  { action: "Receive a downvote", karma: "−1", neurons: "—", icon: TrendingUp },
];

export function CommunityRewardsGuide() {
  return (
    <Accordion type="single" collapsible className="mb-6">
      <AccordionItem value="rewards-guide" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            How Karma & NEURONS Rewards Work
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Karma explanation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Karma System</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Karma measures your community reputation. Earn it by contributing quality content,
                helping others, and receiving upvotes. Higher karma unlocks trust badges and visibility.
              </p>
              <div className="space-y-1.5">
                {KARMA_TIERS.map((tier) => (
                  <div key={tier.label} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className={`text-nano px-1.5 py-0 ${tier.color}`}>
                      {tier.min}+
                    </Badge>
                    <span className={`font-medium ${tier.color}`}>{tier.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rewards Per Action</h4>
              </div>
              <div className="space-y-1.5">
                {REWARD_ACTIONS.map((r) => (
                  <div key={r.action} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50">
                    <r.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-foreground">{r.action}</span>
                    <span className="font-mono text-micro text-muted-foreground w-8 text-right">{r.karma}</span>
                    <span className="font-mono text-micro text-primary font-medium w-20 text-right">{r.neurons}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 text-micro text-muted-foreground bg-primary/5 p-2 rounded">
                <ArrowUpRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Pro tip:</strong> When a thread author marks your reply as the accepted solution,
                  you earn <strong className="text-primary">+5 NEURONS</strong> (credits) plus <strong>+10 karma</strong>. Focus on helpful, detailed answers!
                </span>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
