import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
// Direct import avoids pdf-parse's debug branch that loads a sample file.
// @ts-expect-error no types for the deep import
import pdf from "pdf-parse/lib/pdf-parse.js";

export type ExtractedDoc = {
  text: string;
  meta: {
    pageCount?: number;
    title?: string;
    url?: string;
    contentType?: "pdf" | "html" | "text";
  };
};

export async function extractPdf(buffer: Buffer): Promise<ExtractedDoc> {
  const result = await pdf(buffer);
  return {
    text: cleanText(result.text),
    meta: {
      pageCount: result.numpages,
      title: result.info?.Title,
      contentType: "pdf",
    },
  };
}

export function extractPlainText(text: string): ExtractedDoc {
  return { text: cleanText(text), meta: { contentType: "text" } };
}

/**
 * Extract the main readable content from an HTML page using Mozilla's Readability.
 * Strips nav, footer, sidebars, ads. Same logic as Firefox Reader View.
 */
export function extractHtml(html: string, url: string): ExtractedDoc {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length < 100) {
    // Fallback: raw text content from body.
    const bodyText = dom.window.document.body?.textContent ?? "";
    return {
      text: cleanText(bodyText),
      meta: { url, title: dom.window.document.title, contentType: "html" },
    };
  }

  return {
    text: cleanText(article.textContent),
    meta: {
      url,
      title: article.title ?? dom.window.document.title,
      contentType: "html",
    },
  };
}

function cleanText(s: string): string {
  return s
    .replace(/-\n(\w)/g, "$1") // hyphenated line breaks
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
