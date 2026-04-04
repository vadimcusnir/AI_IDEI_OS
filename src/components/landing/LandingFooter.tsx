/**
 * LANDING FOOTER — components/landing/LandingFooter.tsx
 * Marketing-variant footer for the landing page.
 * Uses routes from ROUTES registry. Semantic tokens only.
 */

import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { useTranslation } from "react-i18next";
import { ROUTES, NAV_GROUPS } from "@/config/routes";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-gold transition-colors duration-200 rounded inline-block">
      {children}
    </Link>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-gold transition-colors duration-200 rounded inline-block">
      {children}
    </a>
  );
}

export function LandingFooter() {
  const { t } = useTranslation("landing");

  return (
    <footer className="border-t border-border/50 bg-background" role="contentinfo">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-14 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-5 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-foreground">AI-IDEI</span>
            </div>
            <p className="max-w-[200px] text-sm text-muted-foreground leading-[1.65]">
              {t("footer.brand_desc")}
            </p>
            <div className="text-dense text-muted-foreground/50 space-y-0.5 pt-1">
              <p className="font-medium text-muted-foreground/70">Cușnir Media SRL</p>
              <p>Republic of Moldova, r. Ocnița</p>
              <a href="mailto:vadim.kusnir@gmail.com" className="text-muted-foreground/70 hover:text-foreground transition-colors">vadim.kusnir@gmail.com</a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-micro sm:text-dense font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.platform")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to={ROUTES.SERVICES}>{t("footer.services")}</FooterLink></li>
              <li><FooterLink to={ROUTES.MARKETPLACE}>{t("footer.marketplace")}</FooterLink></li>
              <li><FooterLink to={ROUTES.PRICING}>{t("footer.pricing", "Pricing")}</FooterLink></li>
              <li><FooterLink to={ROUTES.DOCS}>{t("footer.documentation")}</FooterLink></li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-micro sm:text-dense font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.about_section", "About")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to={ROUTES.ABOUT}>{t("footer.about_platform", "About AI-IDEI")}</FooterLink></li>
              <li><FooterLink to={ROUTES.ABOUT_VADIM}>{t("footer.about_vadim", "About Vadim Cușnir")}</FooterLink></li>
              <li><ExtLink href="https://cusnirvadim.com">cusnirvadim.com</ExtLink></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-micro sm:text-dense font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.community")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to={ROUTES.COMMUNITY}>{t("footer.forum")}</FooterLink></li>
              <li><FooterLink to={ROUTES.CHANGELOG}>{t("footer.changelog")}</FooterLink></li>
              <li><FooterLink to={ROUTES.BLOG}>Blog</FooterLink></li>
              <li><FooterLink to={ROUTES.FEEDBACK}>{t("footer.feedback")}</FooterLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-micro sm:text-dense font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.legal")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to={ROUTES.TERMS}>{t("footer.terms")}</FooterLink></li>
              <li><FooterLink to={ROUTES.PRIVACY}>{t("footer.privacy")}</FooterLink></li>
              <li><FooterLink to={ROUTES.DATA_PRIVACY}>{t("footer.data_privacy")}</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-8 sm:flex-row">
          <span className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI · {t("footer.copyright")}
          </span>
          <div className="flex items-center gap-6">
            <FooterLink to={ROUTES.TERMS}>{t("footer.terms")}</FooterLink>
            <FooterLink to={ROUTES.PRIVACY}>{t("footer.privacy")}</FooterLink>
            <FooterLink to={ROUTES.ABOUT}>About</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
