import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { X, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  shouldShowBanner,
  acceptAll,
  rejectAll,
  saveCustomConsent,
  getStoredCategories,
  type ConsentCategories,
} from "@/lib/consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function CookieConsent() {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [categories, setCategories] = useState<ConsentCategories>(getStoredCategories);

  useEffect(() => {
    if (shouldShowBanner()) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    acceptAll();
    setVisible(false);
  };

  const handleReject = () => {
    rejectAll();
    setVisible(false);
  };

  const handleSaveCustom = () => {
    saveCustomConsent(categories);
    setVisible(false);
  };

  const toggle = (key: keyof ConsentCategories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!visible) return null;

  const categoryItems: { key: keyof ConsentCategories; labelKey: string; descKey: string }[] = [
    { key: "analytics", labelKey: "consent.cat_analytics", descKey: "consent.cat_analytics_desc" },
    { key: "ads", labelKey: "consent.cat_ads", descKey: "consent.cat_ads_desc" },
    { key: "personalization", labelKey: "consent.cat_personalization", descKey: "consent.cat_personalization_desc" },
    { key: "data_sharing", labelKey: "consent.cat_data_sharing", descKey: "consent.cat_data_sharing_desc" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 p-3 sm:p-0",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <div className="mx-auto max-w-lg sm:mb-4 rounded-xl border border-border bg-card shadow-2xl p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("consent.title")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("consent.description")}
            </p>

            {/* Customize panel */}
            {showCustomize && (
              <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                {categoryItems.map(({ key, labelKey, descKey }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{t(labelKey)}</p>
                      <p className="text-micro text-muted-foreground leading-snug">{t(descKey)}</p>
                    </div>
                    <Switch
                      checked={categories[key]}
                      onCheckedChange={() => toggle(key)}
                      className="shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {showCustomize ? (
                <Button size="sm" onClick={handleSaveCustom} className="h-7 text-xs px-3">
                  {t("consent.save")}
                </Button>
              ) : (
                <Button size="sm" onClick={handleAccept} className="h-7 text-xs px-3">
                  {t("consent.accept_all")}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReject}
                className="h-7 text-xs px-3 text-muted-foreground"
              >
                {t("consent.refuse")}
              </Button>
              {!showCustomize && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCustomize(true)}
                  className="h-7 text-xs px-3 gap-1"
                >
                  <Settings2 className="h-3 w-3" />
                  {t("consent.customize")}
                </Button>
              )}
            </div>
          </div>
          <button
            onClick={handleReject}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
