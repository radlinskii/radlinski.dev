import type { ShikiTransformer } from "shiki";

export function myCopyButtonTransformer(): ShikiTransformer {
    return {
        name: "copy-button",
        pre(node) {
            const scrollWrapper = {
                type: "element" as const,
                tagName: "div",
                properties: { class: "code-scroll-wrapper" },
                children: node.children,
            };

            node.children = [
                scrollWrapper,
                {
                    type: "element" as const,
                    tagName: "button",
                    properties: {
                        type: "button",
                        class: "copy-btn",
                        title: "Copy code to clipboard",
                    },
                    children: [{ type: "text", value: "copy" }],
                },
            ];
        },
    };
}
