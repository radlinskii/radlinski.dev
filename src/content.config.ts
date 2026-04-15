import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const posts = defineCollection({
    loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/data/posts" }),

    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
        heroImageAlt: z.string().optional(),
        tldr: z.string(),
    }),
});

export const collections = { posts };
