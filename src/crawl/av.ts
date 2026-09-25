import fs from "node:fs/promises";
import path from "node:path";
import { arabicToDevanagari, pad2 } from "../lib/devanagari-numerals";
import {
  DELAY_MS,
  ensureDir,
  fetchWithRetry,
  fileExists,
  wikisourceParseUrl,
} from "../lib/wikimedia";

/**
 * Download Atharvaveda Śaunaka consolidated kāṇḍa pages from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:av
 *   bun run src/crawl/av.ts --force
 */

const RAW_DIR = path.resolve("data/raw/atharvaveda-saunaka");

/** Alternate titles when the primary consolidated page is missing. */
export const AV_KANDA_FALLBACK: Partial<Record<number, string>> = {
  2: "अथर्ववेदः/अथर्ववेद: काण्डं २",
};

export function avKandaTitle(kanda: number): string {
  return `अथर्ववेदः/काण्डं ${arabicToDevanagari(String(kanda))}`;
}

export function avKandaTitles(kanda: number): string[] {
  const primary = avKandaTitle(kanda);
  const fallback = AV_KANDA_FALLBACK[kanda];
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function avSourceUrl(kanda: number): string {
  return wikiPageUrl(avKandaTitle(kanda));
}

export function avKandaPages(): Array<{ kanda: number; title: string; file: string }> {
  return Array.from({ length: 20 }, (_, i) => {
    const kanda = i + 1;
    return {
      kanda,
      title: avKandaTitle(kanda),
      file: `kanda-${pad2(kanda)}.wikitext.json`,
    };
  });
}

export async function crawlAtharvavedaSaunaka(opts: { force?: boolean } = {}) {
  const pages = avKandaPages();
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  console.log("[Crawl] Atharvaveda Saunaka (" + String(pages.length) + " pages) from sa.wikisource.org");

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const cachePath = path.join(RAW_DIR, "wikitext", page.file);
    await ensureDir(path.dirname(cachePath));

    if (!opts.force && (await fileExists(cachePath))) {
      skipped += 1;
      console.log(`[Crawl] [${i + 1}/${pages.length}] Cached AV kāṇḍa ${page.kanda}`);
      continue;
    }

    const titles = avKandaTitles(page.kanda);
    let ok = false;
    for (const title of titles) {
      try {
        console.log(`[Crawl] [${i + 1}/${pages.length}] Fetching AV kāṇḍa ${page.kanda} (${title})...`);
        const body = await fetchWithRetry(wikisourceParseUrl(title));
        await fs.writeFile(cachePath, body, "utf-8");
        downloaded += 1;
        ok = true;
        break;
      } catch (err) {
        if (title === titles.at(-1)) {
          errors += 1;
          console.error(
            `[Crawl] [ERROR] AV kāṇḍa ${page.kanda}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
    if (!ok) continue;
    if (i < pages.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(downloaded));
  console.log("- Cached (Skipped) : " + String(skipped));
  console.log("- Errors           : " + String(errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlAtharvavedaSaunaka({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
