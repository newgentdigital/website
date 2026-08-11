import * as Sentry from "@sentry/astro";
import { SENTRY_DSN } from "astro:env/client";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    //Sentry.feedbackIntegration({
    //  colorScheme: "system",
    //  isNameRequired: true,
    //  isEmailRequired: true,
    //  triggerLabel: "Bug?",
    //}),
  ],

  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },

  enableLogs: true,
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  denyUrls: [
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /clarity\.ms/,
    /hs-scripts\.com/,
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-web-extension:\/\//,
  ],
});
