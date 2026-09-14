import path from "node:path";
import { pad2 } from "../lib/devanagari-numerals";
import { crawlCached, wikisourceParseUrl } from "../lib/wikimedia";

/**
 * Download Aṣṭādhyāyī wikitext once from sa.wikisource.org (MediaWiki API).
 *
 * Usage:
 *   bun run crawl:aady
 *   bun run src/crawl/aady.ts --force
 */

const RAW_DIR = path.resolve("data/raw/ashtadhyayi");

export const ADHYAYA_TITLES = [
  "प्रथमः अध्यायः",
  "द्वितीयः अध्यायः",
  "तृतीयः अध्यायः",
  "चतुर्थः अध्यायः",
  "पञ्चमः अध्यायः",
  "षष्टः अध्यायः",
  "सप्तमः अध्यायः",
  "अष्टमः अध्यायः",
] as const;

export const MULA_ROOT = "अष्टाध्यायी";
export const VYAKHYA_ROOT = "अष्टाध्यायी हिन्दी व्याख्या सहितम्";
export const MAHESHVARA_TITLE = VYAKHYA_ROOT + "/माहेश्वर सूत्राणि";

function wikiPageUrl(title: string): string {
  return "https://sa.wikisource.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));
}

export function aadySourceUrls(adhyaya: number): { mula: string; vyakhya: string } {
  const name = ADHYAYA_TITLES[adhyaya - 1];
  if (!name) throw new Error("Adhyaya " + adhyaya + " out of range 1-8");
  return {
    mula: wikiPageUrl(MULA_ROOT + "/" + name),
    vyakhya: wikiPageUrl(VYAKHYA_ROOT + "/" + name),
  };
}

export async function crawlAshtadhyayi(opts: { force?: boolean } = {}) {
  const targets: Array<{ title: string; cachePath: string; label: string }> = [
    {
      title: MULA_ROOT,
      cachePath: path.join(RAW_DIR, "mula", "index.wikitext.json"),
      label: "mula index",
    },
    {
      title: VYAKHYA_ROOT,
      cachePath: path.join(RAW_DIR, "vyakhya", "index.wikitext.json"),
      label: "vyakhya index",
    },
    {
      title: MAHESHVARA_TITLE,
      cachePath: path.join(RAW_DIR, "vyakhya", "maheshvara.wikitext.json"),
      label: "maheshvara",
    },
  ];

  for (let i = 0; i < ADHYAYA_TITLES.length; i++) {
    const aa = pad2(i + 1);
    const name = ADHYAYA_TITLES[i]!;
    targets.push({
      title: MULA_ROOT + "/" + name,
      cachePath: path.join(RAW_DIR, "mula", aa + ".wikitext.json"),
      label: "mula " + aa,
    });
    targets.push({
      title: VYAKHYA_ROOT + "/" + name,
      cachePath: path.join(RAW_DIR, "vyakhya", aa + ".wikitext.json"),
      label: "vyakhya " + aa,
    });
  }

  console.log("[Crawl] Astadhyayi (" + String(targets.length) + " pages) from sa.wikisource.org");
  const result = await crawlCached(
    targets.map((t) => ({
      url: wikisourceParseUrl(t.title),
      cachePath: t.cachePath,
      label: t.label,
    })),
    { force: opts.force },
  );

  console.log("\n[Crawl] Summary:");
  console.log("- Newly Downloaded : " + String(result.downloaded));
  console.log("- Cached (Skipped) : " + String(result.skipped));
  console.log("- Errors           : " + String(result.errors));
  console.log("[Crawl] Cached under " + RAW_DIR);
}

if (import.meta.main) {
  const force = process.argv.includes("--force");
  crawlAshtadhyayi({ force }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
