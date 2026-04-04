/**
 * CANONICAL GLOBAL FOOTER — components/global/Footer.tsx
 * 
 * SPEC RULES:
 * - Not position:fixed — end of flow, pushed by flex + min-h
 * - 5-column grid on landing, 4-column on app
 * - All tokens from design system (--foreground, --muted-foreground, etc.)
 * - Zero animations except hover transitions on links
 * - No operational elements, no CTA, no nav duplication with sidebar
 * 
 * variant="landing" → wider spacing, i18n labels, 5 columns (Brand, Platform, About, Community, Legal)
 * variant="app"     → compact, 4 columns (Brand, Platform, Resources, Legal)
 */
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { ROUTES } from "@/config/routes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type FooterVariant = "app" | "landing";

interface FooterProps {
  variant?: FooterVariant;
}

function FooterLink({ to, children, landing }: { to: string; children: React.ReactNode; landing?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "text-sm text-muted-foreground transition-colors duration-200 rounded inline-block",
        landing ? "hover:text-gold" : "hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function ExtLink({ href, children, landing }: { href: string; children: React.ReactNode; landing?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-sm text-muted-foreground transition-colors duration-200 rounded inline-block",
        landing ? "hover:text-gold" : "hover:text-foreground"
      )}
    >
      {children}
    </a>
  );
}

function BrandColumn({ landing }: { landing: boolean }) {
  return (
    <div className={cn("space-y-3", landing ? "col-span-2 sm:col-span-2 lg:col-span-1 space-y-5" : "col-span-2 lg:col-span-1")}>
      <div className="flex items-center gap-2">
        <Logo size={landing ? "h-7 w-7" : "h-5 w-5"} />
        <span className={cn("font-bold tracking-tight text-foreground", landing ? "text-sm" : "text-sm")}>
          AI-<span className="text-primary">IDEI</span>
        </span>
      </div>
      <p className={cn("text-sm text-muted-foreground max-w-[220px]", landing ? "leading-[1.65]" : "leading-relaxed")}>
        Practical AI for copywriting, marketing, and execution. Knowledge → compounding digital assets.
      </p>
      <div className={cn("text-xs space-y-0.5", landing ? "text-muted-foreground/50 pt-1" : "text-muted-foreground/60 pt-1")}>
        <p className={cn("font-medium", landing ? "text-muted-foreground/70" : "text-muted-foreground/80")}>Cușnir Media SRL</p>
        {landing && <p>Republic of Moldova, r. Ocnița</p>}
        <a href="mailto:vadim.kusnir@gmail.com" className={cn(
          "hover:text-foreground transition-colors",
          landing ? "text-muted-foreground/70" : "text-muted-foreground/80"
        )}>
          vadim.kusnir@gmail.com
        </a>
      </div>
    </div>
  );
}

function SectionHeading({ children, landing }: { children: React.ReactNode; landing: boolean }) {
  return landing ? (
    <h3 className="text-dense font-mono tracking-[0.2em] text-muted-foreground uppercase">{children}</h3>
  ) : (
    <h3 className="text-sm font-semibold text-foreground">{children}</h3>
  );
}

export function Footer({ variant = "app" }: FooterProps) {
  const { t } = useTranslation("landing");
  const landing = variant === "landing";
  const L = landing;

  return (
    <footer
      className={cn(
        "border-t bg-background mt-auto",
        landing ? "border-border/50" : "border-border bg-card"
      )}
      role="contentinfo"
    >
      <div className={cn(
        "mx-auto px-5 sm:px-6",
        landing ? "max-w-5xl py-20 sm:py-28" : "max-w-7xl py-10"
      )}>
        {/* Grid */}
        <div className={cn(
          "grid gap-8",
          landing
            ? "grid-cols-1 xs:grid-cols-2 gap-14 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          <BrandColumn landing={L} />

          {/* Platform */}
          <div className={cn(landing ? "space-y-4" : "space-y-3")}>
            <SectionHeading landing={L}>{L ? t("footer.platform") : "Platform"}</SectionHeading>
            <ul className={cn(landing ? "space-y-3.5" : "space-y-2")}>
              <li><FooterLink to={ROUTES.SERVICES} landing={L}>{L ? t("footer.services") : "Services"}</FooterLink></li>
              <li><FooterLink to={ROUTES.MARKETPLACE} landing={L}>{L ? t("footer.marketplace") : "Marketplace"}</FooterLink></li>
              <li><FooterLink to={ROUTES.PRICING} landing={L}>{L ? t("footer.pricing", "Pricing") : "Pricing"}</FooterLink></li>
              <li><FooterLink to={ROUTES.DOCS} landing={L}>{L ? t("footer.documentation") : "Documentation"}</FooterLink></li>
            </ul>
          </div>

          {/* About (landing) / Resources (app) */}
          <div className={cn(landing ? "space-y-4" : "space-y-3")}>
            <SectionHeading landing={L}>{L ? t("footer.about_section", "About") : "Resources"}</SectionHeading>
            <ul className={cn(landing ? "space-y-3.5" : "space-y-2")}>
              <li><FooterLink to={ROUTES.ABOUT} landing={L}>{L ? t("footer.about_platform", "About AI-IDEI") : "About AI-IDEI"}</FooterLink></li>
              {landing && <li><FooterLink to={ROUTES.ABOUT_VADIM} landing={L}>{t("footer.about_vadim", "About Vadim Cușnir")}</FooterLink></li>}
              <li><ExtLink href="https://cusnirvadim.com" landing={L}>cusnirvadim.com</ExtLink></li>
              {!landing && <li><FooterLink to={ROUTES.CHANGELOG}>Changelog</FooterLink></li>}
            </ul>
          </div>

          {/* Community (landing only) */}
          {landing && (
            <div className="space-y-4">
              <SectionHeading landing={L}>{t("footer.community")}</SectionHeading>
              <ul className="space-y-3.5">
                <li><FooterLink to={ROUTES.COMMUNITY} landing={L}>{t("footer.forum")}</FooterLink></li>
                <li><FooterLink to={ROUTES.CHANGELOG} landing={L}>{t("footer.changelog")}</FooterLink></li>
                <li><FooterLink to={ROUTES.BLOG} landing={L}>Blog</FooterLink></li>
                <li><FooterLink to={ROUTES.FEEDBACK} landing={L}>{t("footer.feedback")}</FooterLink></li>
              </ul>
            </div>
          )}

          {/* Legal */}
          <div className={cn(landing ? "space-y-4" : "space-y-3")}>
            <SectionHeading landing={L}>{L ? t("footer.legal") : "Legal"}</SectionHeading>
            <ul className={cn(landing ? "space-y-3.5" : "space-y-2")}>
              <li><FooterLink to={ROUTES.TERMS} landing={L}>{L ? t("footer.terms") : "Terms of Service"}</FooterLink></li>
              <li><FooterLink to={ROUTES.PRIVACY} landing={L}>{L ? t("footer.privacy") : "Privacy Policy"}</FooterLink></li>
              <li><FooterLink to={ROUTES.DATA_PRIVACY} landing={L}>{L ? t("footer.data_privacy") : "Data Privacy"}</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={cn(
          "flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row",
          landing ? "mt-20 border-border/30 pt-8" : "mt-8 border-border/60"
        )}>
          <span className={cn("font-mono text-muted-foreground", landing ? "text-xs" : "text-xs")}>
            © {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI{!landing && ". All rights reserved."}
            {landing && ` · ${t("footer.copyright")}`}
          </span>
          <div className="flex items-center gap-4 sm:gap-6">
            <FooterLink to={ROUTES.TERMS} landing={L}>{L ? t("footer.terms") : "Terms"}</FooterLink>
            <FooterLink to={ROUTES.PRIVACY} landing={L}>{L ? t("footer.privacy") : "Privacy"}</FooterLink>
            <FooterLink to={ROUTES.ABOUT} landing={L}>About</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
