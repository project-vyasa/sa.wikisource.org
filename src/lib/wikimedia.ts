import fs from "node:fs/promises";
import path from "node:path";

export const WIKISOURCE_ORIGIN = "https://sa.wikisource.org";
export const DELAY_MS = 1500;
export const USER_AGENT =
  "ProjectVyasa-CurationBot/1.0 (+https://github.com/project-vyasa; contact@project-vyasa.org)";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() && stats.size > 0;
  } catch {
    return false;
  }
}

export async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = attempt * 2000;
      console.warn(
        `[Crawl] Error fetching ${url} (attempt ${attempt}/${retries}): ${err instanceof Error ? err.message : err}. Retrying in ${backoff}ms...`,
      );
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

/** MediaWiki parse API URL for a page title (spaces, not underscores). */
export function wikisourceParseUrl(title: string): string {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
    formatversion: "2",
  });
  return `${WIKISOURCE_ORIGIN}/w/api.php?${params.toString()}`;
}

export interface CrawlTarget {
  url: string;
  cachePath: string;
  label: string;
}

export async function crawlCached(
  targets: CrawlTarget[],
  opts: { force?: boolean; delayMs?: number } = {},
): Promise<{ downloaded: number; skipped: number; errors: number }> {
  const delayMs = opts.delayMs ?? DELAY_MS;
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i]!;
    await ensureDir(path.dirname(item.cachePath));

    if (!opts.force && (await fileExists(item.cachePath))) {
      skipped += 1;
      console.log(`[Crawl] [${i + 1}/${targets.length}] Cached ${item.label}`);
      continue;
    }

    try {
      console.log(`[Crawl] [${i + 1}/${targets.length}] Fetching ${item.label}...`);
      const body = await fetchWithRetry(item.url);
      await fs.writeFile(item.cachePath, body, "utf-8");
      downloaded += 1;
      if (i < targets.length - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (err) {
      errors += 1;
      console.error(
        `[Crawl] [ERROR] ${item.label}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { downloaded, skipped, errors };
}
