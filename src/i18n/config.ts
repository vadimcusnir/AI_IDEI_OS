import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Eagerly load EN (default language) — all namespaces
import commonEN from "@/locales/en/common.json";
import navigationEN from "@/locales/en/navigation.json";
import errorsEN from "@/locales/en/errors.json";
import formsEN from "@/locales/en/forms.json";
import pagesEN from "@/locales/en/pages.json";
import architectureEN from "@/locales/en/architecture.json";
import landingEN from "@/locales/en/landing.json";

export const defaultNS = "common";
export const supportedLanguages = ["en", "ro", "ru"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const allNamespaces = ["common", "navigation", "errors", "forms", "pages", "architecture", "landing"] as const;

// Track loaded languages
const loadedLanguages = new Set(["en"]);

/**
 * Load all namespace bundles for a given language.
 * Returns true if successfully loaded.
 */
async function loadLanguageBundles(lng: string): Promise<boolean> {
  if (lng === "en" || loadedLanguages.has(lng)) return true;

  try {
    const bundles = await Promise.all(
      allNamespaces.map(async (ns) => {
        const mod = await import(`../locales/${lng}/${ns}.json`);
        return { ns, data: mod.default };
      })
    );

    bundles.forEach(({ ns, data }) => {
      i18n.addResourceBundle(lng, ns, data, true, true);
    });

    loadedLanguages.add(lng);
    return true;
  } catch (e) {
    console.warn(`Failed to load locale: ${lng}`, e);
    return false;
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    ns: [...allNamespaces],
    interpolation: { escapeValue: false },
    partialBundledLanguages: true,
    resources: {
      en: {
        common: commonEN,
        navigation: navigationEN,
        errors: errorsEN,
        forms: formsEN,
        pages: pagesEN,
        architecture: architectureEN,
        landing: landingEN,
      },
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

// Lazy-load RO/RU namespaces when language changes
i18n.on("languageChanged", (lng) => {
  loadLanguageBundles(lng);
});

// Pre-load detected language before first render
const detectedLng = i18n.language?.split("-")[0];

/**
 * Promise that resolves when the initial language is fully loaded.
 * Import this in main.tsx to await before rendering.
 */
export const i18nReady: Promise<void> = (async () => {
  if (detectedLng && detectedLng !== "en" && supportedLanguages.includes(detectedLng as SupportedLanguage)) {
    await loadLanguageBundles(detectedLng);
    // Now change language after bundles are loaded (no flash of untranslated keys)
    await i18n.changeLanguage(detectedLng);
  }
})();

export default i18n;
