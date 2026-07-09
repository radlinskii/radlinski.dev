// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: "https://radlinski.dev",
    markdown: {
        processor: unified({
            remarkPlugins: [[remarkToc, { heading: "Contents", maxDepth: 3 }]],
            rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap" }],
            ],
        }),
    },
    integrations: [mdx(), sitemap()],
});
