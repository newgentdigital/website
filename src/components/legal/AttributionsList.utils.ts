/**
 * Normalizes git URLs and extracts owner information.
 *
 * @param url - The repository URL to process.
 * @returns Tuple of [cleanedUrl, extractedOwner].
 */
export function parseRepositoryUrl(url: string): [string, string | null] {
  const cleaned = url
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^ssh:\/\/git@/, "https://")
    .replace(/^git@([^:]+):/, "https://$1/");

  const ownerMatch = cleaned.match(/(?:github|gitlab)\.com\/([^/]+)/);
  return [cleaned || "", ownerMatch ? `@${ownerMatch[1]}` : null];
}

/**
 * Extracts author name from various sources.
 *
 * @param author - Author field from metadata.
 * @param packageName - Package name for scoped package fallback.
 * @param repositoryUrl - Repository URL for owner extraction.
 * @returns The extracted author name or "n/a".
 */
export function extractAuthor(
  author: unknown,
  packageName: string,
  repositoryUrl?: string,
): string {
  // Direct author field
  if (typeof author === "string") {
    const match = author.match(/^([^<]+)/);
    if (match?.[1]?.trim()) return match[1].trim();
  } else if (
    typeof author === "object" &&
    author !== null &&
    "name" in author &&
    typeof author.name === "string"
  ) {
    return author.name;
  }

  // Extract from repository URL
  if (repositoryUrl) {
    const [, owner] = parseRepositoryUrl(repositoryUrl);
    if (owner) return owner;
  }

  // Extract from scoped package name
  if (packageName.startsWith("@")) {
    const scope = packageName.split("/")[0];
    if (scope) return scope;
  }

  return "n/a";
}
