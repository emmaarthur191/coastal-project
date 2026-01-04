import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooks,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // TypeScript rules
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",

            // General code quality
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "error",
            "no-unused-expressions": "error",
        },
    },
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "src/api/**",
            "*.config.js",
            "*.config.ts",
            "server.js",
        ],
    }
);
