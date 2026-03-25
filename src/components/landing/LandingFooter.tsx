/**
 * LANDING FOOTER — components/landing/LandingFooter.tsx
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Marketing-variant footer for the landing page.
 * Same data structure as global Footer but with landing aesthetics.
 * Uses semantic tokens only. No fixed positioning.
 */

import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { useTranslation } from "react-i18next";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground hover:text-[hsl(var(--gold-oxide))] transition-colors rounded">
      {children}
    </Link>
  );
}

export function LandingFooter() {
  const { t } = useTranslation("landing");

  return (
    <footer className="border-t border-border/50 bg-background" role="contentinfo">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-5 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-foreground">AI-IDEI</span>
            </div>
            <p className="max-w-[200px] text-sm text-muted-foreground leading-[1.65]">
              {t("footer.brand_desc")}
            </p>
            <div className="text-[11px] text-muted-foreground/50 space-y-0.5 pt-1">
              <p className="font-medium text-muted-foreground/70">Cușnir Media SRL</p>
              <p>Republic of Moldova, r. Ocnița</p>
              <p>Administrator: Vadim Cușnir</p>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.platform")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to="/services">{t("footer.services")}</FooterLink></li>
              <li><FooterLink to="/marketplace">{t("footer.marketplace")}</FooterLink></li>
              <li><FooterLink to="/pipeline">{t("footer.pipeline")}</FooterLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.resources")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to="/docs">{t("footer.documentation")}</FooterLink></li>
              <li><FooterLink to="/knowledge">{t("footer.knowledge_base")}</FooterLink></li>
              <li><FooterLink to="/changelog">{t("footer.changelog")}</FooterLink></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.community")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to="/community">{t("footer.forum")}</FooterLink></li>
              <li><FooterLink to="/topics">{t("footer.topics")}</FooterLink></li>
              <li><FooterLink to="/feedback">{t("footer.feedback")}</FooterLink></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{t("footer.legal")}</h3>
            <ul className="space-y-3.5">
              <li><FooterLink to="/terms">{t("footer.terms")}</FooterLink></li>
              <li><FooterLink to="/privacy">{t("footer.privacy")}</FooterLink></li>
              <li><FooterLink to="/data-privacy">{t("footer.data_privacy")}</FooterLink></li>
              <li>
                <a href="mailto:vadim.kusnir@gmail.com" className="text-sm text-muted-foreground hover:text-[hsl(var(--gold-oxide))] transition-colors">
                  E-mail
                </a>
              </li>
              <li>
                <a href="https://about.me/vadimcusnir" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[hsl(var(--gold-oxide))] transition-colors">
                  about.me
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-8 sm:flex-row">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-xs font-mono text-muted-foreground">
              © {new Date().getFullYear()} Cușnir Media SRL · AI-IDEI · {t("footer.copyright")}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              MD: +373 79 236 493 · UA: +380 96 012 48 42 · RO: +40 750 257 375
            </span>
          </div>
          <div className="flex items-center gap-6">
            <FooterLink to="/terms">{t("footer.terms")}</FooterLink>
            <FooterLink to="/privacy">{t("footer.privacy")}</FooterLink>
            <a href="https://about.me/vadimcusnir" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[hsl(var(--gold-oxide))] transition-colors rounded">
              About
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
