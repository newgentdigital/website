import type { Attribution, PackageMetadata } from "./AttributionsList.types";
import { STANDARD_LICENSES } from "./AttributionsList.types";
import { extractAuthor, parseRepositoryUrl } from "./AttributionsList.utils";

/** Fetches package metadata from local node_modules with unpkg CDN fallback. */
async function fetchMetadata(
  packageName: string,
): Promise<PackageMetadata | null> {
  // Try local first
  try {
    const path = await import("path");
    const fs = await import("fs/promises");
    const packagePath = path.join("node_modules", packageName, "package.json");
    const data = await fs.readFile(packagePath, "utf-8");
    return JSON.parse(data);
  } catch {
    // Fallback to unpkg CDN
    try {
      const response = await fetch(
        `https://unpkg.com/${encodeURIComponent(packageName)}@latest/package.json`,
      );
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }
}

/** Converts npm package metadata to attribution format. */
function toAttribution(
  packageName: string,
  metadata: PackageMetadata,
): Attribution {
  const repoUrl =
    typeof metadata.repository === "string"
      ? metadata.repository
      : metadata.repository?.url;

  const [cleanedRepoUrl] = repoUrl ? parseRepositoryUrl(repoUrl) : ["", null];

  const license =
    (typeof metadata.license === "string" ? metadata.license : undefined) ||
    metadata.licenses?.[0]?.type;

  const validLicense =
    license && STANDARD_LICENSES.has(license.trim()) ? license.trim() : "n/a";

  const link =
    cleanedRepoUrl ||
    metadata.homepage ||
    `https://npmjs.com/package/${packageName}`;

  return {
    name: packageName,
    author: extractAuthor(metadata.author, packageName, repoUrl),
    license: validLicense,
    link,
    source: "npm",
  };
}

/** Fetches attributions for npm dependencies. */
export async function getNpmAttributions(
  dependencies: Record<string, string>,
): Promise<Attribution[]> {
  const attributions = await Promise.all(
    Object.keys(dependencies).map(async (packageName) => {
      const metadata = await fetchMetadata(packageName);
      return metadata ? toAttribution(packageName, metadata) : null;
    }),
  );

  return attributions.filter((attr): attr is Attribution => attr !== null);
}
