/**
 * CANONICAL GLOBAL FOOTER — components/global/Footer.tsx
 * Single source of truth for all authenticated app pages.
 * 4-column grid: Brand | Platform | About | Legal
 * Uses routes from ROUTES registry.
 */

import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { ROUTES, NAV_GROUPS } from "@/config/routes";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </Link>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </a>
  );
}

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
        <a href="mailto:vadim.kusnir@gmail.com" className="text-muted-foreground/80 hover:text-foreground transition-colors">vadim.kusnir@gmail.com</a>
      </div>
    </div>
  );
}

function PlatformColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Platform</h3>
      <ul className="space-y-2">
        {NAV_GROUPS.platform.map((item) => (
          <li key={item.to}><FooterLink to={item.to}>{item.label}</FooterLink></li>
        ))}
      </ul>
    </div>
  );
}

function AboutColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">About</h3>
      <ul className="space-y-2">
        {NAV_GROUPS.about.map((item, i) => (
          <li key={i}>
            {'external' in item ? (
              <ExtLink href={item.external}>{item.label}</ExtLink>
            ) : (
              <FooterLink to={item.to}>{item.label}</FooterLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Legal</h3>
      <ul className="space-y-2">
        {NAV_GROUPS.legal.map((item) => (
          <li key={item.to}><FooterLink to={item.to}>{item.label}</FooterLink></li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <ContentBoundary width="wide" className="py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <BrandColumn />
          <PlatformColumn />
          <AboutColumn />
          <LegalColumn />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink to={ROUTES.TERMS}>Terms</FooterLink>
            <FooterLink to={ROUTES.PRIVACY}>Privacy</FooterLink>
            <FooterLink to={ROUTES.ABOUT}>About</FooterLink>
          </div>
        </div>
      </ContentBoundary>
    </footer>
  );
}
