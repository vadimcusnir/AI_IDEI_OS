/**
 * ArtifactGrid — Grid of artifact cards with action buttons.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  FileText, Clock, Eye, Trash2, Lock, Globe, Store, ArrowRight,
  Download, Pencil, Zap,
} from "lucide-react";
import { VisibilityIcon } from "@/components/shared/AccessIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Artifact {
  id: string;
  title: string;
  artifact_type: string;
  format: string;
  content: string;
  status: string;
  tags: string[];
  service_key: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG: Record<string, { labelKey: string; color: string }> = {
  document: { labelKey: "artifacts.type_document", color: "bg-primary/10 text-primary" },
  article: { labelKey: "artifacts.type_article", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  script: { labelKey: "artifacts.type_script", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  framework: { labelKey: "artifacts.type_framework", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  course: { labelKey: "artifacts.type_course", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  social_post: { labelKey: "artifacts.type_social", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  copy: { labelKey: "artifacts.type_copy", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

const STATUS_KEYS: Record<string, { labelKey: string; dot: string }> = {
  draft: { labelKey: "library.status_draft", dot: "bg-muted-foreground/40" },
  final: { labelKey: "library.status_final", dot: "bg-primary" },
  published: { labelKey: "library.status_published", dot: "bg-status-validated" },
};

interface ArtifactGridProps {
  artifacts: Artifact[];
  showHeader?: boolean;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onPublish: (artifact: Artifact) => void;
}

function downloadArtifact(artifact: Artifact, fmt: "md" | "txt") {
  const ext = fmt === "md" ? "md" : "txt";
  const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artifact.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Descărcat ca .${ext}`);
}

export function ArtifactGrid({ artifacts, showHeader, onDelete, onToggleStatus, onPublish }: ArtifactGridProps) {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();

  return (
    <>
      {showHeader && artifacts.length > 0 && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <FileText className="h-3 w-3" /> Livrabile ({artifacts.length})
        </h3>
      )}
      {artifacts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-base font-bold mb-1">{t("library.no_artifacts")}</h2>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            {t("library.no_artifacts_hint")}
          </p>
          <Button size="sm" onClick={() => navigate("/services")} className="gap-2">
            {t("library.view_services")} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {artifacts.map(artifact => {
            const typeConf = TYPE_CONFIG[artifact.artifact_type];
            const typeLabel = typeConf ? t(typeConf.labelKey) : artifact.artifact_type;
            const typeColor = typeConf?.color || "bg-muted text-muted-foreground";
            const statusConf = STATUS_KEYS[artifact.status];
            const statusLabel = statusConf ? t(statusConf.labelKey) : artifact.status;
            const statusDot = statusConf?.dot || "bg-muted-foreground/40";

            return (
              <div
                key={artifact.id}
                className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer flex flex-col"
                onClick={() => navigate(`/library/${artifact.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-nano font-mono uppercase px-1.5 py-0.5 rounded", typeColor)}>
                      {typeLabel}
                    </span>
                    <VisibilityIcon visibility={artifact.status === "published" ? "public" : "private"} size="xs" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
                    <span className="text-nano text-muted-foreground">{statusLabel}</span>
                  </div>
                </div>

                <h3 className="text-sm font-medium mb-1.5 line-clamp-2">{artifact.title}</h3>
                <p className="text-dense text-muted-foreground line-clamp-3 mb-3 leading-relaxed flex-1">
                  {(artifact.content ?? "").slice(0, 150)}
                </p>

                {(artifact.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(artifact.tags ?? []).slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-nano px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {(artifact.tags ?? []).length > 3 && (
                      <span className="text-nano text-muted-foreground">+{(artifact.tags ?? []).length - 3}</span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1 pt-2.5 border-t border-border mt-auto">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); downloadArtifact(artifact, "md"); }}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-micro">Descarcă (.md)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); navigate(`/library/${artifact.id}`); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-micro">Editează</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/services?intent=${encodeURIComponent(artifact.title)}`);
                        }}>
                        <Zap className="h-3 w-3 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-micro">Folosește ca input</TooltipContent>
                  </Tooltip>

                  <div className="flex-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); onPublish(artifact); }}>
                        <Store className="h-3 w-3 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-micro">Publică în Marketplace</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(artifact.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-micro">Șterge</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-nano text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(artifact.updated_at), "dd MMM yyyy")}
                  </span>
                  {artifact.service_key && (
                    <span className="text-nano font-mono text-muted-foreground/50">
                      {artifact.service_key}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
