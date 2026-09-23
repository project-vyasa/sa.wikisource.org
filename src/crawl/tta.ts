import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Taittirīya Āraṇyaka accented dump from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:tta
 *   bun run src/crawl/tta.ts --force
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-aranyaka");

export const TTA_ACCENTED_PAGE = {
  title: "तैत्तिरीय-आरण्यकम्",
  file: "aranyaka.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function ttaSourceUrl(): string {
  return wikiPageUrl(TTA_ACCENTED_PAGE.title);
}

export async function crawlTaittiriyaAranyaka(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(TTA_ACCENTED_PAGE.title),
      cachePath: path.join(RAW_DIR, "accented", TTA_ACCENTED_PAGE.file),
      label: "TTA accented dump",
    },
  ];

  console.log("[Crawl] Taittiriya Aranyaka (" + String(targets.length) + " page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlTaittiriyaAranyaka({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
