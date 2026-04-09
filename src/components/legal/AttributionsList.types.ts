export interface PackageMetadata {
  name: string;
  author?:
    | {
        name?: string;
        url?: string;
        email?: string;
      }
    | string;
  license?: string;
  licenses?: Array<{ type: string }>;
  repository?:
    | {
        url: string;
        type?: string;
      }
    | string;
  homepage?: string;
}

export interface Attribution {
  name: string;
  author: string;
  license: string;
  link: string;
  source: "npm" | "go";
}

/** Set of standard SPDX license identifiers recognized by npm. */
export const STANDARD_LICENSES = new Set([
  "MIT",
  "Apache-2.0",
  "GPL-2.0",
  "GPL-3.0",
  "GPL-3.0-or-later",
  "LGPL-2.1",
  "LGPL-3.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MPL-2.0",
  "AGPL-3.0",
  "AGPL-3.0-or-later",
  "Unlicense",
  "CC0-1.0",
]);
