import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Layer rules mirror the architecture in docs/execution-plan.md (section 5.1):
// the domain imports nothing from the project, the design system knows nothing
// about features, and client-reachable code never imports server-only layers.
const LAYERS = [
  "domain",
  "schemas",
  "ds",
  "lib",
  "content",
  "entitlements",
  "data",
  "server",
  "sync",
  "features",
  "app",
];

const allow = (from, to) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: to } } } },
});

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "reports/**", "next-env.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactHooks.configs.flat["recommended-latest"].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
      "boundaries/elements": LAYERS.map((type) => ({
        type,
        pattern: `src/${type}`,
      })),
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            allow("domain", ["domain"]),
            allow("lib", ["lib"]),
            allow("content", ["content"]),
            allow("schemas", ["schemas", "domain"]),
            allow("ds", ["ds", "lib"]),
            allow("entitlements", ["entitlements", "domain"]),
            allow("data", ["data", "domain", "schemas", "lib"]),
            allow("server", ["server", "data", "domain", "schemas", "lib", "entitlements"]),
            allow("sync", ["sync", "domain", "schemas", "lib"]),
            allow("features", [
              "features",
              "ds",
              "data",
              "server",
              "domain",
              "schemas",
              "sync",
              "content",
              "entitlements",
              "lib",
            ]),
            allow("app", LAYERS),
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["scripts/**/*.ts", "*.config.{ts,mjs}"],
    rules: { "no-console": "off" },
  },
  prettier,
);
