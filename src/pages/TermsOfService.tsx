import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TermsOfService() {
  const { t } = useTranslation("pages");
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <SEOHead
        title="Terms of Service — AI-IDEI"
        description="Terms and conditions for using the AI-IDEI Knowledge OS platform."
        canonical="https://ai-idei-os.lovable.app/terms"
      />

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">{t("terms.title")}</h1>
      <p className="text-xs text-muted-foreground mb-8">{t("terms.last_updated")}</p>

      <article className="prose-content space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s1_title")}</h2>
          <p>{t("terms.s1_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s2_title")}</h2>
          <p>{t("terms.s2_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s3_title")}</h2>
          <p>{t("terms.s3_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s4_title")}</h2>
          <p>{t("terms.s4_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s5_title")}</h2>
          <p>{t("terms.s5_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s6_title")}</h2>
          <p>{t("terms.s6_intro")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>{t("terms.s6_item1")}</li>
            <li>{t("terms.s6_item2")}</li>
            <li>{t("terms.s6_item3")}</li>
            <li>{t("terms.s6_item4")}</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s7_title")}</h2>
          <p>{t("terms.s7_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s8_title")}</h2>
          <p>{t("terms.s8_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s9_title")}</h2>
          <p>{t("terms.s9_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s10_title")}</h2>
          <p>{t("terms.s10_text")}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("terms.s11_title")}</h2>
          <p>
            {t("terms.s11_text")}{" "}
            <Link to="/feedback" className="text-primary hover:underline">{t("terms.s11_link")}</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
