import path from "node:path";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Taittirīya Saṃhitā accented dumps from sa.wikisource.org.
 *
 * Usage:
 *   bun run crawl:tts
 *   bun run src/crawl/tts.ts --force
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-samhita");

export const TTS_ACCENTED_PAGES = [
  { title: "तैत्तिरीयसंहिता-१-४", file: "kanda-01-04.wikitext.json", kandas: "1–4" },
  { title: "तैत्तिरीयसंहिता-५-७", file: "kanda-05-07.wikitext.json", kandas: "5–7" },
] as const;

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function ttsSourceUrlForKanda(kanda: number): string {
  const page = kanda <= 4 ? TTS_ACCENTED_PAGES[0] : TTS_ACCENTED_PAGES[1];
  return wikiPageUrl(page.title);
}

export async function crawlTaittiriyaSamhita(opts: { force?: boolean } = {}) {
  const targets = TTS_ACCENTED_PAGES.map((p) => ({
    url: wikisourceParseUrl(p.title),
    cachePath: path.join(RAW_DIR, "accented", p.file),
    label: `TTS accented kāṇḍa ${p.kandas}`,
  }));

  console.log("[Crawl] Taittiriya Samhita (" + String(targets.length) + " pages) from sa.wikisource.org");
  const result = await crawlCached(targets, { force: opts.force });

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlTaittiriyaSamhita({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
