import { strings } from "./strings";

export const defaultLocale = "sv";
export const supportedLocales = {
  sv: { name: "Svenska", iso6391: "sv", iso31661: "SE", isoCombined: "sv-SE" },
  en: { name: "English", iso6391: "en", iso31661: "GB", isoCombined: "en-GB" },
};

export const sitemapSupportedLocales = Object.fromEntries(
  Object.entries(supportedLocales).map(([key, value]) => [
    key,
    value.isoCombined,
  ]),
);

/**
 * Extracts the language code from the URL.
 *
 * @param url - The URL to extract the language from.
 * @returns The language code if supported, otherwise the default locale.
 */
export function getLangFromUrl(url: URL) {
  const lang = url.pathname.split("/")[1];
  if (lang in supportedLocales) return lang as keyof typeof supportedLocales;
  return defaultLocale;
}

/**
 * Create a translate function for the specified locale.
 *
 * @param locale - The locale key to use for translations.
 * @returns A function that translates keys using the given locale, with
 *   fallback to the default locale.
 */
export function useTranslation(locale: keyof typeof strings) {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === "object";

  function createProxy(
    localeObj: unknown,
    defaultObj: unknown,
    path: string,
  ): unknown {
    const collectKeys = () => {
      const s = new Set<string>();
      if (isObject(localeObj)) Object.keys(localeObj).forEach((k) => s.add(k));
      if (isObject(defaultObj))
        Object.keys(defaultObj).forEach((k) => s.add(k));
      return [...s];
    };

    return new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === Symbol.toPrimitive) {
            return () => String(localeObj ?? defaultObj ?? path);
          }

          const key = String(prop);
          const locVal = isObject(localeObj) ? localeObj[key] : undefined;
          const defVal = isObject(defaultObj) ? defaultObj[key] : undefined;
          const nextPath = `${path}.${key}`;

          if (locVal !== undefined) {
            return isObject(locVal)
              ? createProxy(locVal, defVal, nextPath)
              : locVal;
          }
          if (defVal !== undefined) {
            return isObject(defVal)
              ? createProxy(undefined, defVal, nextPath)
              : defVal;
          }
          return nextPath;
        },

        ownKeys() {
          return collectKeys();
        },

        getOwnPropertyDescriptor(_, prop) {
          return collectKeys().includes(prop as string)
            ? { configurable: true, enumerable: true }
            : undefined;
        },
      },
    );
  }

  return function t<K extends keyof (typeof strings)[typeof defaultLocale]>(
    key: K,
  ): (typeof strings)[typeof defaultLocale][K] {
    const localeObj = (strings as Record<string, Record<string, unknown>>)[
      locale
    ]?.[key as string];
    const defaultObj = (strings as Record<string, Record<string, unknown>>)[
      defaultLocale
    ]?.[key as string];
    const basePath = `${locale}.${String(key)}`;

    if (localeObj !== undefined) {
      return (
        isObject(localeObj)
          ? createProxy(localeObj, defaultObj, basePath)
          : localeObj
      ) as (typeof strings)[typeof defaultLocale][K];
    }
    if (defaultObj !== undefined) {
      return (
        isObject(defaultObj)
          ? createProxy(undefined, defaultObj, basePath)
          : defaultObj
      ) as (typeof strings)[typeof defaultLocale][K];
    }
    return basePath as unknown as (typeof strings)[typeof defaultLocale][K];
  };
}

/**
 * Filter pages by locale and transform into path objects with params and props.
 *
 * @template T - The type of the page object, which must have an `id`.
 * @param pages - An array of page objects to filter and transform.
 * @param locale - The locale string to filter pages by (e.g., 'en', 'sv').
 * @returns An array of objects containing params (locale and id) and props (the
 *   page).
 */
export function getCollectionPaths<T extends { id: string }>(
  pages: T[],
  locale: string,
) {
  const localizedPages = pages.filter((page) =>
    page.id.startsWith(`${locale}/`),
  );

  return localizedPages.map((page) => {
    const [pageLocale, ...id] = page.id.split("/");
    return {
      params: { locale: pageLocale, id: id.join("/") || undefined },
      props: page,
    };
  });
}
