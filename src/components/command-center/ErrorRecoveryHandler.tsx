/**
 * CC-V03: Error Matrix + Recovery UX
 * Handles all error states in Command Center with user-friendly recovery options.
 */
import { AlertTriangle, RefreshCw, WifiOff, CreditCard, FileWarning, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type ErrorType =
  | "edge_timeout"
  | "aborted"
  | "reconnect_mid_stream"
  | "insufficient_credits"
  | "invalid_file"
  | "rate_limit"
  | "unknown_command"
  | "session_switch_active"
  | "unknown";

interface ErrorRecoveryProps {
  errorType: ErrorType;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

const ERROR_CONFIG: Record<ErrorType, {
  icon: typeof AlertTriangle;
  titleKey: string;
  descKey: string;
  recoverable: boolean;
  primaryAction?: string;
  primaryActionKey?: string;
}> = {
  edge_timeout: {
    icon: WifiOff,
    titleKey: "errors:edge_timeout_title",
    descKey: "errors:edge_timeout_desc",
    recoverable: true,
    primaryAction: "retry",
    primaryActionKey: "common:retry",
  },
  aborted: {
    icon: RefreshCw,
    titleKey: "errors:execution_aborted_title",
    descKey: "errors:execution_aborted_desc",
    recoverable: true,
    primaryAction: "retry",
    primaryActionKey: "common:try_again",
  },
  reconnect_mid_stream: {
    icon: WifiOff,
    titleKey: "errors:reconnect_mid_stream_title",
    descKey: "errors:reconnect_mid_stream_desc",
    recoverable: true,
    primaryAction: "retry",
    primaryActionKey: "common:retry",
  },
  insufficient_credits: {
    icon: CreditCard,
    titleKey: "errors:insufficient_credits_title",
    descKey: "errors:insufficient_credits_desc",
    recoverable: false,
    primaryAction: "navigate",
    primaryActionKey: "common:top_up",
  },
  invalid_file: {
    icon: FileWarning,
    titleKey: "errors:invalid_file_title",
    descKey: "errors:invalid_file_desc",
    recoverable: true,
    primaryAction: "dismiss",
    primaryActionKey: "common:dismiss",
  },
  session_switch_active: {
    icon: AlertTriangle,
    titleKey: "errors:session_switch_title",
    descKey: "errors:session_switch_desc",
    recoverable: true,
    primaryAction: "dismiss",
    primaryActionKey: "common:understood",
  },
  unknown: {
    icon: AlertTriangle,
    titleKey: "errors:unknown_error_title",
    descKey: "errors:unknown_error_desc",
    recoverable: true,
    primaryAction: "retry",
    primaryActionKey: "common:retry",
  },
};

export function ErrorRecoveryHandler({
  errorType,
  message,
  onRetry,
  onDismiss,
  onNavigate,
  className,
}: ErrorRecoveryProps) {
  const { t } = useTranslation(["errors", "common"]);
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.unknown;
  const Icon = config.icon;

  const handlePrimary = () => {
    if (config.primaryAction === "retry" && onRetry) onRetry();
    else if (config.primaryAction === "navigate" && onNavigate) onNavigate("/pricing");
    else if (config.primaryAction === "dismiss" && onDismiss) onDismiss();
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        "bg-destructive/5 border-destructive/20",
        className
      )}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          {t(config.titleKey, { defaultValue: errorType.replace(/_/g, " ") })}
        </p>
        <p className="text-xs text-muted-foreground">
          {message || t(config.descKey, { defaultValue: "An error occurred. Please try again." })}
        </p>
        <div className="flex items-center gap-2 pt-1">
          {config.primaryAction && (
            <Button
              variant={config.recoverable ? "default" : "outline"}
              size="sm"
              onClick={handlePrimary}
              className="h-7 text-xs gap-1.5"
            >
              {config.primaryAction === "navigate" && <ArrowRight className="h-3 w-3" />}
              {config.primaryAction === "retry" && <RefreshCw className="h-3 w-3" />}
              {t(config.primaryActionKey || "common:retry", { defaultValue: "Retry" })}
            </Button>
          )}
          {onDismiss && config.primaryAction !== "dismiss" && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-7 text-xs text-muted-foreground">
              {t("common:dismiss", { defaultValue: "Dismiss" })}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Classifies an error into an ErrorType for the recovery handler.
 */
export function classifyError(error: unknown): { type: ErrorType; message: string } {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { type: "aborted", message: "Execution was cancelled." };
  }

  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("timeout") || lower.includes("504") || lower.includes("gateway")) {
    return { type: "edge_timeout", message: msg };
  }
  if (lower.includes("insufficient") || lower.includes("credits") || lower.includes("balance")) {
    return { type: "insufficient_credits", message: msg };
  }
  if (lower.includes("file") || lower.includes("format") || lower.includes("unsupported")) {
    return { type: "invalid_file", message: msg };
  }
  if (lower.includes("network") || lower.includes("offline") || lower.includes("fetch")) {
    return { type: "reconnect_mid_stream", message: msg };
  }

  return { type: "unknown", message: msg };
}
