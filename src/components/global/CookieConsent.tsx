import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "ai-idei-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 p-4 sm:p-0",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <div className="mx-auto max-w-lg sm:mb-4 rounded-xl border border-border bg-card shadow-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">🍪 Cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management.
              No third-party advertising cookies.{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={accept} className="h-7 text-xs px-3">
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={decline}
                className="h-7 text-xs px-3 text-muted-foreground"
              >
                Decline
              </Button>
            </div>
          </div>
          <button
            onClick={decline}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
