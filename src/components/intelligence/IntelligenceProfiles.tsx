import { useState } from "react";
import { useIntelligenceProfiles, usePersonDetail } from "@/hooks/useIntelligenceProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  User, Brain, Shield, MessageSquare, Target,
  ChevronRight, ArrowLeft, Users, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  cognitive: "bg-semantic-blue/10 text-semantic-blue",
  behavioral: "bg-semantic-amber/10 text-semantic-amber",
  rhetorical: "bg-semantic-purple/10 text-semantic-purple",
  strategic: "bg-semantic-emerald/10 text-semantic-emerald",
  emotional: "bg-semantic-rose/10 text-semantic-rose",
  risk: "bg-destructive/10 text-destructive",
};

const ENTITY_ICONS: Record<string, typeof User> = {
  host: User,
  guest: Users,
  brand: Target,
  organization: Shield,
};

export function IntelligenceProfiles() {
  const { persons, loading } = useIntelligenceProfiles();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (selectedPersonId) {
    return (
      <PersonDetailView
        personId={selectedPersonId}
        person={persons.find((p) => p.id === selectedPersonId)!}
        onBack={() => setSelectedPersonId(null)}
      />
    );
  }

  if (persons.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Brain className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold mb-1">Niciun profil intelligence</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Profilele se generează automat din analiza transcriptelor. Încarcă conținut în Extractor pentru a începe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{persons.length} persoane detectate</p>
      </div>
      {persons.map((person) => {
        const Icon = ENTITY_ICONS[person.entity_type] || User;
        return (
          <Card
            key={person.id}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedPersonId(person.id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{person.name}</span>
                  <Badge variant="outline" className="text-micro capitalize">{person.entity_type}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{person.statements_count} statements</span>
                  <span>·</span>
                  <span>Confidence: {Math.round((person.confidence ?? 0) * 100)}%</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PersonDetailView({
  personId,
  person,
  onBack,
}: {
  personId: string;
  person: { name: string; entity_type: string; statements_count?: number; confidence?: number; bio?: string | null };
  onBack: () => void;
}) {
  const { traits, dimensions, profile, loading } = usePersonDetail(personId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const positiveTraits = traits.filter((t) => t.polarity === "positive").sort((a, b) => b.score - a.score);
  const negativeTraits = traits.filter((t) => t.polarity === "negative").sort((a, b) => b.score - a.score);
  const neutralTraits = traits.filter((t) => t.polarity === "neutral").sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{person.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize text-xs">{person.entity_type}</Badge>
                <span className="text-xs text-muted-foreground">{person.statements_count} statements analizate</span>
                <span className="text-xs text-muted-foreground">· Confidence {Math.round((person.confidence ?? 0) * 100)}%</span>
              </div>
              {person.bio && <p className="text-sm text-muted-foreground mt-2">{person.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions Radar (simplified bar chart) */}
      {dimensions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Dimensiuni Personalitate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.dimension_id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{dim.name}</span>
                  <span className="text-muted-foreground">{Math.round(dim.score * 100)}%</span>
                </div>
                <Progress value={dim.score * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Traits by category */}
      {traits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Trăsături ({traits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {positiveTraits.length > 0 && (
                <TraitGroup label="Puncte forte" traits={positiveTraits} />
              )}
              {neutralTraits.length > 0 && (
                <TraitGroup label="Neutrale" traits={neutralTraits} />
              )}
              {negativeTraits.length > 0 && (
                <TraitGroup label="Riscuri" traits={negativeTraits} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile summary */}
      {profile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Profil Generat ({profile.profile_version})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.summary && (
              <p className="text-sm text-muted-foreground">{profile.summary}</p>
            )}
            {profile.strengths && Array.isArray(profile.strengths) && profile.strengths.length > 0 && (
              <div>
                <span className="text-xs font-medium text-status-validated">Puncte forte:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(profile.strengths as string[]).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-micro">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.risks && Array.isArray(profile.risks) && profile.risks.length > 0 && (
              <div>
                <span className="text-xs font-medium text-destructive">Riscuri:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(profile.risks as string[]).map((r, i) => (
                    <Badge key={i} variant="outline" className="text-micro border-destructive/30">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {traits.length === 0 && dimensions.length === 0 && !profile && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Niciun semnal intelligence detectat încă. Rulează o analiză de profil din Extractor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TraitGroup({ label, traits }: { label: string; traits: { code: string; name: string; category: string; score: number; signal_count: number }[] }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground mb-2 block">{label}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {traits.map((t) => (
          <div key={t.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Badge className={cn("text-micro capitalize shrink-0", CATEGORY_COLORS[t.category] || "")}>
              {t.category}
            </Badge>
            <span className="text-xs font-medium flex-1 truncate">{t.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round(t.score * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
