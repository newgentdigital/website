import { describe, expect, test } from "bun:test";

import { compileRedirects } from "../src/utils/redirect.utils";

describe("compileRedirects", () => {
  test("leaves the default locale unprefixed and prefixes the rest", () => {
    expect(compileRedirects({ "/old": "/new" })).toEqual({
      "/old": "/new",
      "/en/old": "/en/new",
    });
  });

  test("prefixes both sides of the pair", () => {
    const compiled = compileRedirects({ "/a": "/b" });
    expect(compiled["/en/a"]).toBe("/en/b");
  });

  test("handles several redirects at once", () => {
    const compiled = compileRedirects({ "/a": "/b", "/c": "/d" });
    expect(Object.keys(compiled).toSorted()).toEqual([
      "/a",
      "/c",
      "/en/a",
      "/en/c",
    ]);
  });

  test("returns an empty object for no input", () => {
    expect(compileRedirects({})).toEqual({});
  });
});
