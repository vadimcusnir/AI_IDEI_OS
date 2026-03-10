import { Link } from "react-router-dom";
import logo from "@/assets/logo.gif";

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

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Docs</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/docs">Documentation</FooterLink></li>
              <li><FooterLink to="/docs/foundation/neuron-model">Neuron Model</FooterLink></li>
              <li><FooterLink to="/docs/pipeline/transcript-refinery">Pipeline</FooterLink></li>
              <li><FooterLink to="/docs/architecture/knowledge-graph">Architecture</FooterLink></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Assets</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/insights">Insights</FooterLink></li>
              <li><FooterLink to="/patterns">Patterns</FooterLink></li>
              <li><FooterLink to="/formulas">Formulas</FooterLink></li>
              <li><FooterLink to="/contradictions">Contradictions</FooterLink></li>
              <li><FooterLink to="/applications">Applications</FooterLink></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/profiles">Profiles</FooterLink></li>
              <li><FooterLink to="/topics">Topics</FooterLink></li>
              <li><FooterLink to="/services">Services</FooterLink></li>
              <li><FooterLink to="/changelog">Changelog</FooterLink></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Info</h3>
            <ul className="space-y-2">
              <li><FooterLink to="/onboarding">Getting Started</FooterLink></li>
              <li><FooterLink to="/applications">Applications</FooterLink></li>
              <li><FooterLink to="/links">Links</FooterLink></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} AI-IDEI. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink to="/docs">Docs</FooterLink>
            <FooterLink to="/changelog">Changelog</FooterLink>
            <FooterLink to="/architecture">Architecture</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
