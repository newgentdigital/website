import { describe, expect, test } from "bun:test";

import { isExternalLink } from "../src/utils/link.utils";

describe("isExternalLink", () => {
  test("accepts absolute http and https URLs", () => {
    expect(isExternalLink("https://example.com")).toBe(true);
    expect(isExternalLink("http://example.com/path?a=1")).toBe(true);
  });

  test("accepts protocol-relative URLs", () => {
    expect(isExternalLink("//cdn.example.com/script.js")).toBe(true);
  });

  test("rejects site-internal paths", () => {
    expect(isExternalLink("/tools")).toBe(false);
    expect(isExternalLink("/en/attributions")).toBe(false);
    expect(isExternalLink("attributions")).toBe(false);
    expect(isExternalLink("#section")).toBe(false);
    expect(isExternalLink("?q=1")).toBe(false);
  });

  test("rejects non-http schemes", () => {
    expect(isExternalLink("mailto:hey@newgent.digital")).toBe(false);
    expect(isExternalLink("tel:+46700000000")).toBe(false);
  });

  test("anchors the match at the start", () => {
    expect(isExternalLink("/redirect?to=https://example.com")).toBe(false);
  });
});
