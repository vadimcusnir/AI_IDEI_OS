import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "@/i18n/config";

export function useLocale() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return { currentLanguage, changeLanguage };
}
