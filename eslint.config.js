import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      ".astro/",
      ".wrangler/",
      "dist/",
      "node_modules/",
      "src/env.d.ts",
      "worker-configuration.d.ts",
    ],
  },

  {
    files: ["**/*.astro"],
    extends: [
      eslintPluginAstro.configs.recommended,
      eslintPluginAstro.configs["jsx-a11y-strict"],
    ],
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [tseslint.configs.strict, tseslint.configs.stylistic],
  },

  {
    files: ["**/*.js", "**/*.jsx"],
    extends: [eslint.configs.recommended],
  },
]);
