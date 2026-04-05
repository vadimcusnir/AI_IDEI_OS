import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const MANUAL_CHUNKS: Record<string, string[]> = {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-ui": [
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-accordion",
    "@radix-ui/react-select",
  ],
  "vendor-motion": ["framer-motion"],
  "vendor-supabase": ["@supabase/supabase-js"],
  "vendor-query": ["@tanstack/react-query"],
  "vendor-charts": ["recharts"],
  "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
  "vendor-icons": ["lucide-react"],
  "vendor-date": ["date-fns"],
  "vendor-sentry": ["@sentry/react"],
  "vendor-graph": ["react-force-graph-2d"],
  "vendor-pdf": ["pdfjs-dist"],
  "vendor-markdown": ["react-markdown"],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [chunkName, deps] of Object.entries(MANUAL_CHUNKS)) {
            if (deps.some((dep) => id.includes(`node_modules/${dep}/`) || id.includes(`node_modules/${dep}\\`))) {
              return chunkName;
            }
          }
        },
      },
    },
    target: "esnext",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
}));
