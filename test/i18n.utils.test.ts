import { describe, expect, test } from "bun:test";

import {
  defaultLocale,
  getCollectionPaths,
  getLangFromUrl,
  sitemapSupportedLocales,
  supportedLocales,
  useTranslation,
} from "../src/i18n/utils";

describe("getLangFromUrl", () => {
  test("reads a supported locale from the first path segment", () => {
    expect(getLangFromUrl(new URL("https://newgent.digital/en/tools"))).toBe(
      "en",
    );
  });

  test("falls back to the default locale for unprefixed paths", () => {
    expect(getLangFromUrl(new URL("https://newgent.digital/tools"))).toBe(
      defaultLocale,
    );
    expect(getLangFromUrl(new URL("https://newgent.digital/"))).toBe(
      defaultLocale,
    );
  });

  test("falls back for an unknown prefix", () => {
    expect(getLangFromUrl(new URL("https://newgent.digital/de/tools"))).toBe(
      defaultLocale,
    );
  });

  test("only matches the first segment", () => {
    expect(
      getLangFromUrl(new URL("https://newgent.digital/tools/en/nested")),
    ).toBe(defaultLocale);
  });

  test("does not treat inherited Object properties as locales", () => {
    expect(
      getLangFromUrl(new URL("https://newgent.digital/constructor/x")),
    ).toBe(defaultLocale);
    expect(getLangFromUrl(new URL("https://newgent.digital/toString"))).toBe(
      defaultLocale,
    );
  });
});

describe("useTranslation", () => {
  test("returns strings for the requested locale", () => {
    const t = useTranslation("en");
    expect(typeof t("common")).toBe("object");
  });

  test("each supported locale resolves the same top-level keys", () => {
    const svKeys = Object.keys(useTranslation("sv")("nav")).toSorted();
    const enKeys = Object.keys(useTranslation("en")("nav")).toSorted();
    expect(enKeys).toEqual(svKeys);
  });
});

describe("sitemapSupportedLocales", () => {
  test("maps every supported locale to its combined ISO code", () => {
    expect(sitemapSupportedLocales).toEqual({ sv: "sv-SE", en: "en-GB" });
  });

  test("stays in sync with supportedLocales", () => {
    expect(Object.keys(sitemapSupportedLocales)).toEqual(
      Object.keys(supportedLocales),
    );
  });

  test("the default locale is one of the supported locales", () => {
    expect(Object.keys(supportedLocales)).toContain(defaultLocale);
  });
});

describe("getCollectionPaths", () => {
  const pages = [
    { id: "sv/about" },
    { id: "sv/nested/deep" },
    { id: "en/about" },
    { id: "sv" },
  ];

  test("keeps only entries under the requested locale prefix", () => {
    expect(getCollectionPaths(pages, "en")).toEqual([
      { params: { locale: "en", id: "about" }, props: { id: "en/about" } },
    ]);
  });

  test("strips the locale segment and rejoins the remainder", () => {
    const paths = getCollectionPaths(pages, "sv");
    expect(paths.map((p) => p.params.id)).toEqual(["about", "nested/deep"]);
  });

  test("does not match a locale that is only a prefix of the segment", () => {
    expect(getCollectionPaths([{ id: "sverige/x" }], "sv")).toEqual([]);
  });

  test("yields an undefined id for a bare locale index, so the route is /:locale", () => {
    const [path] = getCollectionPaths([{ id: "sv/" }], "sv");
    expect(path).toBeDefined();
    expect(path.params.id).toBeUndefined();
  });

  test("passes the original page through as props", () => {
    const page = { id: "en/about", title: "About" };
    expect(getCollectionPaths([page], "en")[0]?.props).toBe(page);
  });

  test("returns an empty array when nothing matches", () => {
    expect(getCollectionPaths(pages, "de")).toEqual([]);
  });
});
