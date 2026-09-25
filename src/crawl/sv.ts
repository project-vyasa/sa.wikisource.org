import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Kauthuma Sāmaveda accented dump from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:sv
 *   bun run src/crawl/sv.ts --force
 */

const RAW_DIR = path.resolve("data/raw/kauthuma-samhita");

export const SV_ACCENTED_PAGE = {
  title: "सामवेदः/कौथुमीया/संहिता/सस्वरा पूर्णा",
  file: "samhita.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function svSourceUrl(): string {
  return wikiPageUrl(SV_ACCENTED_PAGE.title);
}

export async function crawlKauthumaSamhita(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(SV_ACCENTED_PAGE.title),
      cachePath: path.join(RAW_DIR, "accented", SV_ACCENTED_PAGE.file),
      label: "Kauthuma SV accented dump",
    },
  ];

  console.log("[Crawl] Kauthuma Samaveda (" + String(targets.length) + " page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlKauthumaSamhita({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
