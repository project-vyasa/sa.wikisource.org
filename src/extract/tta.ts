import fs from "node:fs/promises";
import path from "node:path";
import { TTA_ACCENTED_PAGE, ttaSourceUrl } from "../crawl/tta";
import { ensureDir } from "../lib/wikimedia";
import { parseDumpRecords, readWikitextFromParseJson } from "./parse-tts";
import { groupTtaPrasnas } from "./parse-tta";

/**
 * Stage 2: Extract Taittirīya Āraṇyaka JSON from the cached accented dump.
 *
 * Usage:
 *   bun run extract:tta
 *   bun run src/extract/tta.ts 5
 */

const RAW_DIR = path.resolve("data/raw/taittiriya-aranyaka");
const EXTRACTED_DIR = path.resolve("data/extracted/taittiriya-aranyaka");
const AUDIT_PATH = path.resolve("data/audit/taittiriya-aranyaka-extract.txt");

function parseTarget(spec: string): number {
  const m = /^(\d{1,2})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid spec "${spec}"; expected praśna like 5`);
  return Number(m[1]);
}

export async function extractTaittiriyaAranyaka(targets?: string[]) {
  await ensureDir(EXTRACTED_DIR);
  await ensureDir(path.dirname(AUDIT_PATH));

  const file = path.join(RAW_DIR, "accented", TTA_ACCENTED_PAGE.file);
  const raw = await fs.readFile(file, "utf8");
  const records = parseDumpRecords(readWikitextFromParseJson(raw), {
    parts: 3,
    twoPartPrasna: 3,
  });

  let prasnas = groupTtaPrasnas(records, ttaSourceUrl());
  if (targets?.length) {
    const wanted = new Set(targets.map(parseTarget));
    prasnas = prasnas.filter((p) => wanted.has(Number(p.prasna)));
  }

  const audit: string[] = [];
  let ok = 0;
  let mantras = 0;
  for (const prasna of prasnas) {
    const outFile = path.join(EXTRACTED_DIR, `${prasna.prasna}.json`);
    await fs.writeFile(outFile, JSON.stringify(prasna, null, 2) + "\n", "utf8");
    ok += 1;
    const n = prasna.anuvakas.reduce((s, a) => s + a.mantras.length, 0);
    mantras += n;
    console.log(
      `[Extract] ${Number(prasna.prasna)}: ${prasna.anuvakas.length} anuvāka(s), ${n} mantra(s)`,
    );
    for (const anu of prasna.anuvakas) {
      if (anu.anuvaka === "00") audit.push(`anuvaka_zero ${prasna.prasna}`);
    }
  }

  await fs.writeFile(AUDIT_PATH, audit.join("\n") + (audit.length ? "\n" : ""), "utf8");
  console.log(`[Extract] Done. prasnas=${ok} mantras=${mantras}`);
  console.log(`[Extract] Audit: ${path.relative(process.cwd(), AUDIT_PATH)} (${audit.length} line(s))`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  extractTaittiriyaAranyaka(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
