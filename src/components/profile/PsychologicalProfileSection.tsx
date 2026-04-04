import { RadarChart } from "@/components/intelligence/RadarChart";
import { Brain, Eye, Heart, Shield, Zap, MessageCircle, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PsychologicalProfileData {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  analytical_thinking: number;
  emotional_tone: number;
  authenticity: number;
  clout: number;
  dominance: number;
  empathy: number;
  cognitive_complexity: number;
  confidence_level: number;
  communication_style: string | null;
  leadership_style: string | null;
  decision_style: string | null;
  persuasion_approach: string | null;
  risk_tolerance: string | null;
}

function ScoreBar({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <span className="text-compact font-medium text-foreground flex-1">{label}</span>
        <span className="text-dense font-bold tabular-nums text-primary">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/50 transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function InsightBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function PsychologicalProfileSection({ profile }: { profile: PsychologicalProfileData }) {
  const bigFiveData = [
    { label: "Openness", value: profile.openness },
    { label: "Conscientiousness", value: profile.conscientiousness },
    { label: "Extraversion", value: profile.extraversion },
    { label: "Agreeableness", value: profile.agreeableness },
    { label: "Neuroticism", value: profile.neuroticism },
  ];

  const liwcData = [
    { label: "Analytical", value: profile.analytical_thinking },
    { label: "Emotional Tone", value: profile.emotional_tone },
    { label: "Authenticity", value: profile.authenticity },
    { label: "Clout", value: profile.clout },
  ];

  return (
    <div className="space-y-8">
      {/* Big Five Radar */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Big Five Personality</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <RadarChart data={bigFiveData} size={240} />
          </div>
          <div className="flex-1 w-full space-y-3">
            <ScoreBar label="Openness" value={profile.openness} icon={Eye} color="text-primary" />
            <ScoreBar label="Conscientiousness" value={profile.conscientiousness} icon={Shield} color="text-primary/80" />
            <ScoreBar label="Extraversion" value={profile.extraversion} icon={Zap} color="text-primary/70" />
            <ScoreBar label="Agreeableness" value={profile.agreeableness} icon={Heart} color="text-primary/60" />
            <ScoreBar label="Neuroticism" value={profile.neuroticism} icon={TrendingUp} color="text-primary/50" />
          </div>
        </div>
      </div>

      {/* LIWC Metrics */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Linguistic Analysis (LIWC)</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <RadarChart data={liwcData} size={200} />
          </div>
          <div className="flex-1 w-full space-y-3">
            <ScoreBar label="Analytical Thinking" value={profile.analytical_thinking} icon={Brain} color="text-primary" />
            <ScoreBar label="Emotional Tone" value={profile.emotional_tone} icon={Heart} color="text-primary/80" />
            <ScoreBar label="Authenticity" value={profile.authenticity} icon={Shield} color="text-primary/70" />
            <ScoreBar label="Clout (Authority)" value={profile.clout} icon={Target} color="text-primary/60" />
          </div>
        </div>
      </div>

      {/* Communication Style Grid */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Profile Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InsightBadge label="Communication Style" value={profile.communication_style} />
          <InsightBadge label="Leadership Style" value={profile.leadership_style} />
          <InsightBadge label="Decision Style" value={profile.decision_style} />
          <InsightBadge label="Persuasion Approach" value={profile.persuasion_approach} />
          <InsightBadge label="Risk Tolerance" value={profile.risk_tolerance} />
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${profile.confidence_level}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary">{profile.confidence_level}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
