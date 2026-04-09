import { getGoAttributions, parseGoMod } from "./AttributionsList.go";
import { getNpmAttributions } from "./AttributionsList.npm";
import type { Attribution } from "./AttributionsList.types";

/** Fetches attributions from a single URL (package.json or go.mod). */
async function getAttributionsFromUrl(url: string): Promise<Attribution[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const content = await response.text();

    if (url.endsWith(".mod")) {
      const modules = parseGoMod(content);
      return await getGoAttributions(modules);
    }

    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
    };
    return await getNpmAttributions(pkg.dependencies || {});
  } catch (error) {
    console.warn(`Error fetching attributions from ${url}:`, error);
    return [];
  }
}

/** Fetches attributions from local package.json. */
async function getLocalAttributions(): Promise<Attribution[]> {
  const pkg = await import("../../../package.json", {
    assert: { type: "json" },
  });
  return await getNpmAttributions(pkg.default.dependencies || {});
}

/**
 * Fetches and generates attributions for dependencies from multiple sources.
 *
 * Supports local node_modules and remote package.json/go.mod files.
 *
 * @param packageJsonUrls - Optional URL(s) to remote package.json or go.mod
 *   files.
 * @returns Array of Attribution objects sorted by package name.
 */
export async function getAttributions(
  packageJsonUrls?: string | string[],
): Promise<Attribution[]> {
  let attributions: Attribution[];

  if (packageJsonUrls) {
    const urls = Array.isArray(packageJsonUrls)
      ? packageJsonUrls
      : [packageJsonUrls];

    const results = await Promise.all(urls.map(getAttributionsFromUrl));
    attributions = results.flat();
  } else {
    attributions = await getLocalAttributions();
  }

  // Deduplicate and sort
  const unique = Array.from(
    new Map(attributions.map((attr) => [attr.name, attr])).values(),
  );

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}
