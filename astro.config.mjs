// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import sitemap from "@astrojs/sitemap";
import { myCopyButtonTransformer } from "./src/shiki-transformers/my-copy-button";

// https://astro.build/config
export default defineConfig({
    site: "https://radlinski.dev",
    markdown: {
        shikiConfig: {
            themes: {
                light: "everforest-light",
                dark: "everforest-dark",
            },
            defaultColor: false,
            transformers: [myCopyButtonTransformer()],
        },
        processor: unified({
            remarkPlugins: [[remarkToc, { heading: "Contents", maxDepth: 3 }]],
            rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap", test: ["h2", "h3", "h4"] }],
            ],
        }),
    },
    integrations: [mdx(), sitemap()],
});
