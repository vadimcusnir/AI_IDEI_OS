import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEN from "@/locales/en/common.json";
import navigationEN from "@/locales/en/navigation.json";
import errorsEN from "@/locales/en/errors.json";
import formsEN from "@/locales/en/forms.json";
import pagesEN from "@/locales/en/pages.json";

export const defaultNS = "common";
export const supportedLanguages = ["en"] as const;
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
