import { useTranslation } from "react-i18next";
import { useStorageUsage, formatBytes } from "@/hooks/useStorageUsage";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HardDrive, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StorageUsagePanel() {
  const { t } = useTranslation("common");
  const {
    buckets,
    totalBytes,
    totalFiles,
    limit,
    usagePercent,
    filesPercent,
    loading,
  } = useStorageUsage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent >= 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <HardDrive className="h-4 w-4 text-primary" />
          {t("storage.title")}
        </h3>
        {isNearLimit && (
          <Badge variant="destructive" className="text-[9px] gap-1">
            <AlertTriangle className="h-3 w-3" />
            {isOverLimit ? t("storage.limit_reached") : t("storage.almost_full")}
          </Badge>
        )}
      </div>

      {/* Main usage bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("storage.space_used")}</span>
          <span className="font-mono font-medium">
            {formatBytes(totalBytes)} / {limit ? formatBytes(limit.max_bytes) : "—"}
          </span>
        </div>
        <Progress
          value={usagePercent}
          className={cn("h-2", isOverLimit && "[&>div]:bg-destructive", isNearLimit && !isOverLimit && "[&>div]:bg-amber-500")}
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{usagePercent.toFixed(1)}% {t("storage.used_pct")}</span>
          <span>{totalFiles} {t("storage.files")}{limit ? ` / ${limit.max_files.toLocaleString()} max` : ""}</span>
        </div>
      </div>

      {/* Files progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" /> {t("storage.files")}
          </span>
          <span className="font-mono text-[11px]">{filesPercent.toFixed(1)}%</span>
        </div>
        <Progress value={filesPercent} className="h-1.5" />
      </div>

      {/* Per-bucket breakdown */}
      {buckets.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {t("storage.per_bucket")}
          </span>
          {buckets.map((b) => (
            <div
              key={b.bucket_id}
              className="flex items-center justify-between text-[11px] py-1"
            >
              <span className="text-muted-foreground truncate max-w-[140px]">
                {b.bucket_id}
              </span>
              <div className="flex items-center gap-2 text-foreground">
                <span className="font-mono">{formatBytes(b.total_bytes)}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {b.file_count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
