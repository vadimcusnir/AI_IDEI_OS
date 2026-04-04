import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentGateProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  /** Number of characters to show before blurring */
  previewLength?: number;
}

/**
 * Visual content gate — shows blurred content with a CTA to sign up.
 * Does NOT require email unlock — just authentication.
 */
export function ContentGate({ children, isAuthenticated, previewLength = 1500 }: ContentGateProps) {
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Visible preview portion */}
      <div className="overflow-hidden" style={{ maxHeight: "600px" }}>
        {children}
      </div>

      {/* Blur overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 85%)",
        }}
      />

      {/* CTA overlay */}
      <div className="relative -mt-32 flex flex-col items-center gap-4 py-12 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          Continue Reading
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Create a free account to unlock the full article, access all blog posts, and explore AI-powered knowledge extraction tools.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/auth">Sign Up Free</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
