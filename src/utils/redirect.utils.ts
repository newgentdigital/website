import { defaultLocale, supportedLocales } from "../i18n/utils";

/**
 * Compiles a list of redirects for all supported locales.
 *
 * @param redirects - An object mapping redirect paths to destination paths.
 * @returns The compiled redirects object.
 */
export function compileRedirects(
  redirects: Record<string, string>,
): Record<string, string> {
  const compiled: Record<string, string> = {};

  for (const locale of Object.keys(supportedLocales)) {
    for (const [from, to] of Object.entries(redirects)) {
      if (locale === defaultLocale) {
        compiled[from] = to;
      } else {
        compiled[`/${locale}${from}`] = `/${locale}${to}`;
      }
    }
  }

  return compiled;
}

export const redirects = {
  ...compileRedirects({}),
};
