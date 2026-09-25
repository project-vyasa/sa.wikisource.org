import fs from "node:fs/promises";
import path from "node:path";
import { SV_ACCENTED_PAGE, svSourceUrl } from "../crawl/sv";
import { pad2 } from "../lib/devanagari-numerals";
import { ensureDir } from "../lib/wikimedia";
import {
  groupSamavedaSegments,
  parseSamavedaDump,
  readWikitextFromParseJson,
} from "./parse-sv";

/**
 * Stage 2: Extract Kauthuma Sāmaveda JSON from the cached accented dump.
 *
 * Usage:
 *   bun run extract:sv
 *   bun run src/extract/sv.ts 01.01.01
 */

const RAW_DIR = path.resolve("data/raw/kauthuma-samhita");
const EXTRACTED_DIR = path.resolve("data/extracted/kauthuma-samhita");
const AUDIT_PATH = path.resolve("data/audit/kauthuma-samhita-extract.txt");

function parseTarget(spec: string): { arcika: number; prapāṭhaka: number; segment: number } {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/.exec(spec.trim());
  if (!m) {
    throw new Error(`Invalid spec "${spec}"; expected arcika.prapāṭhaka.segment like 01.01.01`);
  }
  return { arcika: Number(m[1]), prapāṭhaka: Number(m[2]), segment: Number(m[3]) };
}

export async function extractKauthumaSamhita(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const file = path.join(RAW_DIR, "accented", SV_ACCENTED_PAGE.file);
  const raw = await fs.readFile(file, "utf8");
  let segments = groupSamavedaSegments(
    parseSamavedaDump(readWikitextFromParseJson(raw)),
    svSourceUrl(),
  );

  if (targets?.length) {
    const wanted = new Set(
      targets.map((t) => {
        const p = parseTarget(t);
        return [pad2(p.arcika), pad2(p.prapāṭhaka), pad2(p.segment)].join(".");
      }),
    );
    segments = segments.filter((s) =>
      wanted.has([s.arcika, s.prapāṭhaka, s.segment].join(".")),
    );
  }

  const audit: string[] = [];
  let mantras = 0;
  for (const seg of segments) {
    const outDir = path.join(EXTRACTED_DIR, seg.arcika, seg.prapāṭhaka);
    await ensureDir(outDir);
    const outFile = path.join(outDir, `${seg.segment}.json`);
    await fs.writeFile(outFile, JSON.stringify(seg, null, 2) + "\n", "utf8");
    mantras += seg.mantras.length;
    console.log(
      `[Extract] ${seg.arcika}.${seg.prapāṭhaka}.${seg.segment} (${seg.segment_kind}): ${seg.mantras.length} mantra(s)`,
    );
    if (!seg.header) audit.push(`missing_header ${seg.arcika}.${seg.prapāṭhaka}.${seg.segment}`);
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. segments=${segments.length} mantras=${mantras}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractKauthumaSamhita(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
