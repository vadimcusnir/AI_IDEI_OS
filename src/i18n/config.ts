import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Only eagerly load the default language (EN) common namespace for instant render
import commonEN from "@/locales/en/common.json";
import navigationEN from "@/locales/en/navigation.json";
import landingEN from "@/locales/en/landing.json";

export const defaultNS = "common";
export const supportedLanguages = ["en", "ro", "ru"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const namespaces = ["common", "navigation", "errors", "forms", "pages", "architecture", "landing"] as const;

// Lazy loader for non-default locale bundles
const lazyLoadResource = async (lng: string, ns: string) => {
  const mod = await import(`../locales/${lng}/${ns}.json`);
  return mod.default;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    ns: [...namespaces],
    interpolation: { escapeValue: false },
    // Only bundle EN critical namespaces; rest loaded on demand
    resources: {
      en: {
        common: commonEN,
        navigation: navigationEN,
        landing: landingEN,
      },
    },
    partialBundledLanguages: true,
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

// Lazy-load missing namespaces on demand
i18n.on("missingKey", () => {}); // suppress warnings during load

const loadedBundles = new Set(["en:common", "en:navigation", "en:landing"]);

i18n.services.resourceStore.on("added", () => {});

// Hook into i18n to load bundles when needed
const originalLoadNamespaces = i18n.loadNamespaces.bind(i18n);
i18n.loadNamespaces = async (ns: string | string[]) => {
  const nsList = Array.isArray(ns) ? ns : [ns];
  const lng = i18n.language || "en";
  
  const toLoad = nsList.filter(n => !loadedBundles.has(`${lng}:${n}`));
  
  await Promise.all(
    toLoad.map(async (n) => {
      try {
        const data = await lazyLoadResource(lng, n);
        i18n.addResourceBundle(lng, n, data, true, true);
        loadedBundles.add(`${lng}:${n}`);
      } catch {
        // Fallback silently — EN is always available
      }
    })
  );
  
  return originalLoadNamespaces(ns);
};

// When language changes, load all active namespaces for the new language
i18n.on("languageChanged", async (lng) => {
  if (lng === "en") {
    // Load remaining EN namespaces that weren't eagerly loaded
    const missing = namespaces.filter(n => !loadedBundles.has(`en:${n}`));
    await Promise.all(
      missing.map(async (n) => {
        try {
          const data = await lazyLoadResource("en", n);
          i18n.addResourceBundle("en", n, data, true, true);
          loadedBundles.add(`en:${n}`);
        } catch {}
      })
    );
    return;
  }
  
  // Load all namespaces for the new language
  await Promise.all(
    namespaces.map(async (n) => {
      if (loadedBundles.has(`${lng}:${n}`)) return;
      try {
        const data = await lazyLoadResource(lng, n);
        i18n.addResourceBundle(lng, n, data, true, true);
        loadedBundles.add(`${lng}:${n}`);
      } catch {}
    })
  );
});

// If detected language is not EN, trigger initial load
if (i18n.language && i18n.language !== "en") {
  i18n.emit("languageChanged", i18n.language);
}

export default i18n;
