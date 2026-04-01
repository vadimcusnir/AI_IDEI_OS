import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import i18n from "i18next";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const t = (key: string, fallback: string) => {
        const val = i18n.t(`errors:${key}`);
        return val === `errors:${key}` ? fallback : val;
      };

      return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-1">
            {this.props.fallbackTitle || t("boundary_title", "Something went wrong")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t("boundary_description", "An unexpected error occurred. Please try again.")}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              {t("boundary_retry", "Try Again")}
            </Button>
            <Button size="sm" onClick={this.handleReload}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t("boundary_reload", "Reload Page")}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
