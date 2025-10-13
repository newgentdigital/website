import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://ingest.de.sentry.io/",

  sendDefaultPii: true,
  enableLogs: true,
  tracesSampleRate: 1.0,
});
