import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

/**
 * Step 1: Crawl Sanskrit Wikisource Rig Veda collection politely and cache HTML locally.
 * 
 * Objective (from rigveda.md):
 * "Crawl the website (preferably once) iff needed to minimize burden on their website."
 */

const RAW_DIR = path.resolve("data/raw/rigveda");
const BASE_DOMAIN = "https://sa.wikisource.org";
const DELAY_MS = 1500; // 1.5 second polite delay between requests (Wikimedia policy)
const CONCURRENT_LIMIT = 1; // Strictly sequential

// Devanagari numerals to Arabic numerals mapping
const DEV_TO_ARABIC_MAP: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"
};

const ARABIC_TO_DEV_MAP: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९"
};

function devanagariToArabic(str: string): string {
  return str.replace(/[०-९]/g, match => DEV_TO_ARABIC_MAP[match] || match);
}

function arabicToDevanagari(str: string): string {
  return str.replace(/[0-9]/g, match => ARABIC_TO_DEV_MAP[match] || match);
}

function padZero(numStr: string, length = 2): string {
  return numStr.padStart(length, "0");
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() && stats.size > 0;
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ProjectVyasa-CurationBot/1.0 (+https://github.com/project-vyasa; contact@project-vyasa.org)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = attempt * 2000;
      console.warn(`[Crawl] Error fetching ${url} (attempt ${attempt}/${retries}): ${err instanceof Error ? err.message : err}. Retrying in ${backoff}ms...`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

export async function crawlWikisourceRigVeda() {
  await ensureDir(RAW_DIR);
  console.log(`[Crawl] Initializing Rig Veda crawl from ${BASE_DOMAIN}...`);
  console.log(`[Crawl] Polite rate limit: ${CONCURRENT_LIMIT} concurrent request(s), ${DELAY_MS}ms delay.`);

  const suktaUrls: { mandala: string; sukta: string; url: string; targetPath: string }[] = [];

  // 1. Enumerate all 10 Mandala index pages
  for (let mandalaNum = 1; mandalaNum <= 10; mandalaNum++) {
    const devMandala = arabicToDevanagari(mandalaNum.toString());
    const mandalaTitle = `ऋग्वेदः_मण्डल_${devMandala}`;
    const encodedTitle = encodeURIComponent(mandalaTitle);
    const indexUrl = `${BASE_DOMAIN}/wiki/${encodedTitle}`;
    
    const mandalaDir = padZero(mandalaNum.toString(), 2);
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
      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    // Parse links to individual Suktas
    const $ = cheerio.load(indexHtml);
    $("a").each((_, el) => {
      const rawHref = $(el).attr("href");
      if (!rawHref) return;
      
      try {
        const decodedHref = decodeURIComponent(rawHref);
        // Match /wiki/ऋग्वेदः_सूक्तं_<mandala>.<sukta>
        const match = decodedHref.match(/^\/wiki\/ऋग्वेदः_सूक्तं_([०-९0-9]+)\.([०-९0-9]+)$/);
        if (match) {
          const mNum = padZero(devanagariToArabic(match[1]!), 2);
          const sNum = padZero(devanagariToArabic(match[2]!), 3);
          const filename = `${mNum}-${sNum}.html`;
          const targetPath = path.join(RAW_DIR, mNum, filename);
          const fullUrl = rawHref.startsWith("http") ? rawHref : `${BASE_DOMAIN}${rawHref}`;
          
          if (!suktaUrls.some(s => s.targetPath === targetPath)) {
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

  // 2. Sequential polite fetching
  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < suktaUrls.length; i++) {
    const item = suktaUrls[i]!;
    await ensureDir(path.dirname(item.targetPath));

    if (await fileExists(item.targetPath)) {
      skippedCount++;
      if ((i + 1) % 50 === 0 || i === suktaUrls.length - 1) {
        console.log(`[Crawl] Progress: [${i + 1}/${suktaUrls.length}] Skipped existing (total skipped: ${skippedCount}, downloaded: ${downloadedCount})`);
      }
      continue;
    }

    try {
      console.log(`[Crawl] [${i + 1}/${suktaUrls.length}] Fetching Sukta ${item.mandala}.${item.sukta}...`);
      const htmlContent = await fetchWithRetry(item.url);
      await fs.writeFile(item.targetPath, htmlContent, "utf-8");
      downloadedCount++;

      // Polite sleep between requests
      if (i < suktaUrls.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    } catch (err) {
      errorCount++;
      console.error(`[Crawl] [ERROR] Failed to download Sukta ${item.mandala}.${item.sukta}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\n[Crawl] Summary:");
  console.log(`- Total Suktas in Indices: ${suktaUrls.length}`);
  console.log(`- Newly Downloaded       : ${downloadedCount}`);
  console.log(`- Cached (Skipped)       : ${skippedCount}`);
  console.log(`- Errors                 : ${errorCount}`);
  console.log(`[Crawl] Completed. Cached HTML files are stored in ${RAW_DIR}`);
}

if (import.meta.main) {
  crawlWikisourceRigVeda().catch(console.error);
}
