import { describe, expect, test } from "bun:test";

import { convertBytes, getFileSize } from "../src/utils/file.utils";

describe("convertBytes", () => {
  test("uses base 1024", async () => {
    expect(await convertBytes(1024, "kb")).toBe(1);
    expect(await convertBytes(1024 ** 2, "mb")).toBe(1);
    expect(await convertBytes(1024 ** 3, "gb")).toBe(1);
  });

  test("passes bytes through unchanged", async () => {
    expect(await convertBytes(512, "b")).toBe(512);
  });

  test("is case-insensitive", async () => {
    expect(await convertBytes(2048, "KB")).toBe(2);
    expect(await convertBytes(2048, "Kb")).toBe(2);
  });

  test("returns fractions rather than rounding", async () => {
    expect(await convertBytes(512, "kb")).toBe(0.5);
  });

  test("rejects an unknown unit and names the valid ones", async () => {
    expect(convertBytes(1024, "tb")).rejects.toThrow(/Invalid unit: "tb"/);
    expect(convertBytes(1024, "tb")).rejects.toThrow(/b, kb, mb, gb/);
  });
});

describe("getFileSize", () => {
  test("reports a real file's size in bytes", async () => {
    expect(await getFileSize("package.json")).toBeGreaterThan(0);
  });

  test("converts when a unit is given", async () => {
    const bytes = await getFileSize("package.json");
    expect(await getFileSize("package.json", "kb")).toBeCloseTo(bytes / 1024);
  });

  test("throws a path-qualified error for a missing file, preserving the cause", async () => {
    expect(getFileSize("definitely/not/here.txt")).rejects.toThrow(
      /Unable to get 'definitely\/not\/here.txt' size/,
    );
    await getFileSize("definitely/not/here.txt").catch((error: unknown) => {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) expect(error.cause).toBeDefined();
    });
  });
});
