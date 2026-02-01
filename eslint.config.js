import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/**",
      ".venv/**",
      ".claude/**",
      "dist/**",
      "build/**",
      "*.min.js",
      "eslint.config.js",
      "**/*.app.js", // React JSX files - handled by browser
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // 基本規則
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "warn",

      // 程式碼品質
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",

      // 風格（由 Prettier 處理，這裡只保留邏輯性規則）
      "no-trailing-spaces": "off",
      "comma-dangle": "off",
      quotes: "off",
      semi: "off",
    },
  },
  prettier,
];
