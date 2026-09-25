import fs from "node:fs/promises";
import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { adhyayaSlugToNumber, parseAdhyayaIndexLinks } from "../lib/wikisource-index";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";
import { readWikitextFromParseJson } from "../extract/parse-tts";

/**
 * Download Kaushitaki Brāhmaṇa adhyāya pages from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:kb
 *   bun run src/crawl/kb.ts --force
 */

const RAW_DIR = path.resolve("data/raw/kaushitaki-brahmana");

export const KB_ROOT = "कौषीतकिब्राह्मणम्";
export const KB_INDEX_FILE = "index.wikitext.json";

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function kbAdhyayaTitle(slug: string): string {
  return `${KB_ROOT}/अध्यायः ${slug}`;
}

export function kbSourceUrl(slug: string): string {
  return wikiPageUrl(kbAdhyayaTitle(slug));
}

export async function listKbAdhyayaSlugs(): Promise<string[]> {
  const indexPath = path.join(RAW_DIR, "wikitext", KB_INDEX_FILE);
  const raw = await fs.readFile(indexPath, "utf8");
  return parseAdhyayaIndexLinks(readWikitextFromParseJson(raw));
}

export async function crawlKaushitakiBrahmana(opts: { force?: boolean } = {}) {
  const indexTarget = {
    url: wikisourceParseUrl(KB_ROOT),
    cachePath: path.join(RAW_DIR, "wikitext", KB_INDEX_FILE),
    label: "KB index",
  };

  console.log("[Crawl] Kaushitaki Brahmana from sa.wikisource.org");
  const firstPass = await crawlCached([indexTarget], { force: opts.force });
  const slugs = await listKbAdhyayaSlugs();

  const targets = slugs.map((slug) => {
    const n = adhyayaSlugToNumber(slug);
    return {
      url: wikisourceParseUrl(kbAdhyayaTitle(slug)),
      cachePath: path.join(RAW_DIR, "wikitext", `adhyaya-${pad2(n)}.wikitext.json`),
      label: `KB adhyāya ${n}`,
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
  crawlKaushitakiBrahmana({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
