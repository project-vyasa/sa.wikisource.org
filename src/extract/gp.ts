import fs from "node:fs/promises";
import path from "node:path";
import { GP_PAGE, gpSourceUrl } from "../crawl/gp";
import { pad2 } from "../lib/devanagari-numerals";
import { ensureDir } from "../lib/wikimedia";
import { parseGopathaDump, unitKey } from "./parse-gopatha";
import { readWikitextFromParseJson } from "./parse-tts";

/**
 * Stage 2: Extract Gopatha Brāhmaṇa JSON from cached wikitext.
 *
 * Usage:
 *   bun run extract:gp
 *   bun run src/extract/gp.ts 1.1.1
 */

const RAW_DIR = path.resolve("data/raw/gopatha-brahmana");
const EXTRACTED_DIR = path.resolve("data/extracted/gopatha-brahmana");
const AUDIT_PATH = path.resolve("data/audit/gopatha-brahmana-extract.txt");

function parseTarget(spec: string): { kanda: number; prapathaka: number; kandika: number } {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected K.P.K like 1.1.1`);
  return { kanda: Number(m[1]), prapathaka: Number(m[2]), kandika: Number(m[3]) };
}

export async function extractGopathaBrahmana(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const wanted = targets?.length
    ? new Set(
        targets.map((t) => {
          const p = parseTarget(t);
          return `${pad2(p.kanda)}-${pad2(p.prapathaka)}-${pad2(p.kandika)}`;
        }),
      )
    : null;

  const file = path.join(RAW_DIR, GP_PAGE.file);
  const raw = await fs.readFile(file, "utf8");
  const segments = parseGopathaDump(readWikitextFromParseJson(raw));

  const byUnit = new Map<string, { kanda: number; prapathaka: number; kandika: number; padas: Array<{ pada: string; marker: string; body: string }> }>();

  for (const seg of segments) {
    const key = unitKey(seg);
    let unit = byUnit.get(key);
    if (!unit) {
      unit = { kanda: seg.kanda, prapathaka: seg.prapathaka, kandika: seg.kandika, padas: [] };
      byUnit.set(key, unit);
    }
    unit.padas.push({ pada: seg.pada, marker: seg.marker, body: seg.body });
  }

  const audit: string[] = [];
  let units = 0;
  let padas = 0;

  for (const [key, unit] of [...byUnit.entries()].sort()) {
    if (wanted && !wanted.has(key)) continue;
    const out = {
      source_url: gpSourceUrl(),
      source_file: GP_PAGE.file,
      kanda: pad2(unit.kanda),
      unit: key,
      prapathaka: pad2(unit.prapathaka),
      kandika: pad2(unit.kandika),
      padas: unit.padas,
    };
    const outDir = path.join(EXTRACTED_DIR, out.kanda);
    await ensureDir(outDir);
    await fs.writeFile(path.join(outDir, `${out.prapathaka}-${out.kandika}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
    units += 1;
    padas += out.padas.length;
    console.log(`[Extract] ${Number(out.kanda)}.${Number(out.prapathaka)}.${Number(out.kandika)}: ${out.padas.length} pada(s)`);
  }

  const kandas = new Set(segments.map((s) => s.kanda));
  if (!kandas.has(1)) audit.push("missing_kanda_1");
  if (segments[0]?.body && !segments[0].body.includes("ब्रह्म")) audit.push("unexpected_opening");

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. units=${units} padas=${padas} (WS dump: kandas ${[...kandas].sort().join(",")})`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractGopathaBrahmana(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
