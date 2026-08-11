import handler from "@astrojs/cloudflare/entrypoints/server";
import * as Sentry from "@sentry/cloudflare";

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    environment: import.meta.env.DEV ? "development" : "production",

    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },

    enableLogs: true,
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  }),
  handler,
);
