import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  arabicToDevanagari,
  devanagariToArabic,
  pad2,
  pad3,
} from "../lib/devanagari-numerals";
import {
  DELAY_MS,
  WIKISOURCE_ORIGIN,
  crawlCached,
  ensureDir,
  fileExists,
  fetchWithRetry,
} from "../lib/wikimedia";

/**
 * Step 1: Crawl Sanskrit Wikisource Rig Veda collection politely and cache HTML locally.
 *
 * Objective (from rigveda.md):
 * "Crawl the website (preferably once) iff needed to minimize burden on their website."
 */

const RAW_DIR = path.resolve("data/raw/rigveda");

export async function crawlWikisourceRigVeda() {
  await ensureDir(RAW_DIR);
  console.log(`[Crawl] Initializing Rig Veda crawl from ${WIKISOURCE_ORIGIN}...`);
  console.log(`[Crawl] Polite rate limit: 1 concurrent request(s), ${DELAY_MS}ms delay.`);

  const suktaUrls: { mandala: string; sukta: string; url: string; targetPath: string }[] = [];

  for (let mandalaNum = 1; mandalaNum <= 10; mandalaNum++) {
    const devMandala = arabicToDevanagari(mandalaNum.toString());
    const mandalaTitle = `ऋग्वेदः_मण्डल_${devMandala}`;
    const encodedTitle = encodeURIComponent(mandalaTitle);
    const indexUrl = `${WIKISOURCE_ORIGIN}/wiki/${encodedTitle}`;

    const mandalaDir = pad2(mandalaNum);
    const indexCachePath = path.join(RAW_DIR, mandalaDir, "index.html");
    await ensureDir(path.dirname(indexCachePath));

    let indexHtml: string;
    if (await fileExists(indexCachePath)) {
      console.log(`[Crawl] Using cached Mandala ${mandalaNum} index: ${indexCachePath}`);
      indexHtml = await fs.readFile(indexCachePath, "utf-8");
    } else {
      console.log(`[Crawl] Fetching Mandala ${mandalaNum} index from ${indexUrl}...`);
      indexHtml = await fetchWithRetry(indexUrl);
      await fs.writeFile(indexCachePath, indexHtml, "utf-8");
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const $ = cheerio.load(indexHtml);
    $("a").each((_, el) => {
      const rawHref = $(el).attr("href");
      if (!rawHref) return;

      try {
        const decodedHref = decodeURIComponent(rawHref);
        const match = decodedHref.match(/^\/wiki\/ऋग्वेदः_सूक्तं_([०-९0-9]+)\.([०-९0-9]+)$/);
        if (match) {
          const mNum = pad2(Number(devanagariToArabic(match[1]!)));
          const sNum = pad3(Number(devanagariToArabic(match[2]!)));
          const filename = `${mNum}-${sNum}.html`;
          const targetPath = path.join(RAW_DIR, mNum, filename);
          const fullUrl = rawHref.startsWith("http") ? rawHref : `${WIKISOURCE_ORIGIN}${rawHref}`;

          if (!suktaUrls.some((s) => s.targetPath === targetPath)) {
            suktaUrls.push({ mandala: mNum, sukta: sNum, url: fullUrl, targetPath });
          }
        }
      } catch {
        // Ignore invalid URL encodings
      }
    });
  }

  console.log(`[Crawl] Found ${suktaUrls.length} target Sukta pages across all 10 Mandalas.`);

  if (suktaUrls.length === 0) {
    console.error("[Crawl] Error: No Sukta links found in Mandala index pages! Please check DOM selectors.");
    return;
  }

  const result = await crawlCached(
    suktaUrls.map((item) => ({
      url: item.url,
      cachePath: item.targetPath,
      label: `Sukta ${item.mandala}.${item.sukta}`,
    })),
  );

  console.log("\n[Crawl] Summary:");
  console.log(`- Total Suktas in Indices: ${suktaUrls.length}`);
  console.log(`- Newly Downloaded       : ${result.downloaded}`);
  console.log(`- Cached (Skipped)       : ${result.skipped}`);
  console.log(`- Errors                 : ${result.errors}`);
  console.log(`[Crawl] Completed. Cached HTML files are stored in ${RAW_DIR}`);
}

if (import.meta.main) {
  crawlWikisourceRigVeda().catch(console.error);
}
