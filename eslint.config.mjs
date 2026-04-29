import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/.turbo/**",
    "**/dist/**",
    "**/pnpm-lock.yaml",
    "**/pnpm-workspace.yaml",
    "**/*.min.js",
    "next-env.d.ts",
    "coverage",
  ]),
  {
    settings: {
      next: {
        rootDir: ["apps/*/"],
      },
    },
  },
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
