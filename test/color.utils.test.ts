import { describe, expect, test } from "bun:test";

import { getContrastHex, hexToRgb } from "../src/utils/color.utils";

describe("hexToRgb", () => {
  test("parses six-digit hex", async () => {
    expect(await hexToRgb("#2e82ff")).toEqual({ r: 46, g: 130, b: 255 });
  });

  test("parses six-digit hex without the leading hash", async () => {
    expect(await hexToRgb("2e82ff")).toEqual({ r: 46, g: 130, b: 255 });
  });

  test("expands three-digit shorthand", async () => {
    expect(await hexToRgb("#f0a")).toEqual({ r: 255, g: 0, b: 170 });
  });

  test("handles the extremes", async () => {
    expect(await hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(await hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  test("is case-insensitive", async () => {
    expect(await hexToRgb("#ABCDEF")).toEqual({ r: 171, g: 205, b: 239 });
  });

  test("rejects lengths that are neither 3 nor 6", async () => {
    expect(await hexToRgb("")).toBeNull();
    expect(await hexToRgb("#ff")).toBeNull();
    expect(await hexToRgb("#ffff")).toBeNull();
    // Eight-digit #RRGGBBAA is not supported by this helper.
    expect(await hexToRgb("#ffffffff")).toBeNull();
  });

  // Documents current behaviour rather than endorsing it: the length check
  // passes before any validation of the characters themselves.
  test("returns NaN channels for non-hex characters of a valid length", async () => {
    const rgb = await hexToRgb("#zzzzzz");
    expect(rgb).not.toBeNull();
    expect(Number.isNaN(rgb?.r)).toBe(true);
  });
});

describe("getContrastHex", () => {
  test("picks black on light backgrounds", async () => {
    expect(await getContrastHex("#ffffff")).toBe("#000");
    expect(await getContrastHex("#fafafa")).toBe("#000");
  });

  test("picks white on dark backgrounds", async () => {
    expect(await getContrastHex("#000000")).toBe("#FFF");
    expect(await getContrastHex("#09090b")).toBe("#FFF");
  });

  test("weights green far above blue, per WCAG luminance", async () => {
    // Pure green is treated as light, pure blue as dark, despite both being
    // full-intensity in a single channel.
    expect(await getContrastHex("#00ff00")).toBe("#000");
    expect(await getContrastHex("#0000ff")).toBe("#FFF");
  });

  test("propagates null for invalid input", async () => {
    expect(await getContrastHex("#ff")).toBeNull();
  });
});
