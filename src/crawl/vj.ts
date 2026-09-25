import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

const RAW_DIR = path.resolve("data/raw/vedanga-jyotisha");

export const VJ_PAGE = {
  title: "वेदाङ्गज्योतिषम्",
  file: "jyotisha.wikitext.json",
} as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function vjSourceUrl(): string {
  return wikiPageUrl(VJ_PAGE.title);
}

export async function crawlVedangaJyotisha(opts: { force?: boolean } = {}) {
  const targets = [
    {
      url: wikisourceParseUrl(VJ_PAGE.title),
      cachePath: path.join(RAW_DIR, VJ_PAGE.file),
      label: "Vedanga Jyotisha",
    },
  ];
  console.log("[Crawl] Vedanga Jyotisha (1 page) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });
  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
}

if (import.meta.main) {
  crawlVedangaJyotisha({ force: process.argv.includes("--force") }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
