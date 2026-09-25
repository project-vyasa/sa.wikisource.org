import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Gopatha Brāhmaṇa single-page dump from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:gp
 *   bun run src/crawl/gp.ts --force
 */

const RAW_DIR = path.resolve("data/raw/gopatha-brahmana");

export const GP_PAGE = {
  title: "गोपथब्राह्मणम्",
  file: "gopatha.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function gpSourceUrl(): string {
  return wikiPageUrl(GP_PAGE.title);
}

export async function crawlGopathaBrahmana(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(GP_PAGE.title),
      cachePath: path.join(RAW_DIR, GP_PAGE.file),
      label: "Gopatha Brahmana dump",
    },
  ];

  console.log("[Crawl] Gopatha Brahmana (1 page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlGopathaBrahmana({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
