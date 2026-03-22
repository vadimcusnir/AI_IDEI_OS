/**
 * Landing Footer — matches obsidian/ivory/gold visual language.
 */
import { Link } from "react-router-dom";
import logo from "@/assets/logo.gif";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-[hsl(var(--gold-oxide))] transition-colors rounded">
      {children}
    </Link>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full" />
              <span className="text-sm font-bold tracking-tight text-foreground">AI-IDEI</span>
            </div>
            <p className="max-w-[200px] text-sm text-muted-foreground leading-relaxed">
              Practical AI for copywriting, marketing, and execution.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.12em] text-muted-foreground uppercase">Platform</h3>
            <ul className="space-y-2.5">
              <li><FooterLink to="/services">Services</FooterLink></li>
              <li><FooterLink to="/marketplace">Marketplace</FooterLink></li>
              <li><FooterLink to="/pipeline">Pipeline</FooterLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.12em] text-muted-foreground uppercase">Resources</h3>
            <ul className="space-y-2.5">
              <li><FooterLink to="/docs">Documentation</FooterLink></li>
              <li><FooterLink to="/knowledge">Knowledge Base</FooterLink></li>
              <li><FooterLink to="/changelog">Changelog</FooterLink></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.12em] text-muted-foreground uppercase">Community</h3>
            <ul className="space-y-2.5">
              <li><FooterLink to="/community">Forum</FooterLink></li>
              <li><FooterLink to="/topics">Topics</FooterLink></li>
              <li><FooterLink to="/feedback">Feedback</FooterLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-[0.12em] text-muted-foreground uppercase">Legal</h3>
            <ul className="space-y-2.5">
              <li><FooterLink to="/terms">Terms</FooterLink></li>
              <li><FooterLink to="/privacy">Privacy</FooterLink></li>
              <li><FooterLink to="/data-privacy">Data Privacy</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <span className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} AI-IDEI · From rough idea to persuasive asset.
          </span>
          <div className="flex items-center gap-6">
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/docs">Docs</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
