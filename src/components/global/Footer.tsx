import { Link } from "react-router-dom";
import logo from "@/assets/logo.gif";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="AI-IDEI" className="h-6 w-6 rounded-full" />
              <span className="text-lg font-bold tracking-tight">
                AI-<span className="text-primary">IDEI</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Platformă de capitalizare a expertizei prin AI — transformă cunoașterea în active digitale reutilizabile.
            </p>
          </div>

          {/* Pipeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/extractor">Extractor</FooterLink></li>
              <li><FooterLink to="/neurons">Neuroni</FooterLink></li>
              <li><FooterLink to="/services">Servicii AI</FooterLink></li>
              <li><FooterLink to="/library">Bibliotecă</FooterLink></li>
            </ul>
          </div>

          {/* Platformă */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Platformă</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/changelog">Changelog</FooterLink></li>
              <li><FooterLink to="/credits">Credite</FooterLink></li>
              <li><FooterLink to="/intelligence">Intelligence</FooterLink></li>
              <li><FooterLink to="/feedback">Feedback</FooterLink></li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Info</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/onboarding">Ghid începători</FooterLink></li>
              <li><FooterLink to="/architecture">Arhitectură</FooterLink></li>
              <li><FooterLink to="/links">Link-uri</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} AI-IDEI. Toate drepturile rezervate.</span>
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink to="/changelog">Changelog</FooterLink>
            <FooterLink to="/architecture">Arhitectură</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
