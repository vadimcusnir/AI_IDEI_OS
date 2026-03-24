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
    <footer className="border-t border-border/60 bg-background" role="contentinfo">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-foreground">AI-IDEI</span>
            </div>
            <p className="max-w-[200px] text-sm text-muted-foreground leading-[1.6]">
              {t("footer.brand_desc")}
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono tracking-[0.15em] text-muted-foreground uppercase">{t("footer.platform")}</h3>
            <ul className="space-y-3">
              <li><FooterLink to="/services">{t("footer.services")}</FooterLink></li>
              <li><FooterLink to="/marketplace">{t("footer.marketplace")}</FooterLink></li>
              <li><FooterLink to="/pipeline">{t("footer.pipeline")}</FooterLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono tracking-[0.15em] text-muted-foreground uppercase">{t("footer.resources")}</h3>
            <ul className="space-y-3">
              <li><FooterLink to="/docs">{t("footer.documentation")}</FooterLink></li>
              <li><FooterLink to="/knowledge">{t("footer.knowledge_base")}</FooterLink></li>
              <li><FooterLink to="/changelog">{t("footer.changelog")}</FooterLink></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono tracking-[0.15em] text-muted-foreground uppercase">{t("footer.community")}</h3>
            <ul className="space-y-3">
              <li><FooterLink to="/community">{t("footer.forum")}</FooterLink></li>
              <li><FooterLink to="/topics">{t("footer.topics")}</FooterLink></li>
              <li><FooterLink to="/feedback">{t("footer.feedback")}</FooterLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono tracking-[0.15em] text-muted-foreground uppercase">{t("footer.legal")}</h3>
            <ul className="space-y-3">
              <li><FooterLink to="/terms">{t("footer.terms")}</FooterLink></li>
              <li><FooterLink to="/privacy">{t("footer.privacy")}</FooterLink></li>
              <li><FooterLink to="/data-privacy">{t("footer.data_privacy")}</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-7 sm:flex-row">
          <span className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} AI-IDEI · {t("footer.copyright")}
          </span>
          <div className="flex items-center gap-6">
            <FooterLink to="/terms">{t("footer.terms")}</FooterLink>
            <FooterLink to="/privacy">{t("footer.privacy")}</FooterLink>
            <FooterLink to="/docs">{t("footer.docs")}</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
