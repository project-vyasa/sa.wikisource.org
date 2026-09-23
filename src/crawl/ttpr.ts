import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Taittirīya-Prātiśākhya from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:ttpr
 *   bun run src/crawl/ttpr.ts --force
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-pratisakhya");

export const TTPR_PAGE = {
  title: "तैत्तरीयप्रातिशाख्यम्",
  file: "pratisakhya.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function ttprSourceUrl(): string {
  return wikiPageUrl(TTPR_PAGE.title);
}

export async function crawlTaittiriyaPratisakhya(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(TTPR_PAGE.title),
      cachePath: path.join(RAW_DIR, TTPR_PAGE.file),
      label: "TTPr sūtra page",
    },
  ];

  console.log("[Crawl] Taittiriya Pratisakhya (" + String(targets.length) + " page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlTaittiriyaPratisakhya({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
