// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import autoParamAstro from "@newgentdigital/auto-param-astro";
// The package does export a default; oxlint's resolver cannot follow its
// `exports` map to find it.
// oxlint-disable-next-line import/default
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";
import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";

import {
  defaultLocale,
  sitemapSupportedLocales,
  supportedLocales,
} from "./src/i18n/utils";
import { redirects } from "./src/utils/redirect.utils";

// https://astro.build/config
export default defineConfig({
  site: "https://newgent.digital",
  output: "static",
  redirects,
  session: false,

  adapter: cloudflare({
    imageService: "compile",
    prerenderEnvironment: "node",
  }),

  integrations: [
    sentry({
      telemetry: false,
      org: "newgentdigital",
      project: "website",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    sitemap({
      i18n: {
        defaultLocale: defaultLocale,
        locales: sitemapSupportedLocales,
      },
    }),
    mdx(),
    autoParamAstro({
      params: {
        ref: "newgent.digital",
        utm_source: "newgent.digital",
        utm_medium: "referral",
      },
      skipInternalLinks: true,
      exemptDomains: ["newgent.se", "*.newgent.se"],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: true,
  },

  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "newgent.digital",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/selfhst/icons/**",
      },
    ],
  },

  i18n: {
    defaultLocale: defaultLocale,
    locales: Object.keys(supportedLocales),
  },

  env: {
    schema: {
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
        default: "re_xxxxxxxxx",
      }),
      TURNSTILE_SITE_KEY: envField.string({
        context: "client",
        access: "public",
        default: "2x00000000000000000000AB",
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        default: "2x0000000000000000000000000000000AA",
      }),
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: ["100 900"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Instrument Serif",
      cssVariable: "--font-instrument-serif",
      weights: ["400"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: ["100 900"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Anek Latin",
      cssVariable: "--font-anek-latin",
      weights: ["100 800"],
    },
  ],

  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
    svgOptimizer: svgoOptimizer(),
    incrementalBuild: true,
  },
});
