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
                    children: [
                        {
                            type: "element",
                            tagName: "span",
                            properties: { class: "copy-icon" },
                            children: [
                                {
                                    type: "element",
                                    tagName: "svg",
                                    properties: {
                                        xmlns: "http://www.w3.org/2000/svg",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        "stroke-width": "2",
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        width: "16",
                                        height: "16",
                                    },
                                    children: [
                                        {
                                            type: "element",
                                            tagName: "rect",
                                            properties: {
                                                x: "9",
                                                y: "9",
                                                width: "13",
                                                height: "13",
                                                rx: "2",
                                                ry: "2",
                                            },
                                            children: [],
                                        },
                                        {
                                            type: "element",
                                            tagName: "path",
                                            properties: {
                                                d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
                                            },
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "element",
                            tagName: "span",
                            properties: { class: "check-icon" },
                            children: [
                                {
                                    type: "element",
                                    tagName: "svg",
                                    properties: {
                                        xmlns: "http://www.w3.org/2000/svg",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        "stroke-width": "2",
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        width: "16",
                                        height: "16",
                                    },
                                    children: [
                                        {
                                            type: "element",
                                            tagName: "polyline",
                                            properties: {
                                                points: "20 6 9 17 4 12",
                                            },
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];
        },
    };
}
