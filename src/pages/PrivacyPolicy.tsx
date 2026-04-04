import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ShieldCheck, Database, Cog, Lock, Share2, Scale, Cookie,
  Clock, Baby, RefreshCw, Mail, ArrowRight,
} from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface SectionProps {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
  index: number;
  accent?: boolean;
}

function Section({ icon, number, title, children, index, accent }: SectionProps) {
  return (
    <motion.section
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={sectionVariants}
      className={`relative rounded-xl border p-5 sm:p-6 transition-colors ${
        accent
          ? "border-primary/20 bg-primary/[0.03]"
          : "border-border bg-card/60"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{number}</span>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
        </div>
      </div>
      <div className="pl-11 text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </motion.section>
  );
}

export default function PrivacyPolicy() {
  const { t } = useTranslation("pages");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEOHead
        title="Privacy Policy — AI-IDEI"
        description="How AI-IDEI collects, uses, and protects your personal data. GDPR compliant."
        canonical="https://ai-idei.com/privacy"
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {t("privacy.legal_doc")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{t("privacy.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("privacy.last_updated")}</p>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-foreground leading-relaxed">{t("privacy.intro_summary")}</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        <Section icon={<Database className="h-4 w-4" />} number="01" title={t("privacy.s1_title")} index={0}>
          <p>{t("privacy.s1_intro")}</p>
          <ul className="space-y-2 mt-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s1_account_label")}</strong> {t("privacy.s1_account")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s1_content_label")}</strong> {t("privacy.s1_content")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s1_usage_label")}</strong> {t("privacy.s1_usage")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s1_technical_label")}</strong> {t("privacy.s1_auto")}</span>
            </li>
          </ul>
        </Section>

        <Section icon={<Cog className="h-4 w-4" />} number="02" title={t("privacy.s2_title")} index={1}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("privacy.s2_item1")}</li>
            <li>{t("privacy.s2_item2")}</li>
            <li>{t("privacy.s2_item3")}</li>
            <li>{t("privacy.s2_item4")}</li>
            <li>{t("privacy.s2_item5")}</li>
          </ul>
        </Section>

        <Section icon={<Cog className="h-4 w-4" />} number="03" title={t("privacy.s3_title")} index={2}>
          <p>{t("privacy.s3_text")}</p>
          <p className="text-foreground font-medium">{t("privacy.s3_highlight")}</p>
        </Section>

        <Section icon={<Lock className="h-4 w-4" />} number="04" title={t("privacy.s4_title")} index={3} accent>
          <p>{t("privacy.s4_text")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>{t("privacy.s4_measure1")}</li>
            <li>{t("privacy.s4_measure2")}</li>
            <li>{t("privacy.s4_measure3")}</li>
          </ul>
        </Section>

        <Section icon={<Share2 className="h-4 w-4" />} number="05" title={t("privacy.s5_title")} index={4}>
          <p>{t("privacy.s5_intro")}</p>
          <ul className="space-y-2 mt-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s5_provider_label")}</strong> {t("privacy.s5_item1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s5_payment_label")}</strong> {t("privacy.s5_item2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">{t("privacy.s5_law_label")}</strong> {t("privacy.s5_item3")}</span>
            </li>
          </ul>
        </Section>

        <Section icon={<Scale className="h-4 w-4" />} number="06" title={t("privacy.s6_title")} index={5} accent>
          <p>{t("privacy.s6_intro")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>{t(`privacy.s6_item${i}`)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2">
            {t("privacy.s6_contact")}{" "}
            <Link to="/data-privacy" className="text-primary hover:underline font-medium">{t("privacy.s6_link")}</Link>.
          </p>
        </Section>

        <Section icon={<Cookie className="h-4 w-4" />} number="07" title={t("privacy.s7_title")} index={6}>
          <p>{t("privacy.s7_text")}</p>
          <p>{t("privacy.s7_text2")}</p>
        </Section>

        <Section icon={<Clock className="h-4 w-4" />} number="08" title={t("privacy.s8_title")} index={7}>
          <p>{t("privacy.s8_text")}</p>
        </Section>

        <Section icon={<Baby className="h-4 w-4" />} number="09" title={t("privacy.s9_title")} index={8}>
          <p>{t("privacy.s9_text")}</p>
        </Section>

        <Section icon={<RefreshCw className="h-4 w-4" />} number="10" title={t("privacy.s10_title")} index={9}>
          <p>{t("privacy.s10_text")}</p>
        </Section>

        {/* Contact Card */}
        <motion.div
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="rounded-xl border border-[hsl(var(--gold-oxide)/0.25)] bg-[hsl(var(--gold-oxide)/0.04)] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-[hsl(var(--gold-oxide))] mt-0.5" />
            <div>
              <h2 className="text-base font-semibold mb-3">{t("privacy.s11_title")}</h2>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-foreground">{t("privacy.s11_company")}</p>
                <p className="text-muted-foreground">{t("privacy.s11_address")}</p>
                <p className="text-muted-foreground">{t("privacy.s11_admin")}</p>
                <p className="text-muted-foreground">
                  E-mail:{" "}
                  <a href="mailto:vadim.kusnir@gmail.com" className="text-primary hover:underline">
                    vadim.kusnir@gmail.com
                  </a>
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Link to="/terms" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {t("privacy.see_terms")} <ArrowRight className="h-3 w-3" />
                </Link>
                <Link to="/data-privacy" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {t("privacy.see_data")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
