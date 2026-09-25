import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { adhyayaSlugToNumber, parseAdhyayaIndexLinks } from "../lib/wikisource-index";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";
import { readWikitextFromParseJson } from "../extract/parse-tts";

/**
 * Download Pañcaviṃśa Brāhmaṇa adhyāya pages from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:pv
 *   bun run src/crawl/pv.ts --force
 */

const RAW_DIR = path.resolve("data/raw/panchavimsha-brahmana");

export const PV_ROOT = "पञ्चविंशब्राह्मणम्";
export const PV_INDEX_FILE = "index.wikitext.json";

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function pvAdhyayaTitle(slug: string): string {
  return `${PV_ROOT}/अध्यायः ${slug}`;
}

export function pvSourceUrl(slug: string): string {
  return wikiPageUrl(pvAdhyayaTitle(slug));
}

export async function listPvAdhyayaSlugs(): Promise<string[]> {
  const indexPath = path.join(RAW_DIR, "wikitext", PV_INDEX_FILE);
  const raw = await fs.readFile(indexPath, "utf8");
  return parseAdhyayaIndexLinks(readWikitextFromParseJson(raw));
}

export async function crawlPanchavimshaBrahmana(opts: { force?: boolean } = {}) {
  const indexTarget = {
    url: wikisourceParseUrl(PV_ROOT),
    cachePath: path.join(RAW_DIR, "wikitext", PV_INDEX_FILE),
    label: "PV index",
  };

  console.log("[Crawl] Pañcaviṃśa Brahmana from sa.wikisource.org");
  const firstPass = await crawlCached([indexTarget], { force: opts.force });
  const slugs = await listPvAdhyayaSlugs();

  const targets = slugs.map((slug) => {
    const n = adhyayaSlugToNumber(slug);
    return {
      url: wikisourceParseUrl(pvAdhyayaTitle(slug)),
      cachePath: path.join(RAW_DIR, "wikitext", `adhyaya-${pad2(n)}.wikitext.json`),
      label: `PV adhyāya ${n}`,
    };
  });

  const second = targets.length
    ? await crawlCached(targets, { force: opts.force })
    : { downloaded: 0, skipped: 0, errors: 0 };

  console.log("\n[Crawl] Summary:");
  console.log("- Adhyāyas         : " + String(targets.length));
  console.log("- Newly Downloaded : " + String(firstPass.downloaded + second.downloaded));
  console.log("- Cached (Skipped) : " + String(firstPass.skipped + second.skipped));
  console.log("- Errors           : " + String(firstPass.errors + second.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlPanchavimshaBrahmana({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
