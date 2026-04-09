let sentryInstance: typeof import("@sentry/react") | null = null;

const SENTRY_DSN = "https://fae81b65b5a78611ea8ea19045ac5245@o4511189919596544.ingest.us.sentry.io/4511189995683840";

export function initSentry() {
  if (import.meta.env.PROD) {
    import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
        beforeSend(event) {
          // Filter noisy errors
          if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) return null;
          if (event.exception?.values?.[0]?.value?.includes("ChunkLoadError")) return null;
          return event;
        },
      });
      sentryInstance = Sentry;
    });
  }
}

export function setSentryUser(user: { id: string; email?: string } | null) {
  if (sentryInstance) {
    if (user) {
      sentryInstance.setUser({ id: user.id, email: user.email });
    } else {
      sentryInstance.setUser(null);
    }
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (sentryInstance) {
    sentryInstance.captureException(error, { extra: context });
  }
}

export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  if (sentryInstance) {
    sentryInstance.addBreadcrumb({ message, category, data, level: "info" });
  }
}
