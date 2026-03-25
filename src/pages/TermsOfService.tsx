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
          <p className="mb-3">{t("terms.s11_text")}</p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
            <p className="font-semibold">{t("terms.s11_company")}</p>
            <p className="text-muted-foreground">{t("terms.s11_address")}</p>
            <p className="text-muted-foreground">{t("terms.s11_admin")}</p>
            <p className="text-muted-foreground">E-mail: <a href="mailto:vadim.kusnir@gmail.com" className="text-primary hover:underline">{t("terms.s11_email")}</a></p>
            <p className="text-muted-foreground">MD: {t("terms.s11_phone_md")} · UA: {t("terms.s11_phone_ua")} · RO: {t("terms.s11_phone_ro")}</p>
            <p className="text-muted-foreground mt-2">
              <Link to="/feedback" className="text-primary hover:underline">{t("terms.s11_link")}</Link>
              {" · "}
              <a href="https://about.me/vadimcusnir" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">about.me/vadimcusnir</a>
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
