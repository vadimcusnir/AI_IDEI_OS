import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./i18n/config";
import "./index.css";

initSentry();

createRoot(document.getElementById("root")!).render(<App />);
