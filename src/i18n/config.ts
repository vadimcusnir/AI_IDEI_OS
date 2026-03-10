import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEN from "@/locales/en/common.json";
import navigationEN from "@/locales/en/navigation.json";
import errorsEN from "@/locales/en/errors.json";
import formsEN from "@/locales/en/forms.json";
import pagesEN from "@/locales/en/pages.json";
import architectureEN from "@/locales/en/architecture.json";
import landingEN from "@/locales/en/landing.json";

import commonRO from "@/locales/ro/common.json";
import navigationRO from "@/locales/ro/navigation.json";
import errorsRO from "@/locales/ro/errors.json";
import formsRO from "@/locales/ro/forms.json";
import pagesRO from "@/locales/ro/pages.json";
import architectureRO from "@/locales/ro/architecture.json";
import landingRO from "@/locales/ro/landing.json";

import commonRU from "@/locales/ru/common.json";
import navigationRU from "@/locales/ru/navigation.json";
import errorsRU from "@/locales/ru/errors.json";
import formsRU from "@/locales/ru/forms.json";
import pagesRU from "@/locales/ru/pages.json";
import architectureRU from "@/locales/ru/architecture.json";
import landingRU from "@/locales/ru/landing.json";

export const defaultNS = "common";
export const supportedLanguages = ["en", "ro", "ru"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: commonEN,
        navigation: navigationEN,
        errors: errorsEN,
        forms: formsEN,
        pages: pagesEN,
        architecture: architectureEN,
      },
      ro: {
        common: commonRO,
        navigation: navigationRO,
        errors: errorsRO,
        forms: formsRO,
        pages: pagesRO,
        architecture: architectureRO,
      },
      ru: {
        common: commonRU,
        navigation: navigationRU,
        errors: errorsRU,
        forms: formsRU,
        pages: pagesRU,
        architecture: architectureRU,
      },
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;
