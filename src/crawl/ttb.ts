import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Taittirīya Brāhmaṇa accented dump from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:ttb
 *   bun run src/crawl/ttb.ts --force
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-brahmana");

export const TTB_ACCENTED_PAGE = {
  title: "तैत्तिरीयब्राह्मणम्",
  file: "brahmana.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function ttbSourceUrl(): string {
  return wikiPageUrl(TTB_ACCENTED_PAGE.title);
}

export function ttbSourceUrlForKanda(_kanda: number): string {
  return ttbSourceUrl();
}

export async function crawlTaittiriyaBrahmana(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(TTB_ACCENTED_PAGE.title),
      cachePath: path.join(RAW_DIR, "accented", TTB_ACCENTED_PAGE.file),
      label: "TTB accented dump",
    },
  ];

  console.log("[Crawl] Taittiriya Brahmana (" + String(targets.length) + " page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlTaittiriyaBrahmana({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
