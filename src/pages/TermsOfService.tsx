import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FileText, Scale, Shield, Users, Coins, Ban, Bot, AlertTriangle, XCircle, RefreshCw, Mail, ArrowRight } from "lucide-react";

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
          ? "border-[hsl(var(--gold-oxide)/0.3)] bg-[hsl(var(--gold-oxide)/0.04)]"
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

export default function TermsOfService() {
  const { t } = useTranslation("pages");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEOHead
        title="Terms of Service — AI-IDEI"
        description="Terms and conditions for using the AI-IDEI Knowledge OS platform. EU-compliant, clear and transparent."
        canonical="https://ai-idei.com/terms"
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {t("terms.legal_doc")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{t("terms.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("terms.last_updated")}</p>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-foreground leading-relaxed">{t("terms.intro_summary")}</p>
        </div>
      </motion.div>

      {/* Sections */}
      <div className="space-y-4">
        <Section icon={<FileText className="h-4 w-4" />} number="01" title={t("terms.s1_title")} index={0}>
          <p>{t("terms.s1_text")}</p>
        </Section>

        <Section icon={<Bot className="h-4 w-4" />} number="02" title={t("terms.s2_title")} index={1}>
          <p>{t("terms.s2_text")}</p>
        </Section>

        <Section icon={<Users className="h-4 w-4" />} number="03" title={t("terms.s3_title")} index={2}>
          <p>{t("terms.s3_text")}</p>
          <p>{t("terms.s3_text2")}</p>
        </Section>

        <Section icon={<Shield className="h-4 w-4" />} number="04" title={t("terms.s4_title")} index={3} accent>
          <p>{t("terms.s4_text")}</p>
          <p className="text-foreground font-medium">{t("terms.s4_highlight")}</p>
        </Section>

        <Section icon={<Coins className="h-4 w-4" />} number="05" title={t("terms.s5_title")} index={4}>
          <p>{t("terms.s5_text")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>{t("terms.s5_item1")}</li>
            <li>{t("terms.s5_item2")}</li>
            <li>{t("terms.s5_item3")}</li>
          </ul>
        </Section>

        <Section icon={<Ban className="h-4 w-4" />} number="06" title={t("terms.s6_title")} index={5}>
          <p>{t("terms.s6_intro")}</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>{t("terms.s6_item1")}</li>
            <li>{t("terms.s6_item2")}</li>
            <li>{t("terms.s6_item3")}</li>
            <li>{t("terms.s6_item4")}</li>
          </ul>
        </Section>

        <Section icon={<Bot className="h-4 w-4" />} number="07" title={t("terms.s7_title")} index={6}>
          <p>{t("terms.s7_text")}</p>
          <p>{t("terms.s7_text2")}</p>
        </Section>

        <Section icon={<AlertTriangle className="h-4 w-4" />} number="08" title={t("terms.s8_title")} index={7}>
          <p>{t("terms.s8_text")}</p>
          <p>{t("terms.s8_text2")}</p>
        </Section>

        <Section icon={<XCircle className="h-4 w-4" />} number="09" title={t("terms.s9_title")} index={8}>
          <p>{t("terms.s9_text")}</p>
        </Section>

        <Section icon={<RefreshCw className="h-4 w-4" />} number="10" title={t("terms.s10_title")} index={9}>
          <p>{t("terms.s10_text")}</p>
        </Section>

        <Section icon={<Scale className="h-4 w-4" />} number="11" title={t("terms.s11_title")} index={10}>
          <p>{t("terms.s11_text")}</p>
        </Section>

        {/* Contact Card */}
        <motion.div
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="rounded-xl border border-[hsl(var(--gold-oxide)/0.25)] bg-[hsl(var(--gold-oxide)/0.04)] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-[hsl(var(--gold-oxide))] mt-0.5" />
            <div>
              <h2 className="text-base font-semibold mb-3">{t("terms.s12_title")}</h2>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-foreground">{t("terms.s12_company")}</p>
                <p className="text-muted-foreground">{t("terms.s12_address")}</p>
                <p className="text-muted-foreground">{t("terms.s12_admin")}</p>
                <p className="text-muted-foreground">
                  E-mail:{" "}
                  <a href="mailto:vadim.kusnir@gmail.com" className="text-primary hover:underline">
                    vadim.kusnir@gmail.com
                  </a>
                </p>
                <p className="text-muted-foreground text-xs">
                  MD: +373 79 236 493 · UA: +380 96 012 48 42 · RO: +40 750 257 375
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Link to="/privacy" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {t("terms.see_privacy")} <ArrowRight className="h-3 w-3" />
                </Link>
                <Link to="/data-privacy" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {t("terms.see_data")} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
