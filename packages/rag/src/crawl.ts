import robotsParser from "robots-parser";
import { extractHtml } from "./extract";

export type CrawledPage = {
  url: string;
  title?: string;
  text: string;
};

export type CrawlOptions = {
  maxPages?: number;          // default 50
  maxDepth?: number;          // default 3
  sameHostOnly?: boolean;     // default true
  ignorePathPatterns?: RegExp[]; // skip URLs matching any of these
  fetchTimeoutMs?: number;    // default 15000
  userAgent?: string;
  onPage?: (p: CrawledPage) => void; // progress callback
  signal?: AbortSignal;
};

const DEFAULT_IGNORE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff2?|ttf)(\?|$)/i,
  /\/(cart|checkout|login|signin|signup|register|account|search)(\/|$)/i,
  /\?.*utm_/i,
];

const DEFAULT_UA = "helia-bot/0.1 (+https://helia.snowztech.com)";

/**
 * Crawl a website starting from `seedUrl`. BFS, respects robots.txt,
 * extracts main content via Readability, deduplicates by URL and content hash.
 *
 * Why a custom crawler rather than e.g. crawlee:
 *  - Small surface, easy to audit and tune.
 *  - No headless browser overhead (most SMB sites are static).
 *  - Direct control over politeness and limits, crucial when running for
 *    customer sites we don't own.
 */
export async function crawlSite(
  seedUrl: string,
  opts: CrawlOptions = {},
): Promise<CrawledPage[]> {
  const maxPages = opts.maxPages ?? 50;
  const maxDepth = opts.maxDepth ?? 3;
  const sameHostOnly = opts.sameHostOnly ?? true;
  const ignorePatterns = [
    ...DEFAULT_IGNORE_PATTERNS,
    ...(opts.ignorePathPatterns ?? []),
  ];
  const timeoutMs = opts.fetchTimeoutMs ?? 15_000;
  const ua = opts.userAgent ?? DEFAULT_UA;

  const seed = new URL(seedUrl);
  const robots = await fetchRobots(seed.origin, ua, timeoutMs);

  const visited = new Set<string>();
  const seenHashes = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: seed.toString(), depth: 0 }];
  const out: CrawledPage[] = [];

  while (queue.length > 0 && out.length < maxPages) {
    if (opts.signal?.aborted) break;
    const next = queue.shift();
    if (!next) break;
    const { url, depth } = next;

    if (visited.has(url)) continue;
    visited.add(url);

    if (ignorePatterns.some((rx) => rx.test(url))) continue;
    if (robots && !robots.isAllowed(url, ua)) continue;

    const fetched = await fetchPage(url, ua, timeoutMs);
    if (!fetched) continue;

    const extracted = extractHtml(fetched.html, url);
    if (extracted.text.length < 100) continue;

    const hash = simpleHash(extracted.text);
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const page: CrawledPage = {
      url,
      title: extracted.meta.title,
      text: extracted.text,
    };
    out.push(page);
    opts.onPage?.(page);

    if (depth < maxDepth) {
      const links = extractLinks(fetched.html, url);
      for (const link of links) {
        if (visited.has(link)) continue;
        if (sameHostOnly && new URL(link).host !== seed.host) continue;
        queue.push({ url: link, depth: depth + 1 });
      }
    }
  }

  return out;
}

async function fetchRobots(
  origin: string,
  ua: string,
  timeoutMs: number,
): Promise<ReturnType<typeof robotsParser> | null> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetchWithTimeout(robotsUrl, ua, timeoutMs);
    if (!res || !res.ok) return null;
    const txt = await res.text();
    return robotsParser(robotsUrl, txt);
  } catch {
    return null;
  }
}

async function fetchPage(
  url: string,
  ua: string,
  timeoutMs: number,
): Promise<{ html: string } | null> {
  try {
    const res = await fetchWithTimeout(url, ua, timeoutMs);
    if (!res || !res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    const html = await res.text();
    return { html };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(
  url: string,
  ua: string,
  timeoutMs: number,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": ua, accept: "text/html,*/*;q=0.8" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  // Lightweight regex extraction is enough; full cheerio parsing already
  // happens inside Readability for content. We just need anchors here.
  const out: string[] = [];
  const re = /<a\s[^>]*href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href) continue;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const abs = new URL(href, baseUrl).toString();
      // Strip URL fragments
      const clean = abs.split("#")[0]!;
      out.push(clean);
    } catch {
      // ignore malformed URLs
    }
  }
  return out;
}

function simpleHash(s: string): string {
  // Stable, non-cryptographic content hash for dedup.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}
