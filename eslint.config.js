import eslintPluginAstro from "eslint-plugin-astro";
import eslint from "@eslint/js";

export default [
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
