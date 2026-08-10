import { describe, expect, test } from "bun:test";

import {
  normalizeRepositoryUrl,
  parseCargoToml,
  parseGoMod,
  parsePackageJson,
  parseRemoteManifestUrl,
  repositoryOwner,
} from "../scripts/generate-attributions";

describe("normalizeRepositoryUrl", () => {
  test("strips the git+ prefix and .git suffix", () => {
    expect(
      normalizeRepositoryUrl("git+https://github.com/withastro/astro.git"),
    ).toBe("https://github.com/withastro/astro");
  });

  test("rewrites git://, ssh:// and scp-style remotes", () => {
    expect(normalizeRepositoryUrl("git://github.com/oven-sh/bun.git")).toBe(
      "https://github.com/oven-sh/bun",
    );
    expect(normalizeRepositoryUrl("ssh://git@github.com/a/b.git")).toBe(
      "https://github.com/a/b",
    );
    expect(normalizeRepositoryUrl("git@gitlab.com:group/project.git")).toBe(
      "https://gitlab.com/group/project",
    );
  });

  test("expands a bare owner/repo shorthand to GitHub", () => {
    expect(normalizeRepositoryUrl("sindresorhus/slugify")).toBe(
      "https://github.com/sindresorhus/slugify",
    );
  });

  test("leaves an already-normal URL alone", () => {
    expect(normalizeRepositoryUrl("https://codeberg.org/owner/repo")).toBe(
      "https://codeberg.org/owner/repo",
    );
  });
});

describe("repositoryOwner", () => {
  test("reads the owner from the known forges", () => {
    expect(repositoryOwner("https://github.com/withastro/astro")).toBe(
      "withastro",
    );
    expect(repositoryOwner("https://gitlab.com/group/project")).toBe("group");
    expect(repositoryOwner("https://bitbucket.org/team/repo")).toBe("team");
  });

  test("is undefined for anything else", () => {
    expect(repositoryOwner("https://codeberg.org/owner/repo")).toBeUndefined();
    expect(repositoryOwner("")).toBeUndefined();
  });
});

describe("parsePackageJson", () => {
  test("collects runtime, optional and dev dependencies", () => {
    const names = parsePackageJson(
      JSON.stringify({
        dependencies: { astro: "^7.2.0" },
        optionalDependencies: { sharp: "^0.33.0" },
        devDependencies: { oxlint: "^1.78.0" },
      }),
    );
    expect(names.toSorted()).toEqual(["astro", "oxlint", "sharp"]);
  });

  test("tolerates missing groups and malformed JSON", () => {
    expect(parsePackageJson(JSON.stringify({ name: "x" }))).toEqual([]);
    expect(parsePackageJson("{ not json")).toEqual([]);
  });
});

describe("parseGoMod", () => {
  const goMod = `module github.com/newgentdigital/example

go 1.24

require github.com/single/dep v1.2.3

require (
	github.com/gofiber/fiber/v2 v2.52.0
	golang.org/x/sync v0.10.0
	// a comment
	github.com/indirect/thing v1.0.0 // indirect
)
`;

  test("reads both block and single-line requires", () => {
    expect(parseGoMod(goMod).toSorted()).toEqual([
      "github.com/gofiber/fiber/v2",
      "github.com/single/dep",
      "golang.org/x/sync",
    ]);
  });

  test("skips indirect pins, which are the tree and not our choices", () => {
    expect(parseGoMod(goMod)).not.toContain("github.com/indirect/thing");
  });

  test("returns nothing for a module with no requires", () => {
    expect(parseGoMod("module example.com/x\n\ngo 1.24\n")).toEqual([]);
  });
});

describe("parseCargoToml", () => {
  const cargo = `[package]
name = "app"
version = "0.1.0"

[dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }
renamed = { version = "2", package = "real-crate" }
local = { path = "../local" }
shared = { workspace = true }

[build-dependencies]
tauri-build = "2"

[target.'cfg(unix)'.dependencies]
nix = "0.29"

[profile.release]
opt-level = 3
`;

  test("collects dependency, build-dependency and target sections", () => {
    expect(parseCargoToml(cargo).toSorted()).toEqual([
      "nix",
      "real-crate",
      "serde",
      "tauri-build",
      "tokio",
    ]);
  });

  test("prefers an explicit package rename over the key", () => {
    expect(parseCargoToml(cargo)).toContain("real-crate");
    expect(parseCargoToml(cargo)).not.toContain("renamed");
  });

  test("skips path and workspace entries, which are local code", () => {
    const names = parseCargoToml(cargo);
    expect(names).not.toContain("local");
    expect(names).not.toContain("shared");
  });

  test("ignores non-dependency sections", () => {
    expect(parseCargoToml(cargo)).not.toContain("opt-level");
  });

  test("strips comments", () => {
    expect(parseCargoToml('[dependencies]\nserde = "1.0" # pinned\n')).toEqual([
      "serde",
    ]);
  });
});

describe("parseRemoteManifestUrl", () => {
  test("reads the github:// shorthand, defaulting the ref to main", () => {
    expect(
      parseRemoteManifestUrl("github://owner/repo/path/package.json"),
    ).toEqual({
      owner: "owner",
      repo: "repo",
      filePath: "path/package.json",
      ref: "main",
    });
  });

  test("honours an explicit ref on the shorthand", () => {
    expect(
      parseRemoteManifestUrl("github://owner/repo/go.mod?ref=develop"),
    ).toEqual({
      owner: "owner",
      repo: "repo",
      filePath: "go.mod",
      ref: "develop",
    });
  });

  test("reads the refs/heads form of a raw URL", () => {
    expect(
      parseRemoteManifestUrl(
        "https://raw.githubusercontent.com/newgentdigital/discern/refs/heads/main/package.json",
      ),
    ).toEqual({
      owner: "newgentdigital",
      repo: "discern",
      ref: "main",
      filePath: "package.json",
    });
  });

  test("reads the short form of a raw URL", () => {
    expect(
      parseRemoteManifestUrl(
        "https://raw.githubusercontent.com/owner/repo/v1.2.3/sub/Cargo.toml",
      ),
    ).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "v1.2.3",
      filePath: "sub/Cargo.toml",
    });
  });

  test("reads a github.com blob URL", () => {
    expect(
      parseRemoteManifestUrl(
        "https://github.com/owner/repo/blob/main/src-tauri/Cargo.toml",
      ),
    ).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "main",
      filePath: "src-tauri/Cargo.toml",
    });
  });

  test("rejects shapes it cannot address", () => {
    expect(parseRemoteManifestUrl("github://owner/repo")).toBeNull();
    expect(parseRemoteManifestUrl("not a url")).toBeNull();
    expect(
      parseRemoteManifestUrl("https://example.com/package.json"),
    ).toBeNull();
  });
});
