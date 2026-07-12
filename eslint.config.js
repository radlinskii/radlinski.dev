import eslintPluginAstro from "eslint-plugin-astro";
import eslint from "@eslint/js";

export default [
    {
        ignores: ["dist/", "_dist/", ".astro/", "node_modules/"],
    },
    eslint.configs.recommended,
    ...eslintPluginAstro.configs.recommended,
    ...eslintPluginAstro.configs["jsx-a11y-recommended"],
    {
        rules: {
            "astro/no-set-html-directive": "error",
            "no-console": "error",
        },
    },
];
