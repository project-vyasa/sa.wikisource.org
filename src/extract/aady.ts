import fs from "node:fs/promises";
import path from "node:path";
import { aadySourceUrls } from "../crawl/aady";
import { pad2 } from "../lib/devanagari-numerals";
import { ensureDir } from "../lib/wikimedia";
import { ExtractedPadaSchema } from "../schema/aady";
import {
  alignPada,
  parseMaheshvaraFromMula,
  parseMulaAdhyaya,
  parseVyakhyaAdhyaya,
  readWikitextFromParseJson,
} from "./parse-aady";

/**
 * Stage 2: Extract Aṣṭādhyāyī JSON from cached wikitext.
 *
 * Usage:
 *   bun run extract:aady
 *   bun run src/extract/aady.ts 1.1
 */

const RAW_DIR = path.resolve("data/raw/ashtadhyayi");
const EXTRACTED_DIR = path.resolve("data/extracted/ashtadhyayi");
const AUDIT_PATH = path.resolve("data/audit/ashtadhyayi-extract.txt");

function parseTarget(spec: string): { adhyaya: number; pada?: number } {
  const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected A or A.P like 1 or 1.1`);
  return { adhyaya: Number(m[1]), pada: m[2] ? Number(m[2]) : undefined };
}

async function readCachedWikitext(kind: "mula" | "vyakhya", adhyaya: number): Promise<string> {
  const file = path.join(RAW_DIR, kind, `${pad2(adhyaya)}.wikitext.json`);
  const raw = await fs.readFile(file, "utf8");
  return readWikitextFromParseJson(raw);
}

export async function extractAshtadhyayi(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const adhyayas = targets?.length
    ? [...new Set(targets.map((t) => parseTarget(t).adhyaya))]
    : [1, 2, 3, 4, 5, 6, 7, 8];

  const audit: string[] = [];
  let ok = 0;
  let failed = 0;
  let sutraTotal = 0;

  for (const adhyaya of adhyayas) {
    try {
      const mulaText = await readCachedWikitext("mula", adhyaya);
      const vyakhyaText = await readCachedWikitext("vyakhya", adhyaya);
      const mula = parseMulaAdhyaya(mulaText);
      const vyakhya = parseVyakhyaAdhyaya(vyakhyaText);
      const urls = aadySourceUrls(adhyaya);

      const wantedPadas = targets
        ?.map(parseTarget)
        .filter((t) => t.adhyaya === adhyaya && t.pada)
        .map((t) => t.pada!);

      const padas = wantedPadas?.length
        ? wantedPadas
        : [...new Set([...mula.keys()].map((k) => Number(k.slice(3, 5))))].sort(
            (a, b) => a - b,
          );

      for (const pada of padas) {
        const result = alignPada({
          adhyaya,
          pada,
          mula,
          vyakhya,
          sourceUrls: urls,
        });
        const outDir = path.join(EXTRACTED_DIR, pad2(adhyaya));
        await ensureDir(outDir);
        const outFile = path.join(outDir, `${pad2(adhyaya)}-${pad2(pada)}.json`);
        await fs.writeFile(outFile, JSON.stringify(result.pada, null, 2) + "\n", "utf8");
        ok += 1;
        sutraTotal += result.pada.sutras.length;
        console.log(
          `[Extract] ${adhyaya}.${pada}: ${result.pada.sutras.length} sūtra(s)` +
            ` missing_vyakhya=${result.missingVyakhya.length}` +
            ` extra_vyakhya=${result.unmatchedVyakhya.length}`,
        );
        for (const key of result.missingVyakhya) {
          audit.push(`missing_vyakhya ${key}`);
        }
        for (const key of result.unmatchedVyakhya) {
          audit.push(`unmatched_vyakhya ${key}`);
        }
      }
    } catch (err) {
      failed += 1;
      console.error(
        `[Extract] FAILED adhyāya ${adhyaya}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  try {
    const mah = parseMaheshvaraFromMula(
      await readCachedWikitext("mula", 1),
      aadySourceUrls(1).mula,
    );
    const pada = ExtractedPadaSchema.parse({
      source_urls: { mula: aadySourceUrls(1).mula, vyakhya: aadySourceUrls(1).mula },
      adhyaya: "09",
      pada: "01",
      sutras: mah.sutras.map((s) => ({
        sutra: String(s.n).padStart(3, "0"),
        mula_devanagari: s.text,
        vyakhya_hindi: null,
        udaharana: null,
      })),
    });
    await ensureDir(path.join(EXTRACTED_DIR, "09"));
    await fs.writeFile(
      path.join(EXTRACTED_DIR, "09", "09-01.json"),
      JSON.stringify(pada, null, 2) + "\n",
      "utf8",
    );
    console.log("[Extract] maheshvara: " + String(mah.sutras.length) + " sūtra(s) as 09.01");
  } catch (err) {
    audit.push(`maheshvara ${err instanceof Error ? err.message : String(err)}`);
    console.warn("[Extract] Maheśvara skipped:", err instanceof Error ? err.message : err);
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. padas_ok=${ok} failed_adhyaya=${failed} sutras=${sutraTotal}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractAshtadhyayi(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
