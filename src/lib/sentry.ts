export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Lazy-load Sentry to keep it off the critical path
    import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
      });
    });
  }
}
