/**
 * Footer — System/meta only. No operational elements. No nav duplication.
 * Purpose: legal, version, contact.
 */
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { ROUTES } from "@/config/routes";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <ContentBoundary width="wide" className="py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Left: brand + copyright */}
          <div className="flex items-center gap-2">
            <Logo size="h-4 w-4" />
            <span>© {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI</span>
          </div>

          {/* Center: legal links */}
          <div className="flex items-center gap-4">
            <Link to={ROUTES.TERMS} className="hover:text-foreground transition-colors">Terms</Link>
            <Link to={ROUTES.PRIVACY} className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to={ROUTES.DATA_PRIVACY} className="hover:text-foreground transition-colors">Data Privacy</Link>
            <Link to={ROUTES.DOCS} className="hover:text-foreground transition-colors">Docs</Link>
          </div>

          {/* Right: contact */}
          <a href="mailto:vadim.kusnir@gmail.com" className="hover:text-foreground transition-colors">
            vadim.kusnir@gmail.com
          </a>
        </div>
      </ContentBoundary>
    </footer>
  );
}
