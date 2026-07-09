import { mdToPdf } from "md-to-pdf";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pdf = await mdToPdf(
    { path: resolve(__dirname, "../src/data/resume.md") },
    {
        dest: resolve(
            __dirname,
            "../public/downloads/ignacy-radlinski-resume.pdf",
        ),
        stylesheet: [resolve(__dirname, "resume-pdf.css")],
        pdf_options: {
            format: "A4",
            margin: {
                top: "0.5in",
                bottom: "0.5in",
                left: "0.5in",
                right: "0.5in",
            },
            printBackground: false,
        },
        page_media_type: "print",
    },
);

console.log(`PDF saved to ${pdf.filename}`);
