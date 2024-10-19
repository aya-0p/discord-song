//@ts-check
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  { ignores: ["**/*.js", "**/*.js.map", ".git/"] },
  {
    files: ["**/*.ts"],
    extends: [
      pluginJs.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "@typescript-eslint": tseslint.plugin, perfectionist },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "no-implicit-coercion": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "prefer-template": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/require-array-sort-compare": "warn",
      curly: "error",
      "perfectionist/sort-objects": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
      "perfectionist/sort-union-types": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
      "@typescript-eslint/no-deprecated": "warn",
    },
  },
  prettier,
);
