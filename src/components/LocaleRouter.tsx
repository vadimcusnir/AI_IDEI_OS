/**
 * LocaleRouter — Intercepts /:lang prefix from URL and syncs i18n.
 * 
 * Routes like /en/blog, /ro/pricing, /ru/marketplace are handled here.
 * Bare routes (no prefix) default to the user's detected language.
 * Protected routes (auth-gated) do NOT use subfolder prefixes — only public SEO routes.
 */
import { useEffect } from "react";
import { useParams, useLocation, Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "@/i18n/config";

export function LocaleRouter() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  const isValidLang = lang && supportedLanguages.includes(lang as SupportedLanguage);

  useEffect(() => {
    if (isValidLang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
    }
  }, [lang, isValidLang, i18n]);

  // If lang param is invalid, redirect to default language version
  if (!isValidLang) {
    const defaultLang = (i18n.language?.split("-")[0] || "en") as string;
    const restPath = location.pathname;
    return <Navigate to={`/${defaultLang}${restPath}`} replace />;
  }

  return <Outlet />;
}

/**
 * Hook to get the current locale prefix for links.
 * Returns "/en", "/ro", or "/ru" based on current i18n language.
 */
export function useLocalePrefix(): string {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  return `/${lang}`;
}

/**
 * Build a localized path: /en/blog, /ro/pricing, etc.
 */
export function localePath(path: string, lang?: string): string {
  const prefix = lang || "en";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${prefix}${cleanPath}`;
}
