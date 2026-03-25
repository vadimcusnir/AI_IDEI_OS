import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { trackLLMReferrer } from "./lib/llmReferrerTracker";
import App from "./App.tsx";
import { i18nReady } from "./i18n/config";
import "./index.css";

initSentry();
trackLLMReferrer();

// Wait for i18n translations to load before rendering
// This prevents flash of untranslated keys for RO/RU users
i18nReady.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
