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
  /**
   * Translate a key to the specified locale, falling back to defaultLocale if
   * the key is not found.
   *
   * @param key - The translation key.
   * @returns The translated string or object.
   */
  return function t<K extends keyof (typeof strings)[typeof defaultLocale]>(
    key: K,
  ): (typeof strings)[typeof defaultLocale][K] {
    return strings[locale][key] || strings[defaultLocale][key];
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
