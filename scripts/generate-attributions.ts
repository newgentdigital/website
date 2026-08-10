import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Regenerates `src/data/attributions.generated.ts`, the dependency report
// behind the /attributions pages. Deliberately a script and not a build step:
// the report only changes when manifests do, and a build should never stall on
// a registry. Re-run via `bun run attributions` after dependency changes.
//
// Three ecosystems, one report:
//   npm  - package.json manifests, resolved local-first from node_modules so a
//          normal run is offline and instant; the registry only answers for
//          packages that are declared but not installed.
//   go   - go.mod manifests (direct requires only), resolved via pkg.go.dev.
//   rust - Cargo.toml manifests, resolved via the crates.io JSON API.
//
// Unlike a single-product site, this one credits each product separately, so
// the report is grouped by scope (see SCOPES below) and every page renders the
// scope it belongs to. Manifests come from this repo (walked on disk) and from
// the remote product repos, fetched through the GitHub contents API. Private
// repos need ATTRIBUTIONS_GITHUB_TOKEN or GITHUB_TOKEN with contents:read on
// each repo; put it in .env, which bun loads by itself.

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(scriptDirectory, "..");
const outputPath = resolve(websiteRoot, "src/data/attributions.generated.ts");

/**
 * One entry per /attributions page. `local` reads this repo's own manifests;
 * `remote` lists manifests in repos this one cannot see. Three URL shapes are
 * understood: github://owner/repo/path/to/manifest?ref=main
 * https://raw.githubusercontent.com/owner/repo/ref/path/to/manifest
 * https://github.com/owner/repo/blob/ref/path/to/manifest The basename picks
 * the parser (package.json, go.mod, or Cargo.toml).
 */
const SCOPES = {
  newgent: { local: true, remote: [] as string[] },
  shellguard: {
    local: false,
    remote: [
      "https://raw.githubusercontent.com/newgentdigital/shellguard/refs/heads/main/package.json",
    ],
  },
  patronius: {
    local: false,
    remote: [
      "https://raw.githubusercontent.com/newgentdigital/patronius/refs/heads/main/package.json",
    ],
  },
  finconnect: {
    local: false,
    remote: [
      "https://raw.githubusercontent.com/newgentdigital/finconnect/refs/heads/main/package.json",
    ],
  },
  discern: {
    local: false,
    remote: [
      "https://raw.githubusercontent.com/newgentdigital/discern/refs/heads/main/package.json",
    ],
  },
} satisfies Record<string, { local: boolean; remote: string[] }>;

type Scope = keyof typeof SCOPES;

const GITHUB_TOKEN =
  process.env.ATTRIBUTIONS_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? "";

/**
 * Extra manifests that should stay out of the committed source, as `scope=url`
 * pairs: ATTRIBUTIONS_REMOTE_MANIFEST_URLS="discern=https://…".
 */
const ENV_REMOTE_MANIFESTS = (
  process.env.ATTRIBUTIONS_REMOTE_MANIFEST_URLS ?? ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

// First-party code is not a third-party credit, but the runtime dependencies
// of first-party npm packages ship inside our bundles, so the walk follows
// one level into each first-party manifest instead of stopping at it.
const FIRST_PARTY_NPM_SCOPE = "@newgentdigital";
const FIRST_PARTY_REPO_MARKER = "github.com/newgentdigital/";

// The crates.io crawler policy asks callers to identify themselves.
const USER_AGENT = "newgent-attributions-generator (+https://newgent.digital)";

// Registry metadata sometimes points at repository paths that have since
// moved; these overrides win over the registry's repository field so a
// regeneration cannot reintroduce a dead link.
const LINK_OVERRIDES: Record<string, string> = {};

const FETCH_ATTEMPTS = 3;
const FETCH_CONCURRENCY = 8;

// Directories the local manifest walk never enters: vendored trees, build
// output, and tooling state have manifests that are not ours to credit.
const SKIP_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "public",
  ".astro",
  ".wrangler",
]);

type Source = "npm" | "go" | "rust";

interface Attribution {
  name: string;
  author: string;
  license: string;
  link: string;
  source: Source;
}

/** Narrows an unknown JSON value to something with indexable properties. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sleep = (ms: number) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function mapLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let nextIndex = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(FETCH_CONCURRENCY, items.length) },
      async () => {
        while (nextIndex < items.length) {
          const index = nextIndex;
          nextIndex += 1;
          results[index] = await fn(items[index]);
        }
      },
    ),
  );
  return results;
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string> = {},
): Promise<Response | null> {
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, ...headers },
      });
      if (response.ok) {
        return response;
      }
      if (response.status !== 429 && response.status < 500) {
        return null;
      }
      const retryAfterSeconds = Number.parseInt(
        response.headers.get("retry-after") ?? "",
        10,
      );
      if (attempt < FETCH_ATTEMPTS) {
        await sleep(
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : 2000 * attempt,
        );
      }
    } catch {
      if (attempt < FETCH_ATTEMPTS) {
        await sleep(2000 * attempt);
      }
    }
  }
  console.warn(`Fetch failed after ${FETCH_ATTEMPTS} attempts: ${url}`);
  return null;
}

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string | null> {
  const response = await fetchWithRetry(url, headers);
  return response ? await response.text() : null;
}

async function fetchJson(
  url: string,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown> | null> {
  const response = await fetchWithRetry(url, headers);
  try {
    return response
      ? await (response.json() as Promise<Record<string, unknown>>)
      : null;
  } catch {
    return null;
  }
}

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Git+ssh remotes, shorthand slugs, and .git suffixes all become plain https. */
export function normalizeRepositoryUrl(url: string): string {
  const cleaned = url
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^ssh:\/\/git@/, "https://")
    .replace(/^git@([^:]+):/, "https://$1/");
  return /^[^/]+\/[^/]+$/.test(cleaned)
    ? `https://github.com/${cleaned}`
    : cleaned;
}

export const repositoryOwner = (url: string) =>
  /(?:github|gitlab|bitbucket)\.(?:com|org)\/([^/]+)/.exec(url)?.[1];

// --- npm ---------------------------------------------------------------------

function declaredNpmDependencies(
  manifest: Record<string, unknown>,
  includeDev: boolean,
): string[] {
  const groups = [
    manifest.dependencies,
    manifest.optionalDependencies,
    ...(includeDev ? [manifest.devDependencies] : []),
  ];
  return groups.flatMap((group) =>
    group && typeof group === "object" ? Object.keys(group) : [],
  );
}

/**
 * Remote product manifests are read the same way as this repo's: direct
 * dependencies including the dev toolchain, since the credit policy thanks what
 * our products are made with, not only what ships inside them.
 */
export function parsePackageJson(content: string): string[] {
  try {
    return declaredNpmDependencies(
      JSON.parse(content) as Record<string, unknown>,
      true,
    );
  } catch {
    return [];
  }
}

function extractNpmAuthor(
  manifest: Record<string, unknown>,
  name: string,
  repositoryUrl: string,
): string {
  const author = manifest.author;
  if (typeof author === "string" && author.trim()) {
    return author.split("<")[0]?.split("(")[0]?.trim() || author.trim();
  }
  if (
    author &&
    typeof author === "object" &&
    "name" in author &&
    typeof author.name === "string"
  ) {
    return author.name;
  }
  const owner = repositoryOwner(repositoryUrl);
  if (owner) {
    return `@${owner}`;
  }
  return name.startsWith("@") ? name.split("/")[0] : "n/a";
}

function extractNpmLicense(manifest: Record<string, unknown>): string {
  if (typeof manifest.license === "string" && manifest.license.trim()) {
    return manifest.license.trim();
  }
  // Legacy `licenses` arrays predate the SPDX string field but still exist in
  // the wild; the report keeps whatever the manifest declares, verbatim.
  const legacy = manifest.licenses;
  if (
    Array.isArray(legacy) &&
    legacy[0] &&
    typeof legacy[0] === "object" &&
    "type" in legacy[0]
  ) {
    const type = (legacy[0] as { type?: unknown }).type;
    if (typeof type === "string" && type.trim()) {
      return type.trim();
    }
  }
  return "n/a";
}

function toNpmAttribution(
  name: string,
  manifest: Record<string, unknown>,
): Attribution {
  const repository = manifest.repository;
  const rawRepositoryUrl =
    typeof repository === "string"
      ? repository
      : repository &&
          typeof repository === "object" &&
          "url" in repository &&
          typeof repository.url === "string"
        ? repository.url
        : "";
  const repositoryUrl = rawRepositoryUrl
    ? normalizeRepositoryUrl(rawRepositoryUrl)
    : "";

  return {
    name,
    author: extractNpmAuthor(manifest, name, repositoryUrl),
    license: extractNpmLicense(manifest),
    link:
      (typeof manifest.homepage === "string" && manifest.homepage) ||
      repositoryUrl ||
      `https://www.npmjs.com/package/${name}`,
    source: "npm",
  };
}

async function resolveNpmAttribution(
  name: string,
): Promise<Attribution | null> {
  const installed = await readJson(
    join(websiteRoot, "node_modules", name, "package.json"),
  );
  if (installed) {
    return toNpmAttribution(name, installed);
  }
  const remote = await fetchJson(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
  );
  return remote ? toNpmAttribution(name, remote) : null;
}

// --- go ----------------------------------------------------------------------

/** Direct requires only: indirect pins are the tree, not choices we made. */
export function parseGoMod(content: string): string[] {
  const modules: string[] = [];
  let inRequireBlock = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.includes("// indirect")) {
      continue;
    }
    if (line.startsWith("require (")) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ")") {
      inRequireBlock = false;
      continue;
    }
    const pattern = inRequireBlock
      ? /^([-\w./@]+)\s+v[\d.]/
      : /^require\s+([-\w./@]+)\s+v[\d.]/;
    const moduleName = pattern.exec(line)?.[1];
    if (moduleName) {
      modules.push(moduleName);
    }
  }

  return modules;
}

async function resolveGoAttribution(
  moduleName: string,
): Promise<Attribution | null> {
  const html = await fetchText(`https://pkg.go.dev/${moduleName}`);
  if (!html) {
    return null;
  }

  const license =
    /data-test-id="UnitHeader-license"[^>]*>([^<]+)</.exec(html)?.[1]?.trim() ||
    "n/a";
  const repoMatch =
    /^(?:github\.com|gitlab\.com|bitbucket\.org)\/[^/]+\/[^/]+/.exec(
      moduleName,
    )?.[0];
  const owner = repoMatch ? moduleName.split("/")[1] : undefined;

  return {
    name: moduleName,
    author: owner ? `@${owner}` : "n/a",
    license,
    link: repoMatch
      ? `https://${repoMatch}`
      : `https://pkg.go.dev/${moduleName}`,
    source: "go",
  };
}

// --- rust --------------------------------------------------------------------

export function parseCargoToml(content: string): string[] {
  const crates: string[] = [];
  let section = "";

  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      continue;
    }

    const sectionName = /^\[([^\]]+)\]$/.exec(line)?.[1]?.trim();
    if (sectionName) {
      section = sectionName;
      continue;
    }

    const isDependencySection =
      /^(dependencies|dev-dependencies|build-dependencies)$/.test(section) ||
      /\.(dependencies|dev-dependencies|build-dependencies)$/.test(section) ||
      section === "workspace.dependencies";
    if (!isDependencySection) {
      continue;
    }

    const dependencyMatch = /^([\w-]+)\s*=\s*(.+)$/.exec(line);
    if (!dependencyMatch) {
      continue;
    }

    const value = dependencyMatch[2];
    // Workspace and path entries are local code, not crates.io packages.
    if (
      /\bworkspace\s*=\s*true\b/.test(value) ||
      /\bpath\s*=\s*"/.test(value)
    ) {
      continue;
    }
    if (value.startsWith("{") && !/\bversion\s*=\s*"/.test(value)) {
      continue;
    }

    crates.push(
      /\bpackage\s*=\s*"([^"]+)"/.exec(value)?.[1] ?? dependencyMatch[1],
    );
  }

  return crates;
}

async function resolveRustAttribution(
  crateName: string,
): Promise<Attribution | null> {
  const payload = await fetchJson(
    `https://crates.io/api/v1/crates/${encodeURIComponent(crateName)}`,
  );
  const crate = payload?.crate;
  if (!payload || !isRecord(crate)) {
    return null;
  }

  // The license lives on the newest version that has not been yanked, not on
  // the crate record itself.
  const versions = Array.isArray(payload.versions) ? payload.versions : [];
  const latest = versions
    .filter(isRecord)
    .find((version) => version.yanked !== true);
  const license =
    typeof latest?.license === "string" && latest.license.trim()
      ? latest.license.trim()
      : "n/a";
  const repository =
    typeof crate.repository === "string"
      ? normalizeRepositoryUrl(crate.repository)
      : "";
  const owner = repositoryOwner(repository);

  return {
    name: crateName,
    author: owner ? `@${owner}` : "n/a",
    license,
    link:
      LINK_OVERRIDES[crateName] ||
      repository ||
      (typeof crate.homepage === "string" && crate.homepage) ||
      `https://crates.io/crates/${crateName}`,
    source: "rust",
  };
}

// --- manifest gathering ------------------------------------------------------

interface RemoteManifest {
  owner: string;
  repo: string;
  filePath: string;
  ref: string;
}

export function parseRemoteManifestUrl(source: string): RemoteManifest | null {
  if (source.startsWith("github://")) {
    // Destructuring defaults rather than `?? ""`: with noUncheckedIndexedAccess
    // off, TypeScript types the missing second element as string, so a
    // coalesce here reads as dead code to the linter while still being needed.
    const [pathPart = "", queryPart = ""] = source
      .slice("github://".length)
      .split("?");
    const segments = pathPart.split("/").filter(Boolean);
    if (segments.length < 3) {
      return null;
    }
    const query = new URLSearchParams(queryPart);
    // URLSearchParams.get returns string | null per TypeScript's own lib, so
    // the optional chain is load-bearing; tsgolint resolves a lib where it is
    // not and reports the chain as unnecessary.
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    const ref = query.get("ref")?.trim() ?? "main";
    return {
      owner: segments[0],
      repo: segments[1],
      filePath: segments.slice(2).join("/"),
      ref,
    };
  }

  let url;
  try {
    url = new URL(source);
  } catch {
    return null;
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "raw.githubusercontent.com" && segments.length >= 4) {
    // Newer raw URLs spell the ref as refs/heads/<branch> or refs/tags/<tag>.
    if (
      segments[2] === "refs" &&
      (segments[3] === "heads" || segments[3] === "tags") &&
      segments.length >= 6
    ) {
      return {
        owner: segments[0],
        repo: segments[1],
        ref: segments[4],
        filePath: segments.slice(5).join("/"),
      };
    }
    return {
      owner: segments[0],
      repo: segments[1],
      ref: segments[2],
      filePath: segments.slice(3).join("/"),
    };
  }
  if (
    url.hostname === "github.com" &&
    segments.length >= 5 &&
    segments[2] === "blob"
  ) {
    return {
      owner: segments[0],
      repo: segments[1],
      ref: segments[3],
      filePath: segments.slice(4).join("/"),
    };
  }
  return null;
}

async function fetchRemoteManifest(
  source: string,
): Promise<{ fileName: string; content: string } | null> {
  const manifest = parseRemoteManifestUrl(source);
  if (!manifest) {
    console.warn(
      `Unsupported manifest URL (github://, raw.githubusercontent.com, or github.com/blob): ${source}`,
    );
    return null;
  }
  const encodedPath = manifest.filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  // The contents API reaches private repos but needs a token even for public
  // ones, so without a token fall back to raw.githubusercontent.com. Every
  // product repo this is pointed at today is public; a token is only required
  // once one of them isn't.
  const content = GITHUB_TOKEN
    ? await fetchText(
        `https://api.github.com/repos/${manifest.owner}/${manifest.repo}/contents/${encodedPath}?ref=${encodeURIComponent(manifest.ref)}`,
        {
          Accept: "application/vnd.github.raw+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      )
    : await fetchText(
        `https://raw.githubusercontent.com/${manifest.owner}/${manifest.repo}/${encodeURIComponent(manifest.ref)}/${encodedPath}`,
      );
  if (!content) {
    console.warn(
      `Could not fetch ${manifest.owner}/${manifest.repo}/${manifest.filePath}@${manifest.ref}` +
        (GITHUB_TOKEN
          ? ""
          : "; if the repository is private, set ATTRIBUTIONS_GITHUB_TOKEN or GITHUB_TOKEN in .env"),
    );
    return null;
  }
  console.warn(
    `Fetched remote manifest ${manifest.owner}/${manifest.repo}/${manifest.filePath}@${manifest.ref}`,
  );
  return { fileName: basename(manifest.filePath), content };
}

/** Go.mod and Cargo.toml anywhere in this repo; package.json only at the root. */
async function findLocalManifests(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }
      found.push(...(await findLocalManifests(join(directory, entry.name))));
    } else if (entry.name === "go.mod" || entry.name === "Cargo.toml") {
      found.push(join(directory, entry.name));
    }
  }
  return found;
}

// --- report ------------------------------------------------------------------

const isFirstParty = (attribution: Attribution) =>
  attribution.name.startsWith(`${FIRST_PARTY_NPM_SCOPE}/`) ||
  attribution.name === FIRST_PARTY_NPM_SCOPE ||
  attribution.name.toLowerCase().includes(FIRST_PARTY_REPO_MARKER) ||
  attribution.link.toLowerCase().includes(FIRST_PARTY_REPO_MARKER);

const quote = (value: string) =>
  `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

function formatGeneratedFile(
  generatedAt: string,
  byScope: Record<Scope, Attribution[]>,
): string {
  const lines = [
    "/**",
    " * Generated by scripts/generate-attributions.ts. Do not edit by hand;",
    " * re-run `bun run attributions` after dependency changes instead.",
    " *",
    " * Direct dependencies of this repo and of the remote product manifests",
    " * the generator is pointed at, read from the manifests that install them.",
    " */",
    "",
    'export type AttributionSource = "npm" | "go" | "rust";',
    "",
    `export type AttributionScope = ${(Object.keys(SCOPES) as Scope[])
      .map((scope) => quote(scope))
      .join(" | ")};`,
    "",
    "export interface GeneratedAttribution {",
    "  name: string;",
    "  author: string;",
    "  license: string;",
    "  link: string;",
    "  source: AttributionSource;",
    "}",
    "",
    `export const GENERATED_ATTRIBUTIONS_AT = ${quote(generatedAt)};`,
    "",
    "export const GENERATED_ATTRIBUTIONS: Record<",
    "  AttributionScope,",
    "  GeneratedAttribution[]",
    "> = {",
  ];

  for (const scope of Object.keys(SCOPES) as Scope[]) {
    lines.push(`  ${scope}: [`);
    for (const item of byScope[scope]) {
      lines.push(
        "    {",
        `      name: ${quote(item.name)},`,
        `      author: ${quote(item.author)},`,
        `      license: ${quote(item.license)},`,
        `      link: ${quote(item.link)},`,
        `      source: ${quote(item.source)},`,
        "    },",
      );
    }
    lines.push("  ],");
  }

  lines.push("};", "");
  return lines.join("\n");
}

/** `scope=url` pairs from the environment, grouped by scope. */
function envManifestsByScope(): Partial<Record<Scope, string[]>> {
  const grouped: Partial<Record<Scope, string[]>> = {};
  for (const entry of ENV_REMOTE_MANIFESTS) {
    const separator = entry.indexOf("=");
    const scope = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();
    if (separator === -1 || !url || !(scope in SCOPES)) {
      console.warn(
        `Ignoring ATTRIBUTIONS_REMOTE_MANIFEST_URLS entry "${entry}"; expected <scope>=<url> with a known scope.`,
      );
      continue;
    }
    (grouped[scope as Scope] ??= []).push(url);
  }
  return grouped;
}

async function collectNames(
  scope: Scope,
  extraRemote: string[],
): Promise<Record<Source, Set<string>>> {
  const names: Record<Source, Set<string>> = {
    npm: new Set(),
    go: new Set(),
    rust: new Set(),
  };

  if (SCOPES[scope].local) {
    const rootManifest = await readJson(join(websiteRoot, "package.json"));
    if (!rootManifest) {
      throw new Error("could not read the root package.json");
    }
    // Dev dependencies count for our own manifests (the toolchain builds every
    // page) but not for first-party packages, whose dev tooling never reaches
    // any shipped output.
    for (const name of declaredNpmDependencies(rootManifest, true)) {
      names.npm.add(name);
    }
    for (const name of Array.from(names.npm)) {
      if (!name.startsWith(`${FIRST_PARTY_NPM_SCOPE}/`)) {
        continue;
      }
      const manifest = await readJson(
        join(websiteRoot, "node_modules", name, "package.json"),
      );
      for (const nested of manifest
        ? declaredNpmDependencies(manifest, false)
        : []) {
        names.npm.add(nested);
      }
    }

    for (const manifestPath of await findLocalManifests(websiteRoot)) {
      const content = await readFile(manifestPath, "utf8");
      const isGo = basename(manifestPath) === "go.mod";
      for (const name of isGo ? parseGoMod(content) : parseCargoToml(content)) {
        (isGo ? names.go : names.rust).add(name);
      }
    }
  }

  const sources = [...new Set([...SCOPES[scope].remote, ...extraRemote])];
  for (const manifest of await mapLimit(sources, fetchRemoteManifest)) {
    if (!manifest) {
      continue;
    }
    if (manifest.fileName === "package.json") {
      for (const name of parsePackageJson(manifest.content)) {
        names.npm.add(name);
      }
    } else if (manifest.fileName === "go.mod") {
      for (const name of parseGoMod(manifest.content)) {
        names.go.add(name);
      }
    } else if (manifest.fileName === "Cargo.toml") {
      for (const name of parseCargoToml(manifest.content)) {
        names.rust.add(name);
      }
    } else {
      console.warn(
        `No parser for remote manifest ${manifest.fileName}; expected package.json, go.mod, or Cargo.toml.`,
      );
    }
  }

  return names;
}

function formatOutput() {
  try {
    const result = Bun.spawnSync([
      join(websiteRoot, "node_modules/.bin/oxfmt"),
      outputPath,
    ]);
    if (!result.success) {
      console.warn(
        "Could not format the generated file; run `bun run format`.",
      );
    }
  } catch {
    console.warn("Could not format the generated file; run `bun run format`.");
  }
}

async function generate() {
  const resolvers: Record<
    Source,
    (name: string) => Promise<Attribution | null>
  > = {
    npm: resolveNpmAttribution,
    go: resolveGoAttribution,
    rust: resolveRustAttribution,
  };

  // One shared cache across scopes: the products overlap heavily, and a
  // package's metadata does not depend on who declared it.
  const cache = new Map<string, Promise<Attribution | null>>();
  const resolveCached = (source: Source, name: string) => {
    const key = `${source}:${name}`;
    let pending = cache.get(key);
    if (!pending) {
      pending = resolvers[source](name);
      cache.set(key, pending);
    }
    return pending;
  };

  const envManifests = envManifestsByScope();
  const byScope = {} as Record<Scope, Attribution[]>;

  for (const scope of Object.keys(SCOPES) as Scope[]) {
    const names = await collectNames(scope, envManifests[scope] ?? []);
    const work = (Object.keys(names) as Source[]).flatMap((source) =>
      [...names[source]].map((name) => ({ source, name })),
    );
    const resolved = await mapLimit(work, async ({ source, name }) => {
      const attribution = await resolveCached(source, name);
      if (!attribution) {
        console.warn(
          `Could not resolve ${source} dependency ${name}; skipping.`,
        );
      }
      return attribution;
    });

    byScope[scope] = resolved
      .filter(
        (item): item is Attribution => item !== null && !isFirstParty(item),
      )
      .toSorted(
        (a, b) =>
          a.name.localeCompare(b.name) || a.source.localeCompare(b.source),
      );
  }

  await writeFile(
    outputPath,
    formatGeneratedFile(new Date().toISOString(), byScope),
    "utf8",
  );
  // Hand the file to the project's formatter rather than trying to emit its
  // exact style, so `bun run format:check` stays green after a regeneration.
  formatOutput();

  for (const scope of Object.keys(SCOPES) as Scope[]) {
    const counts = (["npm", "go", "rust"] as const)
      .map(
        (source) =>
          `${source}=${byScope[scope].filter((item) => item.source === source).length}`,
      )
      .join(", ");
    console.warn(
      `${scope}: ${byScope[scope].length} attributions (${counts}).`,
    );
  }
  console.warn(`Wrote ${outputPath}.`);

  const unknownLicenses = [
    ...new Set(
      Object.values(byScope)
        .flat()
        .filter((item) => item.license === "n/a")
        .map((item) => item.name),
    ),
  ];
  if (unknownLicenses.length > 0) {
    console.warn(`No license found for: ${unknownLicenses.join(", ")}`);
  }
}

// Guarded so the parsers above can be imported by tests without the import
// itself firing a full generation run.
if (import.meta.main) {
  await generate();
}
