import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        root: true,
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
        extends: [
            "eslint:recommended",
            "plugin:react/recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:react-hooks/recommended",
        ],
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            project: true,
            tsconfigRootDir: ".",
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
        overrides: [
            {
                files: ["packages/client/src/**/*.ts", "packages/client/src/**/*.tsx"],
                plugins: ["react-hooks"],
                extends: ["plugin:react/recommended", "plugin:react/jsx-runtime", "plugin:react-hooks/recommended"],
                settings: {
                    react: {
                        version: "detect",
                    },
                },
                rules: {
                    "react/prop-types": "off",
                    "react/self-closing-comp": "error",
                },
            },
            {
                files: ["packages/server/src/**/*.ts"],
                rules: {},
            },
        ],
    },
]);
