/**
 * CANONICAL GLOBAL FOOTER — components/global/Footer.tsx
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Single source of truth for all authenticated app pages.
 * 4-column grid: Brand | Platform | Resources | Legal
 * Not position:fixed — lives at end of content flow.
 * Uses only semantic tokens from design system.
 */

import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </Link>
  );
}

/* ─── Sub-columns ─── */

function BrandColumn() {
  return (
    <div className="space-y-3 col-span-2 lg:col-span-1">
      <div className="flex items-center gap-2">
        <Logo size="h-6 w-6" />
        <span className="text-lg font-bold tracking-tight">
          AI-<span className="text-primary">IDEI</span>
        </span>
      </div>
      <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
        Practical AI for copywriting, marketing, and execution. Turning knowledge into compounding digital assets.
      </p>
      <div className="text-xs text-muted-foreground/60 space-y-0.5 pt-1">
        <p className="font-medium text-muted-foreground/80">Cușnir Media SRL</p>
        <p>Republic of Moldova, r. Ocnița, s-tul Bîrlădeni</p>
        <p>Administrator: Vadim Cușnir</p>
      </div>
    </div>
  );
}

function PlatformColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Platform</h3>
      <ul className="space-y-2">
        <li><FooterLink to="/services">Services</FooterLink></li>
        <li><FooterLink to="/marketplace">Marketplace</FooterLink></li>
        <li><FooterLink to="/pipeline">Pipeline</FooterLink></li>
        <li><FooterLink to="/media/profiles">Media Profiles</FooterLink></li>
      </ul>
    </div>
  );
}

function ResourcesColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Resources</h3>
      <ul className="space-y-2">
        <li><FooterLink to="/docs">Documentation</FooterLink></li>
        <li><FooterLink to="/library">Knowledge Library</FooterLink></li>
        <li><FooterLink to="/architecture">Architecture</FooterLink></li>
        <li><FooterLink to="/changelog">Changelog</FooterLink></li>
        <li><FooterLink to="/onboarding">Getting Started</FooterLink></li>
      </ul>
    </div>
  );
}

function LegalColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Legal & Contact</h3>
      <ul className="space-y-2">
        <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
        <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
        <li><FooterLink to="/data-privacy">Data Privacy</FooterLink></li>
        <li>
          <a href="mailto:vadim.kusnir@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            vadim.kusnir@gmail.com
          </a>
        </li>
        <li>
          <a href="https://about.me/vadimcusnir" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            about.me/vadimcusnir
          </a>
        </li>
      </ul>
    </div>
  );
}

/* ─── Main Footer ─── */

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <BrandColumn />
          <PlatformColumn />
          <ResourcesColumn />
          <LegalColumn />
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span>© {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI. All rights reserved.</span>
            <span className="text-[10px] text-muted-foreground/60">
              MD: +373 79 236 493 · UA: +380 96 012 48 42 · RO: +40 750 257 375
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/docs">Docs</FooterLink>
            <a href="https://about.me/vadimcusnir" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
