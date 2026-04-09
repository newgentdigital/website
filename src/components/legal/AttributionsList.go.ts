import type { Attribution, PackageMetadata } from "./AttributionsList.types";
import { STANDARD_LICENSES } from "./AttributionsList.types";
import { extractAuthor, parseRepositoryUrl } from "./AttributionsList.utils";

/** Parses go.mod content to extract direct dependencies. */
export function parseGoMod(content: string): string[] {
  const modules: string[] = [];
  let inRequireBlock = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//") || trimmed.includes("// indirect"))
      continue;

    if (trimmed.startsWith("require (")) {
      inRequireBlock = true;
      continue;
    }

    if (inRequireBlock && trimmed === ")") {
      inRequireBlock = false;
      continue;
    }

    const pattern = inRequireBlock
      ? /^([a-zA-Z0-9\-_./@]+)\s+v[\d.]+/
      : /^require\s+([a-zA-Z0-9\-_./@]+)\s+v[\d.]+/;

    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const moduleName = match[1];
      if (!moduleName.startsWith("golang.org/x/")) {
        modules.push(moduleName);
      }
    }
  }

  return modules;
}

/** Extracts repository URL from Go module name. */
function extractRepoUrl(moduleName: string): string {
  const match = moduleName.match(
    /^(github\.com|gitlab\.com|bitbucket\.org)\/[^/]+\/[^/]+/,
  );
  return match ? `https://${match[0]}` : `https://pkg.go.dev/${moduleName}`;
}

/** Fetches metadata from pkg.go.dev. */
async function fetchMetadata(
  moduleName: string,
): Promise<PackageMetadata | null> {
  try {
    const response = await fetch(`https://pkg.go.dev/${moduleName}`);

    if (response.status === 429) {
      return null; // Will be retried with delay
    }

    if (!response.ok) {
      console.warn(
        `[Go] Failed to fetch ${moduleName}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const html = await response.text();

    const titleMatch = html.match(
      /data-test-id="UnitHeader-title">([^<]+)<\/h1>/,
    );
    const name = titleMatch?.[1]?.trim() || moduleName;

    const licenseMatch = html.match(
      /data-test-id="UnitHeader-license"[^>]*>([^<]+)<\//,
    );
    const rawLicense = licenseMatch?.[1]?.trim() || "";

    // Handle multiple licenses (e.g., "Apache-2.0, MIT")
    const licenses = rawLicense
      .split(",")
      .map((l) => l.trim())
      .filter((l) => STANDARD_LICENSES.has(l));

    const license = licenses.length > 0 ? licenses.join(", ") : "n/a";

    return {
      name,
      license,
      repository: { url: extractRepoUrl(moduleName) },
    };
  } catch (error) {
    console.error(`[Go] Error fetching ${moduleName}:`, error);
    return null;
  }
}

/** Converts Go module metadata to attribution format. */
function toAttribution(
  moduleName: string,
  metadata: PackageMetadata,
): Attribution {
  const repoUrl =
    typeof metadata.repository === "string"
      ? metadata.repository
      : metadata.repository?.url || "";

  const [cleanedUrl] = parseRepositoryUrl(repoUrl);

  return {
    name: metadata.name || moduleName,
    author: extractAuthor(undefined, moduleName, repoUrl),
    license: metadata.license || "n/a",
    link: cleanedUrl || `https://pkg.go.dev/${moduleName}`,
    source: "go",
  };
}

/** Fetches attributions for Go modules. */
export async function getGoAttributions(
  modules: string[],
): Promise<Attribution[]> {
  // Phase 1: Try all modules in parallel
  const results = await Promise.all(
    modules.map(async (moduleName) => ({
      moduleName,
      metadata: await fetchMetadata(moduleName),
    })),
  );

  // Separate successful and failed
  const successful = new Map<string, PackageMetadata>();
  const failed: string[] = [];

  for (const { moduleName, metadata } of results) {
    if (metadata) {
      successful.set(moduleName, metadata);
    } else {
      failed.push(moduleName);
    }
  }

  // Phase 2: Retry failed modules sequentially with longer delays
  if (failed.length > 0) {
    console.warn(
      `[Go] Rate limited or failed for ${failed.length} modules. Retrying sequentially with delays...`,
    );

    for (let i = 0; i < failed.length; i++) {
      const moduleName = failed[i];

      // First retry waits 20s for rate limit window to clear, then 2s between subsequent requests
      const delay = i === 0 ? 20000 : 2000;
      console.log(
        `[Go] Waiting ${delay / 1000}s before retry ${i + 1}/${failed.length}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      const metadata = await fetchMetadata(moduleName);
      if (metadata) {
        successful.set(moduleName, metadata);
        console.log(`[Go] ✓ Retry successful: ${moduleName}`);
      } else {
        console.error(`[Go] ✗ Retry failed: ${moduleName}`);
      }
    }
  }

  // Convert to attributions
  const attributions: Attribution[] = [];
  for (const [moduleName, metadata] of successful) {
    attributions.push(toAttribution(moduleName, metadata));
  }

  const finalFailed = modules.length - successful.size;
  if (finalFailed > 0) {
    console.warn(
      `[Go] Final result: ${successful.size}/${modules.length} modules fetched successfully. ${finalFailed} failed.`,
    );
  } else {
    console.log(`[Go] ✓ All ${successful.size} modules fetched successfully!`);
  }

  return attributions;
}
