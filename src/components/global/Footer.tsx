/**
 * CANONICAL GLOBAL FOOTER — components/global/Footer.tsx
 * 
 * SPEC RULES:
 * - Not position:fixed — end of flow, pushed by flex + min-h
 * - No variations between pages
 * - 4-column grid: Brand | Platform | Resources | Legal
 * - All tokens from design system (--foreground, --muted-foreground, etc.)
 * - Zero animations except hover:text-foreground on links
 * - No operational elements, no CTA, no nav duplication with sidebar
 */
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { ROUTES } from "@/config/routes";

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
        <Logo size="h-5 w-5" />
        <span className="text-sm font-bold tracking-tight text-foreground">
          AI-<span className="text-primary">IDEI</span>
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        Practical AI for copywriting, marketing, and execution. Knowledge → compounding digital assets.
      </p>
      <div className="text-xs text-muted-foreground/60 space-y-0.5 pt-1">
        <p className="font-medium text-muted-foreground/80">Cușnir Media SRL</p>
        <a href="mailto:vadim.kusnir@gmail.com" className="text-muted-foreground/80 hover:text-foreground transition-colors">
          vadim.kusnir@gmail.com
        </a>
      </div>
    </div>
  );
}

function PlatformColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Platform</h3>
      <ul className="space-y-2">
        <li><FooterLink to={ROUTES.SERVICES}>Services</FooterLink></li>
        <li><FooterLink to={ROUTES.MARKETPLACE}>Marketplace</FooterLink></li>
        <li><FooterLink to={ROUTES.PRICING}>Pricing</FooterLink></li>
        <li><FooterLink to={ROUTES.BLOG}>Blog</FooterLink></li>
      </ul>
    </div>
  );
}

function ResourcesColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Resources</h3>
      <ul className="space-y-2">
        <li><FooterLink to={ROUTES.DOCS}>Documentation</FooterLink></li>
        <li><FooterLink to={ROUTES.CHANGELOG}>Changelog</FooterLink></li>
        <li><FooterLink to={ROUTES.ABOUT}>About AI-IDEI</FooterLink></li>
        <li><ExtLink href="https://cusnirvadim.com">cusnirvadim.com</ExtLink></li>
      </ul>
    </div>
  );
}

function LegalColumn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Legal</h3>
      <ul className="space-y-2">
        <li><FooterLink to={ROUTES.TERMS}>Terms of Service</FooterLink></li>
        <li><FooterLink to={ROUTES.PRIVACY}>Privacy Policy</FooterLink></li>
        <li><FooterLink to={ROUTES.DATA_PRIVACY}>Data Privacy</FooterLink></li>
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <ContentBoundary width="wide" className="py-10">
        {/* 4-column grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <BrandColumn />
          <PlatformColumn />
          <ResourcesColumn />
          <LegalColumn />
        </div>

        {/* Bottom bar — copyright + quick legal links */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <FooterLink to={ROUTES.TERMS}>Terms</FooterLink>
            <FooterLink to={ROUTES.PRIVACY}>Privacy</FooterLink>
            <FooterLink to={ROUTES.ABOUT}>About</FooterLink>
          </div>
        </div>
      </ContentBoundary>
    </footer>
  );
}
