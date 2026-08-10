import type { CookieConsentConfig } from "vanilla-cookieconsent";

import { acceptedService } from "vanilla-cookieconsent";

const CAT_NECESSARY = "necessary";
const CAT_SECURITY = "security";
const CAT_FUNCTIONALITY = "functionality";
const CAT_ANALYTICS = "analytics";
const CAT_ADVERTISEMENT = "advertisement";

/** https://support.google.com/tagmanager/answer/10718549 */
const SERVICE_SECURITY_STORAGE = "security_storage";
const SERVICE_FUNCTIONALITY_STORAGE = "functionality_storage";
const SERVICE_PERSONALIZATION_STORAGE = "personalization_storage";
const SERVICE_ANALYTICS_STORAGE = "analytics_storage";
const SERVICE_AD_STORAGE = "ad_storage";
const SERVICE_AD_USER_DATA = "ad_user_data";
const SERVICE_AD_PERSONALIZATION = "ad_personalization";

const serviceCategories = {
  [SERVICE_SECURITY_STORAGE]: CAT_SECURITY,
  [SERVICE_FUNCTIONALITY_STORAGE]: CAT_FUNCTIONALITY,
  [SERVICE_PERSONALIZATION_STORAGE]: CAT_FUNCTIONALITY,
  [SERVICE_ANALYTICS_STORAGE]: CAT_ANALYTICS,
  [SERVICE_AD_STORAGE]: CAT_ADVERTISEMENT,
  [SERVICE_AD_USER_DATA]: CAT_ADVERTISEMENT,
  [SERVICE_AD_PERSONALIZATION]: CAT_ADVERTISEMENT,
} as const;

// @ts-expect-error: dataLayer is not defined on Window
window.dataLayer = window.dataLayer || [];
function gtag(...args: unknown[]) {
  // @ts-expect-error: dataLayer is not defined on Window
  window.dataLayer.push(args);
}

gtag("consent", "default", {
  [SERVICE_AD_STORAGE]: "denied",
  [SERVICE_AD_USER_DATA]: "denied",
  [SERVICE_AD_PERSONALIZATION]: "denied",
  [SERVICE_ANALYTICS_STORAGE]: "denied",
  [SERVICE_FUNCTIONALITY_STORAGE]: "denied",
  [SERVICE_PERSONALIZATION_STORAGE]: "denied",
  [SERVICE_SECURITY_STORAGE]: "denied",
});

/**
 * Updates the Google consent settings based on the current cookie consent
 * state.
 */
function updateGtagConsent() {
  const consent: Record<string, string> = {};
  for (const [service, category] of Object.entries(serviceCategories)) {
    consent[service] = acceptedService(service, category)
      ? "granted"
      : "denied";
  }

  gtag("consent", "update", consent);
}

/** Configuration object for the vanilla-cookieconsent library. */
export const config: CookieConsentConfig = {
  revision: 0,

  cookie: {
    name: "cc_cookie",
    domain: window.location.hostname,
    path: "/",
    secure: true,
    expiresAfterDays: 365,
    sameSite: "Lax",
    useLocalStorage: false,
  },

  onFirstConsent: () => {
    updateGtagConsent();
  },

  onConsent: () => {
    updateGtagConsent();
  },

  onChange: () => {
    updateGtagConsent();
  },

  guiOptions: {
    consentModal: {
      layout: "box inline",
      position: "bottom left",
      flipButtons: false,
      equalWeightButtons: false,
    },
    preferencesModal: {
      layout: "bar",
      position: "right",
      flipButtons: true,
      equalWeightButtons: false,
    },
  },

  categories: {
    [CAT_NECESSARY]: {
      enabled: true,
      readOnly: true,
    },

    [CAT_SECURITY]: {
      services: {
        [SERVICE_SECURITY_STORAGE]: {
          label: "Account protection and data security",
        },
      },
    },

    [CAT_FUNCTIONALITY]: {
      services: {
        [SERVICE_FUNCTIONALITY_STORAGE]: {
          label: "Remember settings and preferences",
        },
        [SERVICE_PERSONALIZATION_STORAGE]: {
          label: "Personalized content and recommendations",
        },
      },
    },

    [CAT_ANALYTICS]: {
      autoClear: {
        cookies: [
          {
            name: /^(_ga)/,
          },
          {
            name: "_gid",
          },
        ],
      },

      services: {
        [SERVICE_ANALYTICS_STORAGE]: {
          label: "Site usage analytics and improvements",
        },
      },
    },

    [CAT_ADVERTISEMENT]: {
      services: {
        [SERVICE_AD_STORAGE]: {
          label: "Ad delivery and performance measurement",
        },
        [SERVICE_AD_USER_DATA]: {
          label: "Anonymous ad reporting data",
        },
        [SERVICE_AD_PERSONALIZATION]: {
          label: "Personalized advertising",
        },
      },
    },
  },

  language: {
    default: "en",
    autoDetect: "document",

    translations: {
      en: async () => {
        const res = await fetch("/i18n/cookieConsentEn.json");
        return await res.json();
      },
      sv: async () => {
        const res = await fetch("/i18n/cookieConsentSv.json");
        return await res.json();
      },
    },
  },
};
