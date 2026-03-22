import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-3 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <img src={logo} alt="AI-IDEI" className="h-6 w-6 rounded-full" />
              <span className="text-lg font-bold tracking-tight">
                AI-<span className="text-primary">IDEI</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              Intelligence extraction infrastructure — transforming knowledge into compounding digital assets.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/services">Services</FooterLink></li>
              <li><FooterLink to="/marketplace">Marketplace</FooterLink></li>
              <li><FooterLink to="/pipeline">Pipeline</FooterLink></li>
              <li><FooterLink to="/media/profiles">Media Profiles</FooterLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/docs">Documentation</FooterLink></li>
              <li><FooterLink to="/knowledge">Knowledge Base</FooterLink></li>
              <li><FooterLink to="/architecture">Architecture</FooterLink></li>
              <li><FooterLink to="/changelog">Changelog</FooterLink></li>
              <li><FooterLink to="/onboarding">Getting Started</FooterLink></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Community</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/community">Forum</FooterLink></li>
              <li><FooterLink to="/topics">Topics</FooterLink></li>
              <li><FooterLink to="/insights">Insights</FooterLink></li>
              <li><FooterLink to="/patterns">Patterns</FooterLink></li>
              <li><FooterLink to="/feedback">Feedback</FooterLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
              <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
              <li><FooterLink to="/data-privacy">Data Privacy</FooterLink></li>
              <li><FooterLink to="/links">Links</FooterLink></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} AI-IDEI. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/docs">Docs</FooterLink>
            <FooterLink to="/community">Community</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
