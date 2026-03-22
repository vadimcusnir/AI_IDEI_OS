import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation("pages");
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <SEOHead
        title="Privacy Policy — AI-IDEI"
        description="How AI-IDEI collects, uses, and protects your personal data."
        canonical="https://ai-idei-os.lovable.app/privacy"
      />

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">{t("privacy.title")}</h1>
      <p className="text-xs text-muted-foreground mb-8">{t("privacy.last_updated")}</p>

      <article className="prose-custom space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s1_title")}</h2>
          <p>{t("privacy.s1_intro")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>{t("privacy.s1_account")}</strong></li>
            <li><strong>{t("privacy.s1_content")}</strong></li>
            <li><strong>{t("privacy.s1_usage")}</strong></li>
          </ul>
          <p className="mt-2">{t("privacy.s1_auto")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s2_title")}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("privacy.s2_item1")}</li>
            <li>{t("privacy.s2_item2")}</li>
            <li>{t("privacy.s2_item3")}</li>
            <li>{t("privacy.s2_item4")}</li>
            <li>{t("privacy.s2_item5")}</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s3_title")}</h2>
          <p>{t("privacy.s3_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s4_title")}</h2>
          <p>{t("privacy.s4_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s5_title")}</h2>
          <p>{t("privacy.s5_intro")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>{t("privacy.s5_item1")}</strong></li>
            <li><strong>{t("privacy.s5_item2")}</strong></li>
            <li><strong>{t("privacy.s5_item3")}</strong></li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s6_title")}</h2>
          <p>{t("privacy.s6_intro")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>{t("privacy.s6_item1")}</li>
            <li>{t("privacy.s6_item2")}</li>
            <li>{t("privacy.s6_item3")}</li>
            <li>{t("privacy.s6_item4")}</li>
            <li>{t("privacy.s6_item5")}</li>
          </ul>
          <p className="mt-2">
            {t("privacy.s6_contact")}{" "}
            <Link to="/feedback" className="text-primary hover:underline">{t("privacy.s6_link")}</Link>.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s7_title")}</h2>
          <p>{t("privacy.s7_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s8_title")}</h2>
          <p>{t("privacy.s8_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s9_title")}</h2>
          <p>{t("privacy.s9_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("privacy.s10_title")}</h2>
          <p>{t("privacy.s10_text")}</p>
        </section>
      </article>
    </div>
  );
}
